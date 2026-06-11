import { describe, expect, it } from 'bun:test';

import { Ranking, VoteLine } from '../../src';
import {
  DuplicateCandidateException,
  InvalidValueException,
  ReservedCharacterException,
} from '../../src';
import { expectThrows } from '../helpers';

describe('Ranking', () => {
  it('stores the ranks exposed on the ranks property', () => {
    const ranking = new Ranking([['Alice'], ['Bob', 'Charlie'], ['Eve']]);

    expect(ranking.ranks).toEqual([['Alice'], ['Bob', 'Charlie'], ['Eve']]);
  });

  it('trims candidate names and preserves their order', () => {
    const ranking = new Ranking([['  Alice  ', '\tBob'], [' Charlie ']]);

    expect(ranking.ranks).toEqual([['Alice', 'Bob'], ['Charlie']]);
  });

  it('renders a linear ranking in both flavors', () => {
    const ranking = new Ranking([['A'], ['B'], ['C']]);

    expect(ranking.format(true)).toBe('A > B > C');
    expect(ranking.format(false)).toBe('A>B>C');
  });

  it('renders ties with the equality separator', () => {
    const ranking = new Ranking([['A'], ['B', 'C'], ['D']]);

    expect(ranking.format(true)).toBe('A > B = C > D');
    expect(ranking.format(false)).toBe('A>B=C>D');
  });

  it('defaults format() to the relaxed flavor', () => {
    const ranking = new Ranking([['A'], ['B']]);

    expect(ranking.format()).toBe('A > B');
  });

  it('casts to its relaxed string form', () => {
    const ranking = new Ranking([['A'], ['B', 'C']]);

    expect(String(ranking)).toBe('A > B = C');
    expect(`${ranking}`).toBe('A > B = C');
  });

  it('emits the EMPTY_RANKING sentinel for a blank ranking', () => {
    const ranking = new Ranking([]);

    expect(ranking.ranks).toEqual([]);
    expect(ranking.format(true)).toBe('/EMPTY_RANKING/');
    expect(ranking.format(false)).toBe('/EMPTY_RANKING/');
  });

  it('rejects a ranking that repeats the same candidate', () => {
    expectThrows(
      () => new Ranking([['A'], ['B'], ['A']]),
      DuplicateCandidateException,
      'more than once',
    );
  });

  it('rejects a duplicate that appears across separate tied groups', () => {
    expectThrows(
      () => new Ranking([['Alice', 'Bob'], ['Charlie', 'Alice']]),
      DuplicateCandidateException,
      'more than once',
    );
  });

  it('rejects an empty rank', () => {
    expectThrows(() => new Ranking([['A'], [], ['B']]), InvalidValueException, 'empty');
  });

  it('rejects a candidate containing a reserved character', () => {
    expectThrows(() => new Ranking([['A>B']]), ReservedCharacterException);
  });

  it('parses a ranking-only string', () => {
    const ranking = Ranking.fromString('Alice > Bob = Charlie');

    expect(ranking.ranks).toEqual([['Alice'], ['Bob', 'Charlie']]);
  });

  it('parses the EMPTY_RANKING sentinel from a string', () => {
    const ranking = Ranking.fromString('/EMPTY_RANKING/');

    expect(ranking.ranks).toEqual([]);
  });

  it('parses a compact ranking string', () => {
    const ranking = Ranking.fromString('A>B=C>D');

    expect(ranking.ranks).toEqual([['A'], ['B', 'C'], ['D']]);
  });

  it('rejects an empty ranking string', () => {
    expectThrows(() => Ranking.fromString('   '), InvalidValueException, 'empty');
  });

  it('rejects a tag separator inside a ranking string', () => {
    expectThrows(
      () => Ranking.fromString('evil || Alice > Bob'),
      ReservedCharacterException,
      '||',
    );
  });

  it('rejects a weight smuggled inside a ranking string', () => {
    expectThrows(() => Ranking.fromString('Alice > Bob ^7'), ReservedCharacterException);
  });

  it('can be passed straight to a VoteLine', () => {
    const ranking = new Ranking([['Alice'], ['Bob', 'Charlie']]);
    const line = VoteLine.fromRanking(ranking, { weight: 7 });

    expect(line.ranking).toBe(ranking);
    expect(line.format(true)).toBe('Alice > Bob = Charlie ^7');
  });

  it('accepts a valid ranking string without allocating', () => {
    expect(() => {
      Ranking.assertValidString('Alice > Bob = Charlie');
      Ranking.assertValidString('A>B=C>D');
      Ranking.assertValidString('/EMPTY_RANKING/');
    }).not.toThrow();
  });

  it('rejects an empty ranking string in assertValidString', () => {
    expectThrows(() => Ranking.assertValidString('   '), InvalidValueException, 'empty');
  });

  it('rejects a tag separator in assertValidString', () => {
    expectThrows(
      () => Ranking.assertValidString('evil || Alice > Bob'),
      ReservedCharacterException,
      '||',
    );
  });

  it('rejects a reserved character in assertValidString', () => {
    expectThrows(() => Ranking.assertValidString('Alice > Bob ^7'), ReservedCharacterException);
  });

  it('rejects a duplicate candidate in assertValidString', () => {
    expectThrows(
      () => Ranking.assertValidString('Alice > Bob > Alice'),
      DuplicateCandidateException,
      'more than once',
    );
  });

  it('rejects an empty candidate in assertValidString', () => {
    expectThrows(() => Ranking.assertValidString('Alice > > Bob'), InvalidValueException);
  });
});
