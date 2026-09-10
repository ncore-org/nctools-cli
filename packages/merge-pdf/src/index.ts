import { PDFDocument } from "pdf-lib";
import {
  createToolCli,
  ConversionResult,
  readFileBuffer,
  writeFile,
  InvalidArgumentError,
  ConversionFailedError,
  type Logger,
} from "@nctools/core";

export interface MergePdfOptions {
  input?: string;
  output?: string;
  logger: Logger;
}

export async function mergePdfs(opts: MergePdfOptions): Promise<ConversionResult> {
  const files = ((opts as unknown as { args?: string[] }).args ?? (opts.input ? [opts.input] : [])) as string[];
  if (files.length === 0) throw new InvalidArgumentError("Provide at least one PDF — pass file args or --input.");

  const doc = await PDFDocument.create();
  for (const file of files) {
    const buffer = await readFileBuffer(file);
    try {
      const src = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pages = await doc.copyPages(src, src.getPageIndices());
      for (const page of pages) doc.addPage(page);
    } catch {
      throw new ConversionFailedError(`Could not read PDF: ${file} (encrypted or corrupt?)`);
    }
  }

  const bytes = await doc.save();
  const output = opts.output ?? "merged.pdf";
  await writeFile(output, Buffer.from(bytes));

  if (opts.logger) {
    if (opts.logger.json) {
      opts.logger.jsonOut(new ConversionResult({
        tool: "merge-pdf",
        inputFile: files.join(","),
        outputFile: output,
        size: bytes.length,
        meta: { merged: files.length, pages: doc.getPageCount() },
      }).toJSON());
    } else {
      opts.logger.success(`Merged ${files.length} PDF${files.length === 1 ? "" : "s"} → ${output} (${bytes.length} bytes, ${doc.getPageCount()} pages)`);
    }
  }

  return new ConversionResult({
    tool: "merge-pdf",
    inputFile: files.join(","),
    outputFile: output,
    size: bytes.length,
    meta: { merged: files.length, pages: doc.getPageCount() },
  });
}

export function cli(name = "nctools-merge-pdf") {
  return createToolCli({
    name,
    description: "Merge multiple PDF files into a single document (nctools.eu/tools/merge-pdf).",
    configure: () => {
      /* all core options (input/output/quiet/json) are enough */
    },
    run: async (raw) => {
      const o = raw as unknown as MergePdfOptions & { args?: string[] };
      await mergePdfs({ ...o, logger: o.logger });
    },
  });
}

export default cli;