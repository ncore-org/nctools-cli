import { PDFDocument, PageSizes } from "pdf-lib";
import {
  createToolCli,
  ConversionResult,
  readFileBuffer,
  writeFile,
  InvalidArgumentError,
  type Logger,
} from "@nctools/core";

export interface ImagesToPdfOptions {
  input?: string;
  output?: string;
  pageSize?: "fit" | "a4" | "letter";
  logger: Logger;
}

/** Detect image MIME from extension, then embed into a PDF page. */
export async function embedImage(doc: PDFDocument, file: string, pageSize: string): Promise<void> {
  const buffer = await readFileBuffer(file);
  const data = new Uint8Array(buffer);
  const lower = file.toLowerCase();
  let embedded: { width: number; height: number; ref: unknown };
  if (lower.endsWith(".png")) {
    const img = await doc.embedPng(data);
    embedded = { width: img.width, height: img.height, ref: img };
  } else if (lower.endsWith(".webp") || lower.endsWith(".gif")) {
    throw new InvalidArgumentError(
      `${lower.endsWith(".webp") ? "WebP" : "GIF"} embedding is not supported in Node CLI — convert the file to PNG or JPG first.`,
    );
  } else {
    const img = await doc.embedJpg(data);
    embedded = { width: img.width, height: img.height, ref: img };
  }

  const { width, height, ref } = embedded;
  const draw = (page: { drawImage: (img: unknown, opts: object) => void }, pw: number, ph: number) => {
    if (pageSize === "fit") {
      page.drawImage(ref, { x: 0, y: 0, width, height });
      return;
    }
    const ratio = Math.min(pw / width, ph / height);
    const w = width * ratio;
    const h = height * ratio;
    page.drawImage(ref, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
  };

  if (pageSize === "a4") {
    const [pw, ph] = PageSizes.A4;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    draw(doc.addPage(PageSizes.A4) as any, pw, ph);
  } else if (pageSize === "letter") {
    const [pw, ph] = PageSizes.Letter;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    draw(doc.addPage(PageSizes.Letter) as any, pw, ph);
  } else {
    // fit = original pixel size (~1px per pt)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    draw(doc.addPage([width, height]) as any, width, height);
  }
}

export async function imagesToPdf(opts: ImagesToPdfOptions): Promise<ConversionResult> {
  const files = ((opts as unknown as { args?: string[] }).args ?? (opts.input ? [opts.input] : [])) as string[];
  if (files.length === 0) throw new InvalidArgumentError("Provide at least one image — pass file args or --input.");
  const pageSize = opts.pageSize ?? "fit";
  const doc = await PDFDocument.create();
  for (const file of files) await embedImage(doc, file, pageSize);
  const bytes = await doc.save();
  const output = opts.output ?? "images.pdf";
  await writeFile(output, Buffer.from(bytes));

  if (opts.logger) {
    if (opts.logger.json) {
      opts.logger.jsonOut(new ConversionResult({
        tool: "images-to-pdf",
        inputFile: files.join(","),
        outputFile: output,
        size: bytes.length,
        meta: { images: files.length, pageSize },
      }).toJSON());
    } else {
      opts.logger.success(`Combined ${files.length} image${files.length === 1 ? "" : "s"} → ${output} (${bytes.length} bytes)`);
    }
  }

  return new ConversionResult({
    tool: "images-to-pdf",
    inputFile: files.join(","),
    outputFile: output,
    size: bytes.length,
    meta: { images: files.length, pageSize },
  });
}

export function cli(name = "nctools-images-to-pdf") {
  return createToolCli({
    name,
    description: "Combine one or more images into a single PDF (nctools.eu/tools/images-to-pdf).",
    configure: (cmd) => {
      cmd.option("--page-size <size>", "Page size: fit, a4, letter", "fit");
    },
    run: async (raw) => {
      const o = raw as unknown as ImagesToPdfOptions & { args?: string[] };
      await imagesToPdf({ ...o, logger: o.logger });
    },
  });
}

export default cli;