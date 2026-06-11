import { CefFormatException } from './CefFormatException';

/**
 * Thrown when the streaming writer is asked to perform an operation that does
 * not fit its current internal state.
 *
 * Typical triggers:
 *   - adding a parameter after the first vote has been emitted;
 *   - constructing a `Cef` with neither a file nor a string target, or with
 *     both at once;
 *   - parsing a vote-line string that ends up without a ranking.
 */
export class InvalidWriterStateException extends CefFormatException {}
