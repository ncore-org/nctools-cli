/**
 * nctools Core — shared CLI infrastructure.
 *
 * Provides: option parsing helpers, input/output path resolution, a clean
 * JSON / text result formatter, typed errors and a light console logger.
 * Every individual tool CLI is built on top of this package so behaviour
 * stays consistent across the whole nctools CLI family.
 */

export * from "./errors.js";
export * from "./io.js";
export * from "./logger.js";
export * from "./option.js";
export * from "./pdf.js";
export * from "./progress.js";
export * from "./result.js";
export * from "./version.js";
export * from "./cli.js";