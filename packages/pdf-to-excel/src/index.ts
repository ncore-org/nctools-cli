import ExcelJS from "exceljs";
import {
  createToolCli,
  ConversionResult,
  extractPdf,
  replaceExtension,
  writeFile,
  InvalidArgumentError,
  type Logger,
} from "@nctools/core";

export interface PdfToExcelOptions {
  input?: string;
  output?: string;
  sheet?: string;
  splitOn?: string;
  logger: Logger;
}

/**
 * Heuristic table extraction: split extracted PDF text into rows; each line is
 * split on multiple consecutive spaces / tabs into cells.
 */
export function textToRows(text: string, splitOn?: string): string[][] {
  const delimiter = splitOn && splitOn.length > 0 ? new RegExp(splitOn) : /\s{2,}|\t/;
  const rows: string[][] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    rows.push(trimmed.split(delimiter).map((c) => c.trim()));
  }
  return rows;
}

/** Extract text from a PDF and coerce it into table rows. */
export async function extractPdfTableRows(input: string, splitOn?: string): Promise<string[][]> {
  const { text } = await extractPdf(input);
  return textToRows(text, splitOn);
}

export async function buildXlsx(rows: string[][], sheetName: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName.slice(0, 31) || "Sheet1");
  for (const row of rows) ws.addRow(row);
  ws.columns.forEach((col) => {
    col.width = 22;
  });
  if (rows.length > 0) ws.getRow(1).font = { bold: true };
  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out);
}

export async function pdfToExcel(opts: PdfToExcelOptions): Promise<ConversionResult> {
  const input = opts.input ?? "";
  if (!input) throw new InvalidArgumentError("Missing input file — use --input <pdf>");
  const rows = await extractPdfTableRows(input, opts.splitOn);
  const sheet = opts.sheet ?? "Extracted";
  const output = opts.output ?? replaceExtension(input, "xlsx");
  const outputBuffer = await buildXlsx(rows, sheet);
  await writeFile(output, outputBuffer);

  if (opts.logger) {
    if (opts.logger.json) {
      opts.logger.jsonOut(new ConversionResult({
        tool: "pdf-to-excel",
        inputFile: input,
        outputFile: output,
        size: outputBuffer.length,
        meta: { rows: rows.length, columns: rows[0]?.length ?? 0 },
      }).toJSON());
    } else {
      opts.logger.success(`Converted ${input} → ${output} (${outputBuffer.length} bytes)`);
    }
  }

  return new ConversionResult({
    tool: "pdf-to-excel",
    inputFile: input,
    outputFile: output,
    size: outputBuffer.length,
    meta: { rows: rows.length, columns: rows[0]?.length ?? 0 },
  });
}

export function cli(name = "nctools-pdf-to-excel") {
  return createToolCli({
    name,
    description: "Extract tables from a PDF into an .xlsx workbook (nctools.eu/tools/pdf-to-excel).",
    configure: (cmd) => {
      cmd
        .option("--sheet <name>", "Worksheet name", "Extracted")
        .option("--split-on <regex>", "Custom cell delimiter regex");
    },
    run: async (raw) => {
      const o = raw as unknown as PdfToExcelOptions;
      await pdfToExcel({ ...o, logger: o.logger });
    },
  });
}

export default cli;