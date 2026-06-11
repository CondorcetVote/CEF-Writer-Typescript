import * as fs from 'node:fs';

import { CommentLine } from './CommentLine';
import {
  CefWriteException,
  InvalidValueException,
  InvalidWriterStateException,
  ReservedCharacterException,
} from './Exception';
import type { ParameterInterface } from './Parameter';
import { VoteLine } from './VoteLine';

/**
 * A sink the writer can stream lines into, mirroring the contract of PHP's
 * `\SplFileObject::fwrite()`: `write()` returns the number of bytes actually
 * written. Returning fewer bytes than supplied (or throwing) signals an I/O
 * failure and triggers a {@link CefWriteException}.
 */
export interface WriteTarget {
  write(chunk: string): number;
}

/**
 * A mutable string sink, the idiomatic TypeScript stand-in for PHP's
 * "string passed by reference" target. The writer appends every line to it;
 * read the accumulated document back with {@link toString} (or {@link value}).
 */
export class StringBuffer {
  private content = '';

  public append(chunk: string): void {
    this.content += chunk;
  }

  public get value(): string {
    return this.content;
  }

  public toString(): string {
    return this.content;
  }
}

/**
 * A {@link WriteTarget} backed by a real file descriptor, opened in truncating
 * write mode. Created automatically when a filesystem path is passed to the
 * {@link Cef} constructor.
 */
export class FileWriteTarget implements WriteTarget {
  private readonly fd: number;

  private closed = false;

  public constructor(path: string) {
    this.fd = fs.openSync(path, 'w');
  }

  public write(chunk: string): number {
    return fs.writeSync(this.fd, Buffer.from(chunk, 'utf-8'));
  }

  public close(): void {
    if (!this.closed) {
      fs.closeSync(this.fd);
      this.closed = true;
    }
  }
}

/**
 * Options accepted by the {@link Cef} constructor. Exactly one of `file` or
 * `string` must be provided.
 */
export interface CefOptions {
  /**
   * A filesystem path (opened in truncating write mode) or any
   * {@link WriteTarget} (e.g. an already-open {@link FileWriteTarget}).
   */
  file?: string | WriteTarget;

  /**
   * A {@link StringBuffer} the writer appends every line to.
   */
  string?: StringBuffer;
}

/**
 * Streaming writer for a single Condorcet Election Format document.
 *
 * Each `add*()` call emits one line to the underlying target *immediately* —
 * the library never buffers more than a single line in memory and previously
 * written content cannot be edited.
 *
 * The target is chosen at construction time:
 *   - a {@link WriteTarget} (passed through);
 *   - a filesystem path (opened with mode `w`);
 *   - a {@link StringBuffer} that the writer will append to.
 *
 * # Phases
 *
 * Parameters must be emitted before votes. Comments and empty lines may be
 * emitted at any time. Once the first {@link VoteLine} is written, calling
 * {@link addParameter} throws an {@link InvalidWriterStateException}.
 *
 * # autoFormat
 *
 * When `true` (default), the writer follows the visually relaxed flavor of the
 * spec — spaces around `>`, `=`, `;`, `,`; one blank line automatically
 * inserted between the parameter block and the first vote. When `false`, the
 * most compact form is emitted.
 */
export class Cef {
  public autoFormat = true;

  /**
   * The active file target, or `null` when writing to a string.
   */
  public readonly file: WriteTarget | null;

  /**
   * Reference to the caller's string buffer in string mode, `null` in file
   * mode.
   */
  private readonly stringTarget: StringBuffer | null;

  private parameterEmitted = false;

  private voteEmitted = false;

  private autoSeparatorWritten = false;

  /**
   * Exactly one of `options.file` or `options.string` must be provided.
   *
   * @throws {CefFormatException}
   */
  public constructor(options: CefOptions = {}) {
    const hasFile = options.file !== undefined;
    const hasString = options.string !== undefined;

    if (hasFile === hasString) {
      throw new InvalidWriterStateException(
        'Exactly one of file or string must be provided to the Cef constructor.'
      );
    }

    if (hasString) {
      this.file = null;
      this.stringTarget = options.string as StringBuffer;

      return;
    }

    this.stringTarget = null;

    const file = options.file as string | WriteTarget;

    if (typeof file === 'string') {
      this.file = new FileWriteTarget(file);
    } else if (file !== null && typeof file === 'object' && typeof file.write === 'function') {
      this.file = file;
    } else {
      throw new InvalidWriterStateException(
        'The file option must be a string path or a WriteTarget.'
      );
    }
  }

  /**
   * Emit a parameter line `#/Name: value`.
   *
   * @throws {CefFormatException} if a vote has already been written
   */
  public addParameter(parameter: ParameterInterface): this {
    if (this.voteEmitted) {
      throw new InvalidWriterStateException('Parameters must be written before any vote line.');
    }

    const separator = this.autoFormat ? ': ' : ':';
    const line =
      '#/' + parameter.getName() + separator + parameter.getFormattedValue(this.autoFormat);

    this.writeLine(line);
    this.parameterEmitted = true;

    return this;
  }

  /**
   * Emit a vote line. Locks parameter mode permanently.
   */
  public addVote(vote: VoteLine): this {
    this.writeAutoSeparatorIfNeeded();

    let line = vote.format(this.autoFormat);

    if (vote.inlineComment !== null) {
      line += this.renderInlineComment(vote.inlineComment);
    }

    this.writeLine(line);
    this.voteEmitted = true;

    return this;
  }

  /**
   * Emit a vote line directly from a pre-built string, skipping the allocation
   * of a {@link VoteLine} instance. Use this when you already have ballots as
   * text and want the fastest path to the output.
   *
   * The full CEF vote-line format is enforced — the same validation rules that
   * {@link VoteLine.fromString} applies are run via
   * {@link VoteLine.assertValidString}. In particular:
   *   - structural checks first: a single trailing line terminator
   *     (`\r\n`, `\n`, `\r`) is stripped, surrounding whitespace is trimmed,
   *     the result must be non-empty, must not contain any remaining
   *     `\r`/`\n`, and must not start with `#` (which would be a comment or a
   *     parameter line, not a vote);
   *   - format checks then: tags, ranking, weight, quantifier and inline
   *     comment are parsed and validated against every CEF rule.
   *
   * The `autoFormat` flag has no effect on a raw line: what you pass is what
   * gets written (after structural cleaning).
   *
   * @throws {CefFormatException}
   */
  public addRawVoteLine(line: string): this {
    let cleaned = line.replace(/\r\n$|[\r\n]$/, '');
    cleaned = cleaned.trim();

    if (cleaned === '') {
      throw new InvalidValueException('Raw vote line cannot be empty.');
    }

    if (/[\r\n]/.test(cleaned)) {
      throw new InvalidValueException(
        'Raw vote line must be a single line; embedded newlines are not allowed.'
      );
    }

    if (cleaned[0] === '#') {
      throw new ReservedCharacterException(
        'Raw vote line cannot start with "#"; that would be a comment or parameter line, not a vote.'
      );
    }

    VoteLine.assertValidString(cleaned);

    this.writeAutoSeparatorIfNeeded();
    this.writeLine(cleaned);
    this.voteEmitted = true;

    return this;
  }

  /**
   * Emit a vote line from a **ranking-only** string plus strictly-typed
   * companions — the secure, paranoid sibling of {@link addRawVoteLine}.
   *
   * Whereas {@link addRawVoteLine} accepts a full vote line (and therefore lets
   * the caller embed tags, a weight, a quantifier or an inline comment inside
   * the text), `addRawVote()` guarantees that `vote` carries *only* a ranking.
   * Any line break, the `||` tag separator, and every reserved character
   * (`^`, `*`, `#`, `;`, `,`, `/`) are rejected, so the string can never
   * smuggle a weight, quantifier, tag, inline comment or second vote into the
   * output. Use this when the ranking comes from an untrusted source.
   *
   * Weight, quantifier and tags are supplied exclusively through the typed
   * options. `weight` and `quantifier` are nullable and default to `null`, in
   * which case they are omitted from the output; when provided they must be
   * strictly positive. Just like {@link addRawVoteLine}, the ranking string is
   * written verbatim — its original spacing is preserved and `autoFormat` does
   * not reformat it. The `autoFormat` flag still governs the layout of the
   * library-built companions (the `||` tag separator, `^weight`, `*quantifier`).
   *
   * @throws {CefFormatException}
   */
  public addRawVote(
    vote: string,
    options: {
      quantifier?: number | null;
      weight?: number | null;
      tags?: readonly string[] | null;
    } = {}
  ): this {
    const voteLine = VoteLine.fromRawRankingString(vote, {
      tags: options.tags ?? [],
      weight: options.weight ?? null,
      quantifier: options.quantifier ?? null,
    });

    this.writeAutoSeparatorIfNeeded();
    this.writeLine(voteLine.format(this.autoFormat));
    this.voteEmitted = true;

    return this;
  }

  /**
   * Emit a standalone comment line.
   */
  public addComment(comment: CommentLine): this {
    this.writeLine(comment.format(this.autoFormat));

    return this;
  }

  /**
   * Convenience helper: build a {@link CommentLine} from raw text and emit it
   * in a single call.
   */
  public addCommentLine(text: string): this {
    return this.addComment(new CommentLine(text));
  }

  /**
   * Emit an empty line.
   */
  public addEmptyLine(): this {
    this.writeLine('');

    return this;
  }

  /**
   * Close the underlying file target, if any. No-op in string mode or when the
   * target does not expose a `close()` method.
   */
  public close(): void {
    if (this.file !== null && 'close' in this.file && typeof this.file.close === 'function') {
      (this.file as { close: () => void }).close();
    }
  }

  /**
   * Insert one blank line between the parameter block and the first vote when
   * `autoFormat` is on. Idempotent.
   */
  private writeAutoSeparatorIfNeeded(): void {
    if (
      this.autoFormat &&
      this.parameterEmitted &&
      !this.voteEmitted &&
      !this.autoSeparatorWritten
    ) {
      this.writeLine('');
      this.autoSeparatorWritten = true;
    }
  }

  private renderInlineComment(comment: string): string {
    if (!this.autoFormat) {
      return '#' + comment;
    }

    const needsLeadingSpace = comment === '' || comment[0] !== ' ';

    return ' #' + (needsLeadingSpace ? ' ' : '') + comment;
  }

  private writeLine(content: string): void {
    const line = content + '\n';

    if (this.file !== null) {
      const expected = Buffer.byteLength(line, 'utf-8');
      let written: number;

      try {
        written = this.file.write(line);
      } catch (error) {
        throw new CefWriteException(
          `Failed to write ${expected} bytes to the file target. ` +
            'The underlying handle may be closed, read-only, or out of space.',
          { cause: error }
        );
      }

      if (written < expected) {
        throw new CefWriteException(
          `Failed to write ${expected} bytes to the file target (write returned ${written}). ` +
            'The underlying handle may be closed, read-only, or out of space.'
        );
      }

      return;
    }

    if (this.stringTarget === null) {
      throw new InvalidWriterStateException(
        'Cef writer has no target: neither file nor string is set. ' +
          'This indicates a corrupted internal state that the constructor should have prevented.'
      );
    }

    this.stringTarget.append(line);
  }
}
