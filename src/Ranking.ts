import { CefFormat } from './CefFormat';
import { DuplicateCandidateException, InvalidValueException } from './Exception';

/**
 * An ordered ranking of candidates.
 *
 * The ranking is expressed as an ordered list of ranks; each rank is itself a
 * list of candidate names tied at that position. An empty top-level ranking
 * (`[]`) renders as the `/EMPTY_RANKING/` blank-ballot sentinel.
 *
 * A `Ranking` is immutable and self-validating: any specification violation
 * (reserved character, empty rank, duplicate candidate) throws a
 * {@link CefFormatException} at construction time. Render it to a CEF string
 * with {@link format} (or by casting to `string` via {@link toString}).
 */
export class Ranking {
  public readonly ranks: readonly (readonly string[])[];

  /**
   * @param ranks Ordered ranks; each inner list is non-empty. Pass `[]` for
   *              the `/EMPTY_RANKING/` blank ballot.
   *
   * @throws {CefFormatException} on any specification violation
   */
  public constructor(ranks: readonly (readonly string[])[]) {
    this.ranks = Ranking.validate(ranks);
  }

  /**
   * Build a {@link Ranking} from a ranking-only string.
   *
   * The string may contain candidate names joined by the `>` (rank) and `=`
   * (tie) operators, or the `/EMPTY_RANKING/` sentinel. Any reserved character
   * (`^`, `*`, `#`, `;`, `,`, `/`), the `||` tag separator, or a line break is
   * rejected — there is no way to smuggle a weight, quantifier, tag or inline
   * comment through the string.
   *
   * @param ranking Ranking only, e.g. `"A > B = C"` or `"/EMPTY_RANKING/"`.
   *
   * @throws {CefFormatException}
   */
  public static fromString(ranking: string): Ranking {
    return new Ranking(Ranking.split(Ranking.normalizeString(ranking)));
  }

  /**
   * Validate a ranking-only string without allocating a {@link Ranking}.
   *
   * Runs the exact same checks as {@link fromString} (empty input, `||` tag
   * separator, reserved characters, line breaks, duplicate candidates) but
   * never materialises the parsed structure nor a `Ranking` instance — useful
   * for hot paths that write the ranking string verbatim after a strict format
   * check.
   *
   * @param ranking Ranking only, e.g. `"A > B = C"` or `"/EMPTY_RANKING/"`.
   *
   * @throws {CefFormatException}
   */
  public static assertValidString(ranking: string): void {
    const work = Ranking.normalizeString(ranking);

    if (work === CefFormat.EMPTY_RANKING) {
      return;
    }

    const seen = new Set<string>();

    for (const rankString of work.split('>')) {
      for (const candidate of rankString.split('=')) {
        Ranking.assertCandidate(candidate, seen);
      }
    }
  }

  /**
   * Trim a ranking-only string and reject the two patterns that the
   * per-candidate validation cannot catch on its own: an empty input and the
   * `||` tag separator. Returns the trimmed work string.
   *
   * @throws {CefFormatException}
   */
  private static normalizeString(ranking: string): string {
    const work = ranking.trim();

    if (work === '') {
      throw new InvalidValueException(
        'Ranking string cannot be empty; use "/EMPTY_RANKING/" for a blank ballot.'
      );
    }

    // The "||" tag separator is the only forbidden pattern that per-candidate
    // validation would not catch on its own ("|" is not a reserved character),
    // so reject it explicitly here. Every reserved character and line break is
    // rejected later, candidate by candidate.
    CefFormat.assertNoTagSeparator(work, 'Ranking');

    return work;
  }

  /**
   * Render the ranking — *without* trailing newline, tags, weight, quantifier
   * or inline comment — using the spacing flavor selected by `autoFormat`.
   *
   * When `autoFormat` is `true` (default), ranks are separated by `" > "` and
   * tied candidates by `" = "`; when `false`, the most compact `>` / `=` form
   * is emitted. An empty ranking yields the `/EMPTY_RANKING/` sentinel.
   */
  public format(autoFormat = true): string {
    if (this.ranks.length === 0) {
      return CefFormat.EMPTY_RANKING;
    }

    const rankSep = autoFormat ? ' > ' : '>';
    const tieSep = autoFormat ? ' = ' : '=';

    return this.ranks.map((rank) => rank.join(tieSep)).join(rankSep);
  }

  /**
   * Render the ranking in its relaxed (auto-formatted) flavor.
   */
  public toString(): string {
    return this.format();
  }

  /**
   * Split a cleaned ranking string into its raw, *un-validated* rank/tie
   * structure. The `/EMPTY_RANKING/` sentinel maps to an empty list. Ranks are
   * separated by `>`, tied candidates within a rank by `=`; every token is
   * trimmed but not otherwise checked here.
   */
  private static split(work: string): string[][] {
    if (work === CefFormat.EMPTY_RANKING) {
      return [];
    }

    const rawRanking: string[][] = [];

    for (const rankString of work.split('>')) {
      const rank: string[] = [];

      for (const candidate of rankString.split('=')) {
        rank.push(candidate.trim());
      }

      rawRanking.push(rank);
    }

    return rawRanking;
  }

  /**
   * @throws {CefFormatException}
   */
  private static validate(ranks: readonly (readonly string[])[]): string[][] {
    const cleaned: string[][] = [];
    const seen = new Set<string>();

    ranks.forEach((rank, rankIndex) => {
      if (rank.length === 0) {
        throw new InvalidValueException(`Rank #${String(rankIndex + 1)} is empty.`);
      }

      const cleanedRank: string[] = [];

      for (const candidate of rank) {
        cleanedRank.push(Ranking.assertCandidate(candidate, seen));
      }

      cleaned.push(cleanedRank);
    });

    return cleaned;
  }

  /**
   * Trim and validate a single candidate name, rejecting reserved characters,
   * line breaks, invalid UTF-8 and duplicates. The `seen` set is updated to
   * detect repeats across the whole ranking.
   *
   * @throws {CefFormatException}
   */
  private static assertCandidate(candidate: string, seen: Set<string>): string {
    const trimmed = candidate.trim();
    CefFormat.assertValueIsClean(trimmed, 'Ranked candidate');

    if (seen.has(trimmed)) {
      throw new DuplicateCandidateException(
        `Candidate "${trimmed}" appears more than once in the ranking.`
      );
    }

    seen.add(trimmed);

    return trimmed;
  }
}
