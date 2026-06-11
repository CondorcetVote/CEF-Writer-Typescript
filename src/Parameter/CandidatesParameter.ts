import { CefFormat } from '../CefFormat';
import { DuplicateCandidateException, InvalidValueException } from '../Exception';
import type { ParameterInterface } from './ParameterInterface';
import { StandardParameter } from './StandardParameter';

/**
 * `#/Candidates:` parameter — declares the official list of candidates.
 *
 * Candidate names are written separated by `;`. With auto-format on, the
 * separator is padded with spaces (`A ; B ; C`) for readability; otherwise the
 * most compact form (`A;B;C`) is used.
 */
export class CandidatesParameter implements ParameterInterface {
  public readonly candidates: readonly string[];

  /**
   * @param candidates non-empty list of distinct candidate names
   *
   * @throws {CefFormatException}
   */
  public constructor(candidates: readonly string[]) {
    if (candidates.length === 0) {
      throw new InvalidValueException('Candidates list cannot be empty.');
    }

    const seen = new Set<string>();

    for (const candidate of candidates) {
      const trimmed = candidate.trim();
      CefFormat.assertValueIsClean(trimmed, 'Candidate name');

      if (seen.has(trimmed)) {
        throw new DuplicateCandidateException(`Duplicate candidate "${trimmed}".`);
      }

      seen.add(trimmed);
    }

    this.candidates = candidates.map((candidate) => candidate.trim());
  }

  public getName(): string {
    return StandardParameter.Candidates;
  }

  public getFormattedValue(autoFormat = true): string {
    return this.candidates.join(autoFormat ? ' ; ' : ';');
  }
}
