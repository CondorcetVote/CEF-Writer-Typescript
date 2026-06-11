/**
 * Thrown when writing to the underlying target (a file or string buffer) fails.
 * Distinct from {@link CefFormatException} because the cause is the I/O layer —
 * disk full, broken pipe, closed handle, read-only file — not an invalid input
 * from the caller.
 */
export class CefWriteException extends Error {
  public constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
