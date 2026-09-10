/**
 * Shared Commander-based CLI builder. Each tool package defines its command
 * via `createToolCli`, which wires up standard options (input, output,
 * quiet, json), error handling, and version printing — consistently.
 */
import { Command } from "commander";
import { asNtoolsError } from "./errors.js";
import { Logger } from "./logger.js";
import { VERSION, NAME } from "./version.js";

export interface CliSpec {
  name: string;
  description: string;
  /** e.g. "-p, --paste" not needed; tools add their own options via configure. */
  configure?: (cmd: Command) => void;
  /** The actual work. Receives parsed options + commander keys. */
  run: (opts: Record<string, unknown>) => Promise<void>;
  args?: string[];
}

export function createToolCli(spec: CliSpec): Command {
  const program = new Command();
  program
    .name(spec.name)
    .description(spec.description)
    .version(VERSION, "-v, --version")
    .option("-i, --input <file>", "Input file path")
    .option("-o, --output <file>", "Output file path")
    .option("--quiet", "Suppress non-essential output")
    .option("--json", "Emit a machine-readable JSON result")
    .showHelpAfterError();

  if (spec.args && spec.args.length > 0) {
    program.argument(spec.args[0] as string);
  }
  program.allowExcessArguments(true);

  spec.configure?.(program);

  program.action(async (...hookArgs) => {
    // Commander passes declared positional args, then the options object,
    // then the Command. Reading the Command.opts() is the robust way.
    const command = hookArgs[hookArgs.length - 1] as Command;
    const rawOpts = command.opts() as Record<string, unknown>;
    const positional = (command.args as unknown[]) ?? [];
    const logger = new Logger({
      quiet: Boolean((rawOpts as { quiet?: boolean }).quiet),
      json: Boolean((rawOpts as { json?: boolean }).json),
    });
    const merged = {
      ...rawOpts,
      args: positional,
      logger,
    };
    try {
      await spec.run(merged);
    } catch (err) {
      const e = asNtoolsError(err);
      if (logger.json) {
        logger.jsonOut({
          ok: false,
          tool: spec.name,
          code: e.code,
          error: e.message,
        });
        process.exitCode = 1;
      } else {
        logger.error(`[${e.code}] ${e.message}`);
        process.exitCode = 1;
      }
    }
  });

  return program;
}

export { NAME };

/** Run a built CLI program with process.argv. */
export function runCli(program: Command): void {
  void program.parseAsync(process.argv);
}

export * from "./errors.js";
export * from "./result.js";