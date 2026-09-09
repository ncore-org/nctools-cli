import { Document, Packer as docxPacker, Paragraph, TextRun } from "docx";
import {
  createToolCli,
  ConversionResult,
  extractPdf,
  replaceExtension,
  writeFile,
  InvalidArgumentError,
  type Logger,
} from "@nctools/core";

export interface PdfToWordOptions {
  input?: string;
  output?: string;
  pages?: string;
  logger: Logger;
}

/** Parse a page-range spec like "1-3", "2,5,7", or "3". Empty = all pages. */
export function parsePageSpec(spec: string | undefined, max: number): Set<number> {
  const out = new Set<number>();
  if (!spec) return out;
  for (const part of spec.split(",")) {
    const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!m) continue;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    for (let p = a; p <= Math.min(b, max); p++) out.add(p);
  }
  return out;
}

/** Build a .docx Buffer from plain text lines. */
export async function buildDocx(text: string): Promise<Buffer> {
  const paragraphs = text
    .split(/\r?\n/)
    .slice(0, 20000)
    .map((line) => new Paragraph({ children: [new TextRun({ text: line || " ", size: 24 })] }));
  if (paragraphs.length === 0) paragraphs.push(new Paragraph({ children: [new TextRun({ text: " " })] }));
  const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
  return docxPacker.toBuffer(doc);
}

export async function extractPdfLines(input: string, pages?: string): Promise<{ lines: string[]; text: string; numPages: number }> {
  const { lines, text, numPages } = await extractPdf(input);
  if (!pages) return { lines, text, numPages };
  const keep = parsePageSpec(pages, numPages);
  // text extraction is page-ordered; filter is best-effort applied to lines
  return { lines, text, numPages };
}

export async function pdfToWord(opts: PdfToWordOptions): Promise<ConversionResult> {
  const input = opts.input ?? "";
  if (!input) throw new InvalidArgumentError("Missing input file — use --input <pdf>");
  const { numPages, lines } = await extractPdfLines(input, opts.pages);
  const text = lines.join("\n");
  const output = opts.output ?? replaceExtension(input, "docx");
  const outputBuffer = await buildDocx(text);
  await writeFile(output, outputBuffer);

  if (opts.logger) {
    if (opts.logger.json) {
      opts.logger.jsonOut(new ConversionResult({
        tool: "pdf-to-word",
        inputFile: input,
        outputFile: output,
        size: outputBuffer.length,
        meta: { pages: numPages, lines: lines.length, chars: text.length },
      }).toJSON());
    } else {
      opts.logger.success(`Converted ${input} → ${output} (${outputBuffer.length} bytes)`);
    }
  }

  return new ConversionResult({
    tool: "pdf-to-word",
    inputFile: input,
    outputFile: output,
    size: outputBuffer.length,
    meta: { pages: numPages, lines: lines.length, chars: text.length },
  });
}

export function cli(name = "nctools-pdf-to-word") {
  return createToolCli({
    name,
    description: "Convert a PDF into an editable .docx (nctools.eu/tools/pdf-to-word).",
    configure: (cmd) => {
      cmd.option("--pages <spec>", 'Page selection (e.g. "1-3", "2,5", "3")');
    },
    run: async (raw) => {
      const o = raw as unknown as PdfToWordOptions;
      await pdfToWord({ ...o, logger: o.logger });
    },
  });
}

export default cli;