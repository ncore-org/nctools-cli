/**
 * PDF text extraction via the official pdfjs-dist (legacy build).
 * Reliable across PDF generators (unlike pdf-parse's bundled parser).
 */
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createRequire } from "node:module";
import * as path from "node:path";
import { readFileBuffer, getExtension } from "./io.js";
import { UnsupportedFormatError, ConversionFailedError, InvalidArgumentError } from "./errors.js";

const require = createRequire(import.meta.url);
// Resolve the bundled standard fonts so pdf.js can embed fonts (avoids the
// "Ensure that the standardFontDataUrl API parameter is provided" warning).
const PDFJS_DIR = path.dirname(require.resolve("pdfjs-dist/package.json"));
const STANDARD_FONT_DATA_URL = `file://${path.join(PDFJS_DIR, "standard_fonts")}/`;

export interface PdfTextResult {
  numPages: number;
  text: string;
  /** one entry per non-empty line */
  lines: string[];
}

interface TextItemLike {
  str?: string;
  hasEOL?: boolean;
}

/** Read a PDF and return its full text content. */
export async function extractPdf(rawBuffer: Buffer | string): Promise<PdfTextResult> {
  const buffer = typeof rawBuffer === "string" ? await readFileBuffer(rawBuffer) : rawBuffer;
  if (buffer.length === 0) throw new InvalidArgumentError("PDF file is empty.");
  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
  });
  let doc;
  try {
    doc = await loadingTask.promise;
  } catch (err) {
    throw new ConversionFailedError("Could not parse PDF (password-protected or corrupt?)", err);
  }

  const pageTexts: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    let pageText = "";
    for (const item of content.items as TextItemLike[]) {
      pageText += item.str ?? "";
      if (item.hasEOL) pageText += "\n";
    }
    pageTexts.push(pageText);
  }
  await loadingTask.destroy();

  const text = pageTexts.join("\n");
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\u0000/g, "")).filter((l) => l.length > 0);
  return { numPages: doc.numPages, text, lines };
}

export type NtoolsFileFormat = "pdf" | "image" | "text" | "unknown";

/** Classify a file extension as one of the formats nctools understands. */
export function classifyFile(file: string): NtoolsFileFormat {
  const ext = getExtension(file);
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "webp", "bmp", "gif", "tif", "tiff"].includes(ext)) return "image";
  if (["txt", "md", "text", "log", "csv"].includes(ext)) return "text";
  return "unknown";
}

export { UnsupportedFormatError };
export * from "./io.js";
export * from "./errors.js";