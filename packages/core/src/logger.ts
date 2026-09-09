/**
 * Lightweight console logger with quiet/json modes and colored output.
 */
import picocolors from "picocolors";

export interface LoggerOptions {
  quiet?: boolean;
  json?: boolean;
}

export class Logger {
  readonly quiet: boolean;
  readonly json: boolean;

  constructor(opts: LoggerOptions = {}) {
    this.quiet = opts.quiet ?? false;
    this.json = opts.json ?? false;
  }

  /** Human-readable informational message (suppressed in quiet/json). */
  info(msg: string, value?: unknown): void {
    if (this.quiet || this.json) return;
    process.stdout.write(`${picocolors.cyan("ℹ")} ${msg}${value !== undefined ? ` ${picocolors.dim(String(value))}` : ""}\n`);
  }

  /** Human-readable success message (suppressed in quiet/json). */
  success(msg: string): void {
    if (this.quiet || this.json) return;
    process.stdout.write(`${picocolors.green("✔")} ${msg}\n`);
  }

  /** Human-readable warning (suppressed in quiet, kept in json). */
  warn(msg: string): void {
    if (this.quiet) return;
    const line = `${picocolors.yellow("⚠")} ${msg}`;
    if (this.json) {
      process.stderr.write(`${line}\n`);
    } else {
      process.stderr.write(`${line}\n`);
    }
  }

  /** Human-readable error on stderr. */
  error(msg: string): void {
    process.stderr.write(`${picocolors.red("✖")} ${msg}\n`);
  }

  /** Write a raw JSON object to stdout. */
  jsonOut(data: unknown): void {
    process.stdout.write(`${JSON.stringify(data)}\n`);
  }
}