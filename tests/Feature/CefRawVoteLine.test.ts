import { describe, expect, it } from 'bun:test';

import { VoteLine } from '../../src';
import {
  DuplicateCandidateException,
  InvalidValueException,
  InvalidWriterStateException,
  ReservedCharacterException,
} from '../../src';
import { CandidatesParameter } from '../../src';
import { expectThrows, makeStringCef } from '../helpers';

describe('Cef.addRawVoteLine', () => {
  it('writes a raw vote line verbatim', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVoteLine('Alice > Bob = Charlie ^7 * 8');

    expect(buffer()).toBe('Alice > Bob = Charlie ^7 * 8\n');
  });

  it('does not reformat the raw line based on autoFormat', () => {
    const [cef, buffer] = makeStringCef(true);

    cef.addRawVoteLine('Alice>Bob^7*8');

    expect(buffer()).toBe('Alice>Bob^7*8\n');
  });

  it('strips a single trailing \\n provided in the input', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVoteLine('Alice > Bob\n');

    expect(buffer()).toBe('Alice > Bob\n');
  });

  it('strips a trailing \\r\\n provided in the input', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVoteLine('Alice > Bob\r\n');

    expect(buffer()).toBe('Alice > Bob\n');
  });

  it('strips a trailing lone \\r provided in the input', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVoteLine('Alice > Bob\r');

    expect(buffer()).toBe('Alice > Bob\n');
  });

  it('trims leading and trailing whitespace from the input', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVoteLine('   Alice > Bob   \n');

    expect(buffer()).toBe('Alice > Bob\n');
  });

  it('triggers the autoFormat separator just like addVote()', () => {
    const [cef, buffer] = makeStringCef(true);

    cef.addParameter(new CandidatesParameter(['Alice', 'Bob']));
    cef.addRawVoteLine('Alice > Bob');

    expect(buffer()).toBe('#/Candidates: Alice ; Bob\n\nAlice > Bob\n');
  });

  it('locks parameter writing once a raw vote line has been emitted', () => {
    const [cef] = makeStringCef();

    cef.addRawVoteLine('Alice');

    expectThrows(
      () => cef.addParameter(new CandidatesParameter(['Alice'])),
      InvalidWriterStateException,
      'before any vote',
    );
  });

  it('rejects an empty string', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVoteLine(''), InvalidValueException, 'empty');
  });

  it('rejects a whitespace-only string', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVoteLine('   \t \n'), InvalidValueException, 'empty');
  });

  it('rejects a multi-line string (embedded \\n)', () => {
    const [cef] = makeStringCef();

    expectThrows(
      () => cef.addRawVoteLine('Alice > Bob\nCharlie > Dave'),
      InvalidValueException,
      'single line',
    );
  });

  it('rejects a multi-line string (embedded \\r)', () => {
    const [cef] = makeStringCef();

    expectThrows(
      () => cef.addRawVoteLine('Alice > Bob\rCharlie > Dave'),
      InvalidValueException,
      'single line',
    );
  });

  it('rejects a line that starts with # (would be a comment line)', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVoteLine('# a comment, not a vote'), ReservedCharacterException);
  });

  it('rejects a line that starts with #/ (would be a parameter line)', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVoteLine('#/Candidates: A;B'), ReservedCharacterException);
  });

  it('still accepts a line that ENDS with an inline comment (#) — only leading # is forbidden', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVoteLine('Alice > Bob # a note');

    expect(buffer()).toBe('Alice > Bob # a note\n');
  });

  it('preserves UTF-8 content', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVoteLine('Élise > 日本語 = 🗳');

    expect(buffer()).toBe('Élise > 日本語 = 🗳\n');
  });

  it('returns this for chaining', () => {
    const [cef] = makeStringCef();

    const result = cef.addRawVoteLine('Alice');

    expect(result).toBe(cef);
  });

  it('still allows addVote() with a typed VoteLine after a raw vote line', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVoteLine('Alice > Bob');
    cef.addVote(VoteLine.fromRanking([['Charlie']]));

    expect(buffer()).toBe('Alice > Bob\nCharlie\n');
  });

  const everyForm: Record<string, string> = {
    'simple ranking': 'Alice > Bob > Charlie',
    'compact ranking': 'Alice>Bob>Charlie',
    'tied candidates': 'Alice > Bob = Charlie',
    'tags + ranking': 'voter@example.com, sig:abc || Alice > Bob',
    weight: 'Alice > Bob ^7',
    quantifier: 'Alice > Bob * 42',
    'weight + quantifier': 'Alice > Bob ^7 * 42',
    'compact weight + quantifier': 'Alice>Bob^7*42',
    'inline comment': 'Alice > Bob # late ballot',
    'empty ranking sentinel': '/EMPTY_RANKING/',
    'empty ranking with quantifier': '/EMPTY_RANKING/ * 3',
    'utf-8 candidates': 'Élise > 日本語 = 🗳',
  };

  for (const [label, line] of Object.entries(everyForm)) {
    it(`accepts every form a CEF vote line can take: ${label}`, () => {
      const [cef, buffer] = makeStringCef();

      cef.addRawVoteLine(line);

      expect(buffer()).toBe(line + '\n');
    });
  }

  it('rejects a duplicate candidate inside the ranking', () => {
    const [cef] = makeStringCef();

    expectThrows(
      () => cef.addRawVoteLine('Alice > Bob > Alice'),
      DuplicateCandidateException,
      'more than once',
    );
  });

  it('rejects a duplicate candidate across tied groups', () => {
    const [cef] = makeStringCef();

    expectThrows(
      () => cef.addRawVoteLine('Alice = Bob > Charlie = Alice'),
      DuplicateCandidateException,
      'more than once',
    );
  });

  it('rejects an empty rank in the middle of the ranking', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVoteLine('Alice >  > Bob'), InvalidValueException);
  });

  it('rejects a zero quantifier', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVoteLine('Alice * 0'), InvalidValueException);
  });

  it('rejects a zero weight', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVoteLine('Alice ^0'), InvalidValueException);
  });

  it('rejects an empty tag in the tags list', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVoteLine('tag1, , tag2 || Alice'), InvalidValueException);
  });

  it('rejects a line that ends with a stray pipe (would-be empty ranking after tags)', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVoteLine('tag1 || '), InvalidWriterStateException, 'no ranking');
  });

  it('rejects a line that is only an inline comment after tags', () => {
    const [cef] = makeStringCef();

    expectThrows(
      () => cef.addRawVoteLine('tag1 || # only a comment'),
      InvalidWriterStateException,
      'no ranking',
    );
  });
});
