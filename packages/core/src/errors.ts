/**
 * Typed error hierarchy for nctools CLI tools.
 * Lets each tool report exact, machine-friendly failures.
 */

export type ErrorCode =
  | "INPUT_NOT_FOUND"
  | "INPUT_IS_DIRECTORY"
  | "OUTPUT_NOT_WRITABLE"
  | "READ_FAILED"
  | "WRITE_FAILED"
  | "UNSUPPORTED_FORMAT"
  | "CONVERSION_FAILED"
  | "OCR_FAILED"
  | "INVALID_ARGUMENT"
  | "INTERNAL";

export class NtoolsError extends Error {
  readonly code: ErrorCode;
  readonly cause?: unknown;

  constructor(code: ErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "NtoolsError";
    this.code = code;
    this.cause = cause;
  }
}

export class InputNotFoundError extends NtoolsError {
  constructor(path: string) {
    super("INPUT_NOT_FOUND", `Input file not found: ${path}`);
    this.name = "InputNotFoundError";
  }
}

export class InputIsDirectoryError extends NtoolsError {
  constructor(path: string) {
    super("INPUT_IS_DIRECTORY", `Input path is a directory, expected a file: ${path}`);
    this.name = "InputIsDirectoryError";
  }
}

export class OutputNotWritableError extends NtoolsError {
  constructor(path: string, cause?: unknown) {
    super("OUTPUT_NOT_WRITABLE", `Output path is not writable: ${path}`, cause);
    this.name = "OutputNotWritableError";
  }
}

export class ReadFailedError extends NtoolsError {
  constructor(path: string, cause?: unknown) {
    super("READ_FAILED", `Failed to read file: ${path}`, cause);
    this.name = "ReadFailedError";
  }
}

export class WriteFailedError extends NtoolsError {
  constructor(path: string, cause?: unknown) {
    super("WRITE_FAILED", `Failed to write file: ${path}`, cause);
    this.name = "WriteFailedError";
  }
}

export class UnsupportedFormatError extends NtoolsError {
  constructor(format: string) {
    super("UNSUPPORTED_FORMAT", `Unsupported format: ${format}`);
    this.name = "UnsupportedFormatError";
  }
}

export class ConversionFailedError extends NtoolsError {
  constructor(message: string, cause?: unknown) {
    super("CONVERSION_FAILED", message, cause);
    this.name = "ConversionFailedError";
  }
}

export class OcrFailedError extends NtoolsError {
  constructor(message: string, cause?: unknown) {
    super("OCR_FAILED", message, cause);
    this.name = "OcrFailedError";
  }
}

export class InvalidArgumentError extends NtoolsError {
  constructor(message: string) {
    super("INVALID_ARGUMENT", message);
    this.name = "InvalidArgumentError";
  }
}

export class InternalError extends NtoolsError {
  constructor(message: string, cause?: unknown) {
    super("INTERNAL", message, cause);
    this.name = "InternalError";
  }
}

/** Convert any thrown value into an NtoolsError. */
export function asNtoolsError(err: unknown, fallback = "Unexpected error"): NtoolsError {
  if (err instanceof NtoolsError) return err;
  if (err instanceof Error) return new InternalError(err.message, err);
  return new InternalError(fallback, err);
}