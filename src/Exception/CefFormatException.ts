/**
 * Base class for every input/format violation thrown by the library.
 *
 * Catch this class to handle any format-related failure uniformly; catch one
 * of the dedicated subclasses ({@link InvalidUtf8Exception},
 * {@link ReservedCharacterException}, {@link InvalidValueException},
 * {@link DuplicateCandidateException}, {@link InvalidWriterStateException}) to
 * branch on a specific kind of violation.
 *
 * Non-final on purpose so the library and downstream callers can refine the
 * hierarchy further if needed.
 */
export class CefFormatException extends Error {
  public constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
