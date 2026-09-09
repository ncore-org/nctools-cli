import { createWorker } from "tesseract.js";
import {
  createToolCli,
  ConversionResult,
  readFileBuffer,
  replaceExtension,
  writeFile,
  OcrFailedError,
  InvalidArgumentError,
  type Logger,
} from "@nctools/core";

export interface OcrToTextOptions {
  input?: string;
  output?: string;
  lang?: string;
  logger: Logger;
}

export type OcrProgress = (p: number) => void;

/**
 * OCR an image (PNG/JPG/BMP/WebP) to text using Tesseract.
 * `lang` is a "+"-joined set (e.g. "eng+slk"), default "eng".
 */
export async function ocrImage(imageBuffer: Buffer, lang: string): Promise<string> {
  const worker = await createWorker(lang);
  try {
    const { data } = await worker.recognize(imageBuffer);
    return data.text ?? "";
  } catch (err) {
    throw new OcrFailedError("OCR failed — is the image legible? Are the language files reachable?", err);
  } finally {
    await worker.terminate();
  }
}

export async function ocrToText(opts: OcrToTextOptions): Promise<ConversionResult> {
  const input = opts.input ?? "";
  if (!input) throw new InvalidArgumentError("Missing input file — use --input <image>");
  const imageBuffer = await readFileBuffer(input);
  const lang = opts.lang ?? "eng";
  const text = await ocrImage(imageBuffer, lang);
  const output = opts.output ?? replaceExtension(input, "txt");

  if (!opts.output) {
    process.stdout.write(text);
  } else {
    await writeFile(output, Buffer.from(text, "utf8"));
  }

  if (opts.logger) {
    if (opts.logger.json) {
      opts.logger.jsonOut(new ConversionResult({
        tool: "ocr-to-text",
        inputFile: input,
        outputFile: output,
        size: Buffer.byteLength(text),
        meta: { lang, chars: text.length },
      }).toJSON());
    } else {
      opts.logger.success(`OCR'd ${input} → ${output} (${text.length} chars)`);
    }
  }

  return new ConversionResult({
    tool: "ocr-to-text",
    inputFile: input,
    outputFile: output,
    size: Buffer.byteLength(text),
    meta: { lang, chars: text.length },
  });
}

export function cli(name = "nctools-ocr-to-text") {
  return createToolCli({
    name,
    description: "Extract editable text from images/screenshots via OCR (nctools.eu/tools/ocr-to-text).",
    configure: (cmd) => {
      cmd.option("--lang <langs>", "Tesseract language pack(s), '+' separated (e.g. eng+slk)", "eng");
    },
    run: async (raw) => {
      const o = raw as unknown as OcrToTextOptions;
      await ocrToText({ ...o, logger: o.logger });
    },
  });
}

export default cli;