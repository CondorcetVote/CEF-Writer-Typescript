import { describe, expect, it } from 'bun:test';

import { VoteLine } from '../../src';
import {
  DuplicateCandidateException,
  InvalidUtf8Exception,
  InvalidValueException,
  InvalidWriterStateException,
  ReservedCharacterException,
} from '../../src';
import { CandidatesParameter } from '../../src';
import { expectThrows, makeStringCef } from '../helpers';

describe('Cef.addRawVote', () => {
  it('writes a ranking-only vote line', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVote('Alice > Bob > Charlie');

    expect(buffer()).toBe('Alice > Bob > Charlie\n');
  });

  it('writes tied candidates', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVote('Alice > Bob = Charlie');

    expect(buffer()).toBe('Alice > Bob = Charlie\n');
  });

  it('writes the ranking verbatim regardless of autoFormat (compact in)', () => {
    const [cef, buffer] = makeStringCef(true);

    cef.addRawVote('Alice>Bob=Charlie');

    expect(buffer()).toBe('Alice>Bob=Charlie\n');
  });

  it('writes the ranking verbatim regardless of autoFormat (spaced in)', () => {
    const [cef, buffer] = makeStringCef(false);

    cef.addRawVote('Alice > Bob = Charlie');

    expect(buffer()).toBe('Alice > Bob = Charlie\n');
  });

  it('formats the companions per autoFormat but keeps the ranking verbatim (off)', () => {
    const [cef, buffer] = makeStringCef(false);

    cef.addRawVote('Alice > Bob', { quantifier: 3, weight: 7, tags: ['a'] });

    expect(buffer()).toBe('a||Alice > Bob^7*3\n');
  });

  it('formats the companions per autoFormat but keeps the ranking verbatim (on)', () => {
    const [cef, buffer] = makeStringCef(true);

    cef.addRawVote('Alice>Bob', { quantifier: 3, weight: 7, tags: ['a'] });

    expect(buffer()).toBe('a || Alice>Bob ^7 * 3\n');
  });

  it('appends a typed weight', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVote('Alice > Bob', { weight: 7 });

    expect(buffer()).toBe('Alice > Bob ^7\n');
  });

  it('appends a typed quantifier', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVote('Alice > Bob', { quantifier: 42 });

    expect(buffer()).toBe('Alice > Bob * 42\n');
  });

  it('appends weight and quantifier together', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVote('Alice > Bob', { quantifier: 42, weight: 7 });

    expect(buffer()).toBe('Alice > Bob ^7 * 42\n');
  });

  it('appends typed tags', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVote('Alice > Bob', { tags: ['voter@example.com', 'sig:abc'] });

    expect(buffer()).toBe('voter@example.com, sig:abc || Alice > Bob\n');
  });

  it('omits a null weight', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVote('Alice > Bob', { weight: null });

    expect(buffer()).toBe('Alice > Bob\n');
  });

  it('omits a null quantifier', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVote('Alice > Bob', { quantifier: null });

    expect(buffer()).toBe('Alice > Bob\n');
  });

  it('writes an explicit weight of 1 when provided', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVote('Alice > Bob', { weight: 1 });

    expect(buffer()).toBe('Alice > Bob ^1\n');
  });

  it('writes an explicit quantifier of 1 when provided', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVote('Alice > Bob', { quantifier: 1 });

    expect(buffer()).toBe('Alice > Bob * 1\n');
  });

  it('omits both companions by default', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVote('Alice > Bob');

    expect(buffer()).toBe('Alice > Bob\n');
  });

  it('treats a null tags argument as no tags', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVote('Alice > Bob', { tags: null });

    expect(buffer()).toBe('Alice > Bob\n');
  });

  it('writes the empty-ranking sentinel', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVote('/EMPTY_RANKING/');

    expect(buffer()).toBe('/EMPTY_RANKING/\n');
  });

  it('writes the empty-ranking sentinel with a quantifier', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVote('/EMPTY_RANKING/', { quantifier: 3 });

    expect(buffer()).toBe('/EMPTY_RANKING/ * 3\n');
  });

  it('preserves UTF-8 candidate names', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVote('Élise > 日本語 = 🗳');

    expect(buffer()).toBe('Élise > 日本語 = 🗳\n');
  });

  it('triggers the autoFormat separator just like addVote()', () => {
    const [cef, buffer] = makeStringCef(true);

    cef.addParameter(new CandidatesParameter(['Alice', 'Bob']));
    cef.addRawVote('Alice > Bob');

    expect(buffer()).toBe('#/Candidates: Alice ; Bob\n\nAlice > Bob\n');
  });

  it('locks parameter writing once a raw vote has been emitted', () => {
    const [cef] = makeStringCef();

    cef.addRawVote('Alice');

    expectThrows(
      () => cef.addParameter(new CandidatesParameter(['Alice'])),
      InvalidWriterStateException,
      'before any vote',
    );
  });

  it('returns this for chaining', () => {
    const [cef] = makeStringCef();

    const result = cef.addRawVote('Alice');

    expect(result).toBe(cef);
  });

  it('interoperates with addVote() afterwards', () => {
    const [cef, buffer] = makeStringCef();

    cef.addRawVote('Alice > Bob');
    cef.addVote(VoteLine.fromRanking([['Charlie']]));

    expect(buffer()).toBe('Alice > Bob\nCharlie\n');
  });

  // --- Paranoid rejection: vote must carry only a ranking --------------------

  it('rejects a weight smuggled inside vote', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVote('Alice > Bob ^7'), ReservedCharacterException);
  });

  it('rejects a quantifier smuggled inside vote', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVote('Alice > Bob * 42'), ReservedCharacterException);
  });

  it('rejects an inline comment smuggled inside vote', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVote('Alice > Bob # sneaky'), ReservedCharacterException);
  });

  it('rejects a tag separator smuggled inside vote', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVote('evil || Alice > Bob'), ReservedCharacterException, '||');
  });

  it('rejects a semicolon (second vote) smuggled inside vote', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVote('Alice ; Bob'), ReservedCharacterException);
  });

  it('rejects a comma smuggled inside vote', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVote('Alice, Bob'), ReservedCharacterException);
  });

  it('rejects a slash smuggled inside vote', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVote('Alice/Bob'), ReservedCharacterException);
  });

  it('rejects a fake EMPTY_RANKING-style sentinel built with slashes', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVote('/FAKE/'), ReservedCharacterException);
  });

  it('rejects an embedded \\n in vote', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVote('Alice > Bob\nCharlie'), InvalidValueException);
  });

  it('rejects an embedded \\r in vote', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVote('Alice > Bob\rCharlie'), InvalidValueException);
  });

  it('rejects a CRLF injection that would smuggle a second vote', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVote('Alice > Bob\r\nCharlie > Dave'), InvalidValueException);
  });

  it('rejects a null byte smuggled inside vote', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVote('Alice\0Bob'), InvalidValueException);
  });

  it('rejects an ill-formed (non-UTF-8-encodable) byte sequence in vote', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVote('Alice \uD800 Bob'), InvalidUtf8Exception);
  });

  it('rejects an empty vote string', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVote(''), InvalidValueException, 'empty');
  });

  it('rejects a whitespace-only vote string', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVote('   \t '), InvalidValueException, 'empty');
  });

  it('rejects a duplicate candidate in vote', () => {
    const [cef] = makeStringCef();

    expectThrows(
      () => cef.addRawVote('Alice > Bob > Alice'),
      DuplicateCandidateException,
      'more than once',
    );
  });

  it('rejects an empty rank in vote', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVote('Alice >  > Bob'), InvalidValueException);
  });

  it('rejects a zero weight argument', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVote('Alice', { weight: 0 }), InvalidValueException, 'positive');
  });

  it('rejects a negative weight argument', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVote('Alice', { weight: -3 }), InvalidValueException, 'positive');
  });

  it('rejects a zero quantifier argument', () => {
    const [cef] = makeStringCef();

    expectThrows(
      () => cef.addRawVote('Alice', { quantifier: 0 }),
      InvalidValueException,
      'positive',
    );
  });

  it('rejects an empty tag in the tags argument', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVote('Alice', { tags: ['ok', ''] }), InvalidValueException);
  });

  it('rejects a reserved character in a tag', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addRawVote('Alice', { tags: ['bad,tag'] }), ReservedCharacterException);
  });
});
