/**
 * Standardized command result object. A conversion produces a typed result
 * that is either printed as JSON (`--json`) or as a human summary.
 */
import { writeFile } from "./io.js";
import { Logger } from "./logger.js";

export interface ConversionResultInput {
  tool: string;
  inputFile: string;
  outputFile: string;
  /** bytes written */
  size: number;
  meta?: Record<string, unknown>;
}

export class ConversionResult {
  readonly tool: string;
  readonly inputFile: string;
  readonly outputFile: string;
  readonly size: number;
  readonly meta: Record<string, unknown>;

  constructor(input: ConversionResultInput) {
    this.tool = input.tool;
    this.inputFile = input.inputFile;
    this.outputFile = input.outputFile;
    this.size = input.size;
    this.meta = input.meta ?? {};
  }

  toJSON(): {
    tool: string;
    input: string;
    output: string;
    size: number;
    meta: Record<string, unknown>;
  } {
    return {
      tool: this.tool,
      input: this.inputFile,
      output: this.outputFile,
      size: this.size,
      meta: this.meta,
    };
  }
}

/** Finish a conversion: persist data (optional) and emit result via logger. */
export async function emitResult(
  logger: Logger,
  result: ConversionResult,
  opts: { write?: boolean; data?: Buffer } = {},
): Promise<ConversionResult> {
  if (opts.write && opts.data) {
    await writeFile(result.outputFile, opts.data);
  }
  if (logger.json) {
    logger.jsonOut(result.toJSON());
  } else {
    logger.success(`Converted ${result.inputFile} → ${result.outputFile} (${result.size} bytes)`);
    if (result.meta && Object.keys(result.meta).length > 0) {
      logger.info("Details:");
      for (const [k, v] of Object.entries(result.meta)) logger.info(`  ${k}: ${String(v)}`);
    }
  }
  return result;
}