/**
 * Input/output helpers: read files as buffer/text, write output safely,
 * derive default output paths.
 */
import { promises as fs } from "node:fs";
import * as path from "node:path";
import {
  InputIsDirectoryError,
  InputNotFoundError,
  OutputNotWritableError,
  ReadFailedError,
  WriteFailedError,
} from "./errors.js";

export interface FileInputOptions {
  encoding?: BufferEncoding;
}

/** Read a file as a Buffer (throws typed errors). */
export async function readFileBuffer(file: string): Promise<Buffer> {
  let stat;
  try {
    stat = await fs.stat(file);
  } catch {
    throw new InputNotFoundError(file);
  }
  if (stat.isDirectory()) throw new InputIsDirectoryError(file);
  try {
    return await fs.readFile(file);
  } catch (err) {
    throw new ReadFailedError(file, err);
  }
}

/** Read a text file as a string. */
export async function readFileText(file: string, encoding: BufferEncoding = "utf8"): Promise<string> {
  const buf = await readFileBuffer(file);
  return buf.toString(encoding);
}

/** Read text from stdin until EOF. */
export async function readStdin(encoding: BufferEncoding = "utf8"): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString(encoding);
}

/** Write a Buffer/file to disk, ensuring the parent directory exists. */
export async function writeFile(file: string, data: Buffer | string): Promise<void> {
  try {
    await fs.mkdir(path.dirname(path.resolve(file)), { recursive: true });
    await fs.writeFile(file, data);
  } catch (err) {
    throw new WriteFailedError(file, err);
  }
}

/**
 * Check that an output path is writable by opening it for append (does not
 * truncate existing content).
 */
export async function assertOutputWritable(file: string): Promise<void> {
  try {
    await fs.mkdir(path.dirname(path.resolve(file)), { recursive: true });
    const handle = await fs.open(file, "a");
    await handle.close();
  } catch (err) {
    throw new OutputNotWritableError(file, err);
  }
}

/** Replace a file extension with a new one and return the path. */
export function replaceExtension(file: string, newExt: string): string {
  const ext = path.extname(file);
  const base = ext ? file.slice(0, -ext.length) : file;
  return `${base}.${newExt.replace(/^\./, "")}`;
}

/** Get the lowercase extension (without leading dot) of a path. */
export function getExtension(file: string): string {
  return path.extname(file).replace(/^\./, "").toLowerCase();
}