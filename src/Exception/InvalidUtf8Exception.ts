import { CefFormatException } from './CefFormatException';

/**
 * Thrown when a value contains a byte sequence that does not decode as valid
 * UTF-8. The CEF specification mandates UTF-8, so any non-UTF-8 input is
 * rejected before it can land in the output stream.
 *
 * In this TypeScript port — where strings are sequences of UTF-16 code units —
 * "non-UTF-8" means an ill-formed string carrying an unpaired surrogate, which
 * cannot be encoded to well-formed UTF-8.
 */
export class InvalidUtf8Exception extends CefFormatException {}
