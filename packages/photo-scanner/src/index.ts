import { PDFDocument } from "pdf-lib";
import { createWorker } from "tesseract.js";
import {
  createToolCli,
  ConversionResult,
  readFileBuffer,
  writeFile,
  InvalidArgumentError,
  OcrFailedError,
  type Logger,
} from "@nctools/core";

export interface PhotoScannerOptions {
  input?: string;
  output?: string;
  mode?: "pdf" | "text";
  lang?: string;
  logger: Logger;
}

async function imageToPdf(imagePath: string): Promise<Uint8Array> {
  const buffer = await readFileBuffer(imagePath);
  const data = new Uint8Array(buffer);
  const doc = await PDFDocument.create();
  const lower = imagePath.toLowerCase();
  let embedded;
  if (lower.endsWith(".png")) embedded = await doc.embedPng(data);
  else if (lower.endsWith(".webp") || lower.endsWith(".gif")) {
    throw new InvalidArgumentError("WebP/GIF can't be embedded in Node — convert to PNG or JPG first.");
  } else embedded = await doc.embedJpg(data);
  const page = doc.addPage([embedded.width, embedded.height]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (page as any).drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
  return doc.save();
}

async function imageToText(imagePath: string, lang: string): Promise<string> {
  const buffer = await readFileBuffer(imagePath);
  const worker = await createWorker(lang);
  try {
    const { data } = await worker.recognize(buffer);
    return data.text ?? "";
  } catch (err) {
    throw new OcrFailedError("OCR failed — is the image legible? Are language files reachable?", err);
  } finally {
    await worker.terminate();
  }
}

export async function photoScan(opts: PhotoScannerOptions): Promise<ConversionResult> {
  const input = opts.input ?? "";
  if (!input) throw new InvalidArgumentError("Missing input image — use --input <image>");
  const mode = opts.mode ?? "pdf";

  let data: Uint8Array | string;
  const output = opts.output ?? (mode === "pdf" ? "scan.pdf" : "scan.txt");

  if (mode === "pdf") {
    data = await imageToPdf(input);
    const bytes = Buffer.from(data);
    await writeFile(output, bytes);
    if (opts.logger) {
      if (opts.logger.json) {
        opts.logger.jsonOut(new ConversionResult({
          tool: "photo-scanner",
          inputFile: input,
          outputFile: output,
          size: bytes.length,
          meta: { mode: "pdf" },
        }).toJSON());
      } else {
        opts.logger.success(`Scanned ${input} → ${output} (${bytes.length} bytes)`);
      }
    }
    return new ConversionResult({
      tool: "photo-scanner",
      inputFile: input,
      outputFile: output,
      size: bytes.length,
      meta: { mode: "pdf" },
    });
  }

  const text = await imageToText(input, opts.lang ?? "eng");
  await writeFile(output, Buffer.from(text, "utf8"));
  if (opts.logger) {
    if (opts.logger.json) {
      opts.logger.jsonOut(new ConversionResult({
        tool: "photo-scanner",
        inputFile: input,
        outputFile: output,
        size: Buffer.byteLength(text),
        meta: { mode: "text", lang: opts.lang ?? "eng", chars: text.length },
      }).toJSON());
    } else {
      opts.logger.success(`Scanned ${input} → ${output} (${text.length} chars)`);
    }
  }
  return new ConversionResult({
    tool: "photo-scanner",
    inputFile: input,
    outputFile: output,
    size: Buffer.byteLength(text),
    meta: { mode: "text", lang: opts.lang ?? "eng", chars: text.length },
  });
}

export function cli(name = "nctools-photo-scanner") {
  return createToolCli({
    name,
    description: "Scan an image into a PDF or extract text via OCR (nctools.eu/tools/photo-scanner).",
    configure: (cmd) => {
      cmd
        .option("--mode <pdf|text>", "Export mode: pdf (default) or text (OCR)", "pdf")
        .option("--lang <langs>", "Tesseract language(s), '+' separated (OCR mode)", "eng");
    },
    run: async (raw) => {
      const o = raw as unknown as PhotoScannerOptions;
      await photoScan({ ...o, logger: o.logger });
    },
  });
}

export default cli;