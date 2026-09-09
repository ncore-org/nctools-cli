import PDFDocument from "pdfkit";
import {
  createToolCli,
  ConversionResult,
  readStdin,
  readFileText,
  replaceExtension,
  InvalidArgumentError,
  type Logger,
} from "@nctools/core";

export interface PasteToPdfOptions {
  input?: string;
  output?: string;
  title?: string;
  fontSize?: number;
  margin?: number;
  logger: Logger;
}

const DEFAULT_OUT = "pasted.pdf";

/** Render a PDF from text using PDFKit. */
export function renderPdf(text: string, opts: Pick<PasteToPdfOptions, "title" | "fontSize" | "margin">): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: opts.margin ?? 48,
      info: {
        Title: opts.title ?? "nctools · Paste to PDF",
        Author: "nctools.eu",
        Producer: "nctools-cli",
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    if (opts.title) {
      doc.font("Helvetica-Bold").fontSize((opts.fontSize ?? 12) + 4).text(opts.title, { characterSpacing: 0 });
      doc.moveDown();
    }
    doc.font("Helvetica").fontSize(opts.fontSize ?? 12).text(text);
    doc.end();
  });
}

export async function pasteToPdf(opts: PasteToPdfOptions): Promise<ConversionResult> {
  const input = opts.input ?? "-";
  const text = input === "-" ? await readStdin() : await readFileText(input);
  if (!text || text.trim().length === 0) {
    throw new InvalidArgumentError("No text provided — pass --input, piped stdin, or a non-empty file.");
  }

  const output = opts.output ?? (input === "-" ? DEFAULT_OUT : replaceExtension(input, "pdf"));
  const data = await renderPdf(text, opts);
  const { writeFile } = await import("@nctools/core");
  await writeFile(output, data);

  if (opts.logger) {
    if (opts.logger.json) {
      opts.logger.jsonOut(new ConversionResult({
        tool: "paste-to-pdf",
        inputFile: input,
        outputFile: output,
        size: data.length,
        meta: { pages: estimatePages(text.length) },
      }).toJSON());
    } else {
      opts.logger.success(`Converted ${input} → ${output} (${data.length} bytes)`);
    }
  }

  return new ConversionResult({
    tool: "paste-to-pdf",
    inputFile: input,
    outputFile: output,
    size: data.length,
    meta: { pages: estimatePages(text.length) },
  });
}

function estimatePages(chars: number): number {
  return Math.max(1, Math.ceil(chars / 2800));
}

export function cli(name = "nctools-paste-to-pdf") {
  return createToolCli({
    name,
    description: "Turn pasted text or a note into a polished PDF (nctools.eu/tools/paste-to-pdf).",
    args: ["[input]"],
    configure: (cmd) => {
      cmd
        .option("--title <title>", "Document title to render at the top")
        .option("--font-size <n>", "Body font size (pt)", (v) => Number(v))
        .option("--margin <n>", "Page margin in pt", (v) => Number(v));
    },
    run: async (raw) => {
      const o = raw as unknown as PasteToPdfOptions;
      await pasteToPdf({ ...o, logger: o.logger });
    },
  });
}

export default cli;