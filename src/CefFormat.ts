import {
  InvalidUtf8Exception,
  InvalidValueException,
  ReservedCharacterException,
} from './Exception';

/**
 * Internal helpers shared across the writer and the value objects.
 *
 * A namespace of static utilities that encode rules from the CEF specification
 * (reserved characters, blank-ballot sentinel, etc.).
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CefFormat {
  /**
   * Characters that the specification reserves for syntactic use and that
   * therefore must never appear inside any user-supplied value.
   */
  export const RESERVED_CHARACTERS: readonly string[] = [
    '>',
    '=',
    ';',
    ',',
    '#',
    '/',
    '*',
    '^',
  ];

  /**
   * Sentinel value emitted as the whole ranking of a blank ballot.
   */
  export const EMPTY_RANKING = '/EMPTY_RANKING/';

  /**
   * Tag/ranking separator on a vote line.
   */
  export const TAGS_SEPARATOR = '||';

  /**
   * Reject any value that contains a reserved character or a line break. Empty
   * strings are rejected too — this helper is meant for *required* structural
   * values (names, tags, candidate labels, …).
   *
   * @throws {CefFormatException}
   */
  export function assertValueIsClean(value: string, context: string): void {
    if (value === '') {
      throw new InvalidValueException(`${context} cannot be empty.`);
    }

    assertNoReservedNorLineBreak(value, context);
  }

  /**
   * Reject any value that contains a reserved character, a line break, a null
   * byte, or an invalid UTF-8 byte sequence. Accept the empty string. Use for
   * optionally-empty value strings (e.g. a custom parameter's free-form value).
   *
   * @throws {CefFormatException}
   */
  export function assertNoReservedNorLineBreak(value: string, context: string): void {
    assertSafeText(value, context);

    for (const reserved of RESERVED_CHARACTERS) {
      if (value.includes(reserved)) {
        throw new ReservedCharacterException(
          `${context} cannot contain the reserved character "${reserved}".`
        );
      }
    }
  }

  /**
   * Inline comments are free-form text but must stay on a single line and
   * contain only valid UTF-8 (with no null byte).
   *
   * @throws {CefFormatException}
   */
  export function assertSingleLine(value: string, context: string): void {
    assertSafeText(value, context);
  }

  /**
   * Reject any value that contains the `||` tag separator.
   *
   * The separator is the only forbidden pattern that per-character validation
   * cannot catch on its own, because `|` is not itself a reserved character.
   * Both ranking strings and tag values rely on this check.
   *
   * @throws {CefFormatException}
   */
  export function assertNoTagSeparator(value: string, context: string): void {
    if (value.includes(TAGS_SEPARATOR)) {
      throw new ReservedCharacterException(
        `${context} cannot contain the "${TAGS_SEPARATOR}" tag separator.`
      );
    }
  }

  /**
   * Verify that `value` is valid UTF-8, single-line, and contains no null byte.
   * Shared base for every value-bound assertion above.
   *
   * UTF-8 validity is checked by rejecting ill-formed strings — those carrying
   * an unpaired UTF-16 surrogate, which cannot be encoded to well-formed
   * UTF-8. This is the TypeScript analog of PHP's `mb_check_encoding()`.
   *
   * @throws {CefFormatException}
   */
  function assertSafeText(value: string, context: string): void {
    if (!isWellFormedUtf16(value)) {
      throw new InvalidUtf8Exception(`${context} contains an invalid UTF-8 byte sequence.`);
    }

    if (/[\r\n]/.test(value)) {
      throw new InvalidValueException(`${context} cannot contain a line break.`);
    }

    if (value.includes('\0')) {
      throw new InvalidValueException(`${context} cannot contain a null byte.`);
    }
  }

  /**
   * Return `true` when every UTF-16 surrogate in `value` is correctly paired,
   * i.e. the string can be encoded to well-formed UTF-8.
   */
  function isWellFormedUtf16(value: string): boolean {
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);

      if (code >= 0xd800 && code <= 0xdbff) {
        // High surrogate: must be immediately followed by a low surrogate.
        const next = value.charCodeAt(i + 1);

        if (Number.isNaN(next) || next < 0xdc00 || next > 0xdfff) {
          return false;
        }

        i++;
      } else if (code >= 0xdc00 && code <= 0xdfff) {
        // Lone low surrogate.
        return false;
      }
    }

    return true;
  }
}
