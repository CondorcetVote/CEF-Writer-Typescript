import { CefFormatException } from './CefFormatException';

/**
 * Thrown when a value contains a character that the CEF format reserves for
 * structural use and therefore forbids inside any value.
 *
 * Covers the eight spec-listed reserved characters (`> = ; , # / * ^`) as well
 * as the secondary syntactic separators the library enforces: `:` in a custom
 * parameter name, `||` in a tag, and a leading `#` on a raw vote line.
 */
export class ReservedCharacterException extends CefFormatException {}
