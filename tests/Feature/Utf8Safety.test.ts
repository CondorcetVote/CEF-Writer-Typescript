import { describe, expect, it } from 'bun:test';

import { CommentLine, VoteLine } from '../../src';
import { CandidatesParameter, CustomParameter } from '../../src';
import { makeStringCef } from '../helpers';

/*
 * UTF-8 safety relies on the property that ASCII bytes (0x00-0x7F) never appear
 * inside UTF-8 multi-byte sequences. Since every CEF separator is ASCII, plain
 * string handling is safe — the tests below pin that contract down.
 */

describe('UTF-8 safety', () => {
  it('preserves UTF-8 in candidate names through Cef writing', () => {
    const [cef, buffer] = makeStringCef();

    cef.addParameter(new CandidatesParameter(['Élise', '日本語', 'Müller', '🗳']));
    cef.addVote(VoteLine.fromRanking([['Élise'], ['日本語', 'Müller'], ['🗳']]));

    expect(buffer()).toContain('Élise ; 日本語 ; Müller ; 🗳');
    expect(buffer()).toContain('Élise > 日本語 = Müller > 🗳');
  });

  it('preserves UTF-8 in tags', () => {
    const [cef, buffer] = makeStringCef();

    cef.addVote(VoteLine.fromRanking([['Alice']], { tags: ['électeur:café', '東京'] }));

    expect(buffer()).toBe('électeur:café, 東京 || Alice\n');
  });

  it('preserves UTF-8 in inline comments', () => {
    const [cef, buffer] = makeStringCef();

    cef.addVote(VoteLine.fromRanking([['Alice']], { inlineComment: 'noté en café — ☕' }));

    expect(buffer()).toBe('Alice # noté en café — ☕\n');
  });

  it('preserves UTF-8 in standalone comment lines', () => {
    const [cef, buffer] = makeStringCef();

    cef.addComment(new CommentLine('élection — 投票 — 🗳'));

    expect(buffer()).toBe('# élection — 投票 — 🗳\n');
  });

  it('preserves UTF-8 in custom parameter values', () => {
    const [cef, buffer] = makeStringCef();

    cef.addParameter(new CustomParameter('Description', 'Élection municipale — 2026 — 🗳'));

    expect(buffer()).toBe('#/Description: Élection municipale — 2026 — 🗳\n');
  });

  it('round-trips UTF-8 through VoteLine.fromString()', () => {
    const line = VoteLine.fromString('électeur:café || Élise > 日本語 = 🗳 ^7 * 8 # café noté');

    expect(line.tags).toEqual(['électeur:café']);
    expect(line.ranking?.ranks).toEqual([['Élise'], ['日本語', '🗳']]);
    expect(line.weight).toBe(7);
    expect(line.quantifier).toBe(8);
    expect(line.inlineComment).toBe('café noté');
  });
});
