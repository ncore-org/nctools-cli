/**
 * Small typed-option helpers shared by every tool CLI. Keeps a consistent
 * command-line interface across the nctools family.
 */
import { InvalidArgumentError } from "./errors.js";

export interface StandardOptions {
  input: string;
  output?: string;
  quiet?: boolean;
  json?: boolean;
}

/** Convert a value to a boolean, throwing on bad input. */
export function parseBoolean(value: unknown, flag: string): boolean {
  if (value === true || value === false) return value;
  const s = String(value).toLowerCase();
  if (["1", "true", "yes", "y"].includes(s)) return true;
  if (["0", "false", "no", "n"].includes(s)) return false;
  throw new InvalidArgumentError(`Invalid boolean for ${flag}: ${value}`);
}

/** Require a non-empty string argument. */
export function requireString(value: unknown, flag: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new InvalidArgumentError(`Missing required argument: ${flag}`);
  }
  return value.trim();
}

/** Range-check an integer option. */
export function parseIntInRange(value: unknown, flag: string, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new InvalidArgumentError(`${flag} must be an integer between ${min} and ${max}`);
  }
  return n;
}