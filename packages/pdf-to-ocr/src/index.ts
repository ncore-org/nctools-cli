import {
  createToolCli,
  ConversionResult,
  extractPdf,
  replaceExtension,
  writeFile,
  OcrFailedError,
  InvalidArgumentError,
  type Logger,
} from "@nctools/core";

export interface PdfToOcrOptions {
  input?: string;
  output?: string;
  lang?: string;
  logger: Logger;
}

/**
 * Make a scanned PDF searchable. A PDF with an embedded text layer is already
 * searchable — its text is exported directly. A scanned (image-only) PDF has
 * no text layer; the CLI explains how to OCR each page image (via the
 * ocr-to-text tool), keeping the documented behaviour clear and actionable.
 */
export async function pdfToOcr(opts: PdfToOcrOptions): Promise<ConversionResult> {
  const input = opts.input ?? "";
  if (!input) throw new InvalidArgumentError("Missing input file — use --input <pdf>");
  const { text, numPages } = await extractPdf(input);
  const output = opts.output ?? replaceExtension(input, "searchable.txt");

  if (text.trim().length > 0) {
    await writeFile(output, Buffer.from(text, "utf8"));
    if (opts.logger) {
      if (opts.logger.json) {
        opts.logger.jsonOut(new ConversionResult({
          tool: "pdf-to-ocr",
          inputFile: input,
          outputFile: output,
          size: Buffer.byteLength(text),
          meta: { numPages, alreadySearchable: true, chars: text.length },
        }).toJSON());
      } else {
        opts.logger.success(`Text already searchable → ${output} (${text.length} chars)`);
      }
    }
    return new ConversionResult({
      tool: "pdf-to-ocr",
      inputFile: input,
      outputFile: output,
      size: Buffer.byteLength(text),
      meta: { numPages, alreadySearchable: true, chars: text.length },
    });
  }

  throw new OcrFailedError(
    "This PDF has no embedded text layer (it is image-only). Render each page to PNG and run `nctools-ocr-to-text --input page-1.png` (or `nctools ocr-to-text`).",
  );
}

export function cli(name = "nctools-pdf-to-ocr") {
  return createToolCli({
    name,
    description: "Make a PDF searchable — extracts the text layer, or guides OCR (nctools.eu/tools/pdf-to-ocr).",
    configure: (cmd) => {
      cmd.option("--lang <langs>", "Tesseract language(s), '+' separated (used with page images)", "eng");
    },
    run: async (raw) => {
      const o = raw as unknown as PdfToOcrOptions;
      await pdfToOcr({ ...o, logger: o.logger });
    },
  });
}

export default cli;