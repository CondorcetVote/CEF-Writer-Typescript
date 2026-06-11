import { CefFormat } from './CefFormat';

/**
 * A standalone comment line (`# text`).
 *
 * Inline comments attached to vote lines are not represented by this class —
 * they live on `VoteLine.inlineComment` instead.
 */
export class CommentLine {
  public readonly text: string;

  /**
   * @throws {CefFormatException}
   */
  public constructor(text: string) {
    CefFormat.assertSingleLine(text, 'Comment');
    this.text = text;
  }

  /**
   * Render the line *without* trailing newline.
   */
  public format(autoFormat = true): string {
    if (this.text === '') {
      return '#';
    }

    const needsLeadingSpace = autoFormat && !this.text.startsWith(' ');

    return '#' + (needsLeadingSpace ? ' ' : '') + this.text;
  }
}
