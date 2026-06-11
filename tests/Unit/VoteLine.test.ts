import { describe, expect, it } from 'bun:test';

import { Ranking, VoteLine } from '../../src';
import {
  DuplicateCandidateException,
  InvalidValueException,
  ReservedCharacterException,
} from '../../src';
import { expectThrows } from '../helpers';

describe('VoteLine.fromRanking', () => {
  it('renders a simple linear ranking in compact form', () => {
    const line = VoteLine.fromRanking([['A'], ['B'], ['C']]);

    expect(line.format(false)).toBe('A>B>C');
  });

  it('renders a simple linear ranking in pretty form', () => {
    const line = VoteLine.fromRanking([['A'], ['B'], ['C']]);

    expect(line.format(true)).toBe('A > B > C');
  });

  it('renders ties with the equality separator', () => {
    const line = VoteLine.fromRanking([['A'], ['B', 'C'], ['D']]);

    expect(line.format(false)).toBe('A>B=C>D');
    expect(line.format(true)).toBe('A > B = C > D');
  });

  it('stores tied candidates as a single inner array on the ranking property', () => {
    const line = VoteLine.fromRanking([['Alice'], ['Bob', 'Charlie', 'Dave'], ['Eve']]);

    expect(line.ranking?.ranks).toEqual([['Alice'], ['Bob', 'Charlie', 'Dave'], ['Eve']]);
  });

  it('accepts a single rank with several tied candidates and no other ranks', () => {
    const line = VoteLine.fromRanking([['Alice', 'Bob', 'Charlie']]);

    expect(line.ranking?.ranks).toEqual([['Alice', 'Bob', 'Charlie']]);
    expect(line.format(true)).toBe('Alice = Bob = Charlie');
  });

  it('trims tied candidates individually and preserves their order', () => {
    const line = VoteLine.fromRanking([['  Alice  ', '\tBob', ' Charlie ']]);

    expect(line.ranking?.ranks).toEqual([['Alice', 'Bob', 'Charlie']]);
  });

  it('detects a duplicate that appears across separate tied groups', () => {
    expectThrows(
      () => VoteLine.fromRanking([['Alice', 'Bob'], ['Charlie', 'Alice']]),
      DuplicateCandidateException,
      'more than once',
    );
  });

  it('renders weight and quantifier in the spec order', () => {
    const line = VoteLine.fromRanking([['A'], ['B']], { weight: 7, quantifier: 8 });

    expect(line.format(false)).toBe('A>B^7*8');
    expect(line.format(true)).toBe('A > B ^7 * 8');
  });

  it('renders only the weight when quantifier is absent', () => {
    const line = VoteLine.fromRanking([['A']], { weight: 3 });

    expect(line.format(false)).toBe('A^3');
    expect(line.format(true)).toBe('A ^3');
  });

  it('renders only the quantifier when weight is absent', () => {
    const line = VoteLine.fromRanking([['A']], { quantifier: 42 });

    expect(line.format(false)).toBe('A*42');
    expect(line.format(true)).toBe('A * 42');
  });

  it('renders tags before the ranking separated by ||', () => {
    const line = VoteLine.fromRanking([['A'], ['B']], {
      tags: ['julien@condorcet.vote', 'signature:abc'],
    });

    expect(line.format(false)).toBe('julien@condorcet.vote,signature:abc||A>B');
    expect(line.format(true)).toBe('julien@condorcet.vote, signature:abc || A > B');
  });

  it('emits the EMPTY_RANKING sentinel for a blank ballot', () => {
    const line = VoteLine.fromRanking([]);

    expect(line.format(false)).toBe('/EMPTY_RANKING/');
    expect(line.format(true)).toBe('/EMPTY_RANKING/');
  });

  it('keeps the empty ranking when a quantifier is attached', () => {
    const line = VoteLine.fromRanking([], { quantifier: 2 });

    expect(line.format(true)).toBe('/EMPTY_RANKING/ * 2');
  });

  it('trims candidate names in the ranking', () => {
    const line = VoteLine.fromRanking([['  Alice  '], ['\tBob']]);

    expect(line.ranking?.ranks).toEqual([['Alice'], ['Bob']]);
  });

  it('stores the inline comment without rendering it itself', () => {
    const line = VoteLine.fromRanking([['A']], { inlineComment: 'a note' });

    expect(line.inlineComment).toBe('a note');
    expect(line.format(true)).toBe('A');
  });

  it('rejects a ranking that repeats the same candidate', () => {
    expectThrows(
      () => VoteLine.fromRanking([['A'], ['B'], ['A']]),
      DuplicateCandidateException,
      'more than once',
    );
  });

  it('rejects an empty rank', () => {
    expectThrows(() => VoteLine.fromRanking([['A'], [], ['B']]), InvalidValueException, 'empty');
  });

  it('rejects a candidate containing a reserved character', () => {
    expectThrows(() => VoteLine.fromRanking([['A'], ['B>C']]), ReservedCharacterException);
  });

  it('rejects a tag containing a reserved character', () => {
    expectThrows(
      () => VoteLine.fromRanking([['A']], { tags: ['valid', 'bad;tag'] }),
      ReservedCharacterException,
    );
  });

  it('rejects an empty tag', () => {
    expectThrows(
      () => VoteLine.fromRanking([['A']], { tags: ['valid', '   '] }),
      InvalidValueException,
    );
  });

  it('rejects a zero weight', () => {
    expectThrows(() => VoteLine.fromRanking([['A']], { weight: 0 }), InvalidValueException);
  });

  it('rejects a negative weight', () => {
    expectThrows(() => VoteLine.fromRanking([['A']], { weight: -1 }), InvalidValueException);
  });

  it('rejects a zero quantifier', () => {
    expectThrows(() => VoteLine.fromRanking([['A']], { quantifier: 0 }), InvalidValueException);
  });

  it('rejects a multi-line inline comment', () => {
    expectThrows(
      () => VoteLine.fromRanking([['A']], { inlineComment: 'first\nsecond' }),
      InvalidValueException,
    );
  });

  it('exposes the ranking as a Ranking object', () => {
    const line = VoteLine.fromRanking([['A'], ['B', 'C']]);

    expect(line.ranking).toBeInstanceOf(Ranking);
    expect(line.ranking?.ranks).toEqual([['A'], ['B', 'C']]);
  });

  it('reuses a Ranking instance passed to fromRanking()', () => {
    const ranking = new Ranking([['A'], ['B']]);
    const line = VoteLine.fromRanking(ranking);

    expect(line.ranking).toBe(ranking);
  });
});

describe('VoteLine.fromRawRankingString', () => {
  it('keeps a verbatim ranking string and leaves ranking null', () => {
    const line = VoteLine.fromRawRankingString('Alice>Bob=Charlie');

    expect(line.ranking).toBeNull();
    expect(line.format(true)).toBe('Alice>Bob=Charlie');
    expect(line.format(false)).toBe('Alice>Bob=Charlie');
  });

  it('formats verbatim ranking companions per autoFormat', () => {
    const line = VoteLine.fromRawRankingString('Alice>Bob', {
      tags: ['a'],
      weight: 7,
      quantifier: 3,
    });

    expect(line.format(true)).toBe('a || Alice>Bob ^7 * 3');
    expect(line.format(false)).toBe('a||Alice>Bob^7*3');
  });

  it('trims the verbatim ranking string', () => {
    const line = VoteLine.fromRawRankingString('  Alice > Bob  ');

    expect(line.format(true)).toBe('Alice > Bob');
  });

  it('validates the verbatim ranking string but rejects smuggled companions', () => {
    expectThrows(() => VoteLine.fromRawRankingString('Alice > Bob ^7'), ReservedCharacterException);
  });

  it('rejects a duplicate candidate in a verbatim ranking string', () => {
    expectThrows(
      () => VoteLine.fromRawRankingString('Alice > Bob > Alice'),
      DuplicateCandidateException,
      'more than once',
    );
  });
});
