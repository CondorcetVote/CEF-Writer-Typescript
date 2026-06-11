import { CefFormat } from './CefFormat';
import { InvalidValueException, InvalidWriterStateException } from './Exception';
import { Ranking } from './Ranking';

/**
 * The five components parsed out of a full CEF vote-line string.
 */
interface ParsedComponents {
  ranking: Ranking;
  tags: string[];
  weight: number | null;
  quantifier: number | null;
  inlineComment: string | null;
}

/**
 * A single ballot.
 *
 * Instances are never built with `new`: use one of the static named
 * constructors — {@link fromRanking} (typed ranks or a {@link Ranking}),
 * {@link fromString} (a full CEF vote-line string), or
 * {@link fromRawRankingString} (a pre-validated *verbatim* ranking string).
 *
 * The ranking is held as a {@link Ranking} value object on {@link ranking}. An
 * empty ranking renders as the `/EMPTY_RANKING/` blank-ballot sentinel. In the
 * verbatim mode the ranking string is written untouched and is *not* parsed,
 * so {@link ranking} is `null`.
 *
 * Optional companions:
 *   - `tags`          — labels separated by `,`, appended before `||`;
 *   - `weight`        — strictly positive integer; only meaningful when the
 *                       `Weight Allowed` parameter is enabled in the document;
 *   - `quantifier`    — strictly positive integer that collapses identical
 *                       votes onto a single line;
 *   - `inlineComment` — free-form trailing comment introduced by `#`.
 */
export class VoteLine {
  /**
   * The parsed ranking, or `null` when the ballot was built from a verbatim
   * ranking string via {@link fromRawRankingString} — in that mode the ranking
   * is deliberately *not* parsed into a {@link Ranking} structure.
   */
  public readonly ranking: Ranking | null;

  /**
   * Verbatim, pre-validated ranking string written to the output untouched.
   * Set only in the {@link fromRawRankingString} mode; `null` otherwise (when
   * {@link ranking} carries the parsed structure instead).
   */
  private readonly rawRanking: string | null;

  public readonly tags: readonly string[];

  public readonly weight: number | null;

  public readonly quantifier: number | null;

  public readonly inlineComment: string | null;

  /**
   * @internal Use a static named constructor instead: {@link fromRanking},
   *           {@link fromString} or {@link fromRawRankingString}.
   *
   * @throws {CefFormatException} on any specification violation
   */
  private constructor(
    ranking: Ranking | string,
    verbatim: boolean,
    tags: readonly string[] = [],
    weight: number | null = null,
    quantifier: number | null = null,
    inlineComment: string | null = null
  ) {
    if (verbatim) {
      // Verbatim mode: validate the ranking string but skip parsing it into a
      // Ranking — it is written as-is by format().
      if (typeof ranking !== 'string') {
        throw new InvalidWriterStateException('Verbatim mode requires a ranking string.');
      }

      Ranking.assertValidString(ranking);
      this.ranking = null;
      this.rawRanking = ranking.trim();
    } else {
      if (!(ranking instanceof Ranking)) {
        throw new InvalidWriterStateException('Non-verbatim mode requires a Ranking instance.');
      }

      this.ranking = ranking;
      this.rawRanking = null;
    }

    this.tags = VoteLine.validateTags(tags);

    VoteLine.assertCompanions(weight, quantifier);

    if (inlineComment !== null) {
      CefFormat.assertSingleLine(inlineComment, 'Inline comment');
    }

    this.weight = weight;
    this.quantifier = quantifier;
    this.inlineComment = inlineComment;
  }

  /**
   * Build a {@link VoteLine} from typed ranks or a ready-made {@link Ranking}.
   *
   * This is the primary, typed constructor. The `ranking` argument is either an
   * ordered list of ranks (each inner list a non-empty group of tied
   * candidates; pass `[]` for the `/EMPTY_RANKING/` blank ballot) or a
   * {@link Ranking} value object.
   *
   * @throws {CefFormatException} on any specification violation
   */
  public static fromRanking(
    ranking: readonly (readonly string[])[] | Ranking,
    options: {
      tags?: readonly string[];
      weight?: number | null;
      quantifier?: number | null;
      inlineComment?: string | null;
    } = {}
  ): VoteLine {
    return new VoteLine(
      ranking instanceof Ranking ? ranking : new Ranking(ranking),
      false,
      options.tags ?? [],
      options.weight ?? null,
      options.quantifier ?? null,
      options.inlineComment ?? null
    );
  }

  /**
   * Build a {@link VoteLine} from a raw CEF vote-line string.
   *
   * Accepted shape — every component except the ranking is optional:
   *
   *     [tag1, tag2 || ] ranking [ ^weight] [ *quantifier] [# comment]
   *
   * Both the relaxed and the compact spacing flavors are accepted, e.g.
   * `"A>B^7*2"` and `"A > B ^7 * 2"` parse identically. The `/EMPTY_RANKING/`
   * sentinel is recognised as a blank ballot.
   *
   * The string is parsed into its components; the resulting `VoteLine` is then
   * constructed through the normal constructor, so every validation rule
   * (reserved characters, empty rank, duplicate candidate, positive weight /
   * quantifier) applies.
   *
   * @throws {CefFormatException}
   */
  public static fromString(line: string): VoteLine {
    const parts = VoteLine.parseStringComponents(line);

    return new VoteLine(
      parts.ranking,
      false,
      parts.tags,
      parts.weight,
      parts.quantifier,
      parts.inlineComment
    );
  }

  /**
   * Validate that `line` is a syntactically valid CEF vote line, without
   * allocating a `VoteLine` instance.
   *
   * The exact same parsing and validation pipeline that {@link fromString} uses
   * is applied — only the final object construction is skipped. Useful for hot
   * paths that want to write a pre-built line straight to the output after a
   * strict format check.
   *
   * @throws {CefFormatException}
   */
  public static assertValidString(line: string): void {
    VoteLine.parseStringComponents(line);
  }

  /**
   * Build a {@link VoteLine} from a ranking-only string, kept *verbatim*.
   *
   * The special, allocation-light sibling of {@link fromRanking}: the ranking
   * string is validated as a ranking and *nothing else* — any reserved
   * character (`^`, `*`, `#`, `;`, `,`, `/`), the `||` tag separator, or a line
   * break is rejected, so it cannot smuggle a weight, quantifier, tag or inline
   * comment — but it is **not** parsed into a {@link Ranking}. The string is
   * stored as-is and written untouched by {@link format} (only the
   * library-built companions — the `||` separator, `^weight`, `*quantifier` —
   * follow `autoFormat`). The resulting instance therefore has a `null`
   * {@link ranking}. Used by `Cef.addRawVote()`.
   *
   * @throws {CefFormatException}
   */
  public static fromRawRankingString(
    ranking: string,
    options: {
      tags?: readonly string[];
      weight?: number | null;
      quantifier?: number | null;
    } = {}
  ): VoteLine {
    return new VoteLine(
      ranking,
      true,
      options.tags ?? [],
      options.weight ?? null,
      options.quantifier ?? null
    );
  }

  /**
   * Shared parser+validator used by {@link fromString} and
   * {@link assertValidString}.
   *
   * Trims the input, extracts every component, and runs the same per-field
   * validation (reserved characters, empty rank, duplicate candidate, positive
   * weight / quantifier, single-line comment) that the constructor performs.
   * Returns the components.
   *
   * @throws {CefFormatException}
   */
  private static parseStringComponents(line: string): ParsedComponents {
    const original = line;
    let work = line.trim();

    if (work === '') {
      throw new InvalidValueException('Vote line string cannot be empty.');
    }

    let inlineComment: string | null = null;
    const hashPos = work.indexOf('#');

    if (hashPos !== -1) {
      let after = work.slice(hashPos + 1);

      if (after.startsWith(' ')) {
        after = after.slice(1);
      }

      after = VoteLine.rtrim(after);
      inlineComment = after !== '' ? after : null;
      work = VoteLine.rtrim(work.slice(0, hashPos));
    }

    if (inlineComment !== null) {
      CefFormat.assertSingleLine(inlineComment, 'Inline comment');
    }

    const rawTags: string[] = [];
    const separator = CefFormat.TAGS_SEPARATOR;
    const separatorPos = work.indexOf(separator);

    if (separatorPos !== -1) {
      const tagsPart = work.slice(0, separatorPos);
      work = work.slice(separatorPos + separator.length).trim();

      for (const rawTag of tagsPart.split(',')) {
        rawTags.push(rawTag.trim());
      }
    }

    let weight: number | null = null;
    let quantifier: number | null = null;

    const matches = /^([\s\S]*?)(?:\s*\^\s*(\d+))?(?:\s*\*\s*(\d+))?\s*$/.exec(work);

    if (matches !== null) {
      work = matches[1].trim();

      if (matches[2] !== undefined) {
        weight = Number.parseInt(matches[2], 10);
      }

      if (matches[3] !== undefined) {
        quantifier = Number.parseInt(matches[3], 10);
      }
    }

    if (weight !== null && weight < 1) {
      throw new InvalidValueException('Weight must be a positive integer.');
    }

    if (quantifier !== null && quantifier < 1) {
      throw new InvalidValueException('Quantifier must be a positive integer.');
    }

    if (work === '') {
      throw new InvalidWriterStateException(`Vote line "${original.trim()}" has no ranking.`);
    }

    return {
      ranking: Ranking.fromString(work),
      tags: VoteLine.validateTags(rawTags),
      weight,
      quantifier,
      inlineComment,
    };
  }

  /**
   * Render the ballot — *without* trailing newline or inline comment — using
   * the spacing flavor selected by `autoFormat`.
   */
  public format(autoFormat = true): string {
    return this.assembleLine(this.renderRanking(autoFormat), autoFormat);
  }

  /**
   * Return the ranking part of the line: the verbatim string in raw mode, or
   * the parsed ranking rendered with `autoFormat` otherwise.
   */
  private renderRanking(autoFormat: boolean): string {
    if (this.rawRanking !== null) {
      return this.rawRanking;
    }

    if (this.ranking === null) {
      throw new InvalidWriterStateException(
        'VoteLine has neither a parsed ranking nor a verbatim ranking string.'
      );
    }

    return this.ranking.format(autoFormat);
  }

  /**
   * Reject a non-null, non-positive weight or quantifier.
   *
   * @throws {CefFormatException}
   */
  private static assertCompanions(weight: number | null, quantifier: number | null): void {
    if (weight !== null && (!Number.isInteger(weight) || weight < 1)) {
      throw new InvalidValueException('Weight must be a positive integer.');
    }

    if (quantifier !== null && (!Number.isInteger(quantifier) || quantifier < 1)) {
      throw new InvalidValueException('Quantifier must be a positive integer.');
    }
  }

  /**
   * Wrap a ranking string with the tag prefix and the weight / quantifier
   * suffix, using the spacing flavor selected by `autoFormat`.
   */
  private assembleLine(ranking: string, autoFormat: boolean): string {
    let line = '';

    if (this.tags.length > 0) {
      const tagSeparator = autoFormat ? ', ' : ',';
      line += this.tags.join(tagSeparator);
      line += autoFormat ? ' || ' : '||';
    }

    line += ranking;

    if (this.weight !== null) {
      line += autoFormat ? ' ^' + this.weight : '^' + this.weight;
    }

    if (this.quantifier !== null) {
      line += autoFormat ? ' * ' + this.quantifier : '*' + this.quantifier;
    }

    return line;
  }

  /**
   * @throws {CefFormatException}
   */
  private static validateTags(tags: readonly string[]): string[] {
    const cleaned: string[] = [];

    for (const tag of tags) {
      const trimmed = tag.trim();

      if (trimmed === '') {
        throw new InvalidValueException('Tag cannot be empty.');
      }

      CefFormat.assertNoTagSeparator(trimmed, 'Tag');
      CefFormat.assertValueIsClean(trimmed, 'Tag');
      cleaned.push(trimmed);
    }

    return cleaned;
  }

  /**
   * Strip trailing whitespace, mirroring PHP's `rtrim()`.
   */
  private static rtrim(value: string): string {
    return value.replace(/\s+$/, '');
  }
}
