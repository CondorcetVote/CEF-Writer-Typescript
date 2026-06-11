import { describe, expect, it } from 'bun:test';

import { VoteLine } from '../../src';
import {
  DuplicateCandidateException,
  InvalidValueException,
  InvalidWriterStateException,
  ReservedCharacterException,
} from '../../src';
import { expectThrows } from '../helpers';

describe('VoteLine.fromString', () => {
  it('parses a simple ranking', () => {
    const line = VoteLine.fromString('A > B > C');

    expect(line.ranking?.ranks).toEqual([['A'], ['B'], ['C']]);
    expect(line.tags).toEqual([]);
    expect(line.weight).toBeNull();
    expect(line.quantifier).toBeNull();
    expect(line.inlineComment).toBeNull();
  });

  it('parses a compact ranking (no spaces)', () => {
    const line = VoteLine.fromString('A>B>C');

    expect(line.ranking?.ranks).toEqual([['A'], ['B'], ['C']]);
  });

  it('parses ties with the equality separator', () => {
    const line = VoteLine.fromString('A > B = C > D');

    expect(line.ranking?.ranks).toEqual([['A'], ['B', 'C'], ['D']]);
  });

  it('parses several candidates tied at a single rank', () => {
    const line = VoteLine.fromString('Alice = Bob = Charlie');

    expect(line.ranking?.ranks).toEqual([['Alice', 'Bob', 'Charlie']]);
  });

  it('parses ties in compact form (no spaces around =)', () => {
    const line = VoteLine.fromString('A>B=C=D>E');

    expect(line.ranking?.ranks).toEqual([['A'], ['B', 'C', 'D'], ['E']]);
  });

  it('preserves the order of tied candidates inside a rank', () => {
    const line = VoteLine.fromString('Zulu = Alpha = Mike');

    expect(line.ranking?.ranks).toEqual([['Zulu', 'Alpha', 'Mike']]);
  });

  it('parses ties together with weight, quantifier and tags', () => {
    const line = VoteLine.fromString('tag1, tag2 || Alice = Bob > Charlie = Dave ^7 * 8');

    expect(line.tags).toEqual(['tag1', 'tag2']);
    expect(line.ranking?.ranks).toEqual([['Alice', 'Bob'], ['Charlie', 'Dave']]);
    expect(line.weight).toBe(7);
    expect(line.quantifier).toBe(8);
  });

  it('rejects a duplicate that appears across separate tied groups', () => {
    expectThrows(
      () => VoteLine.fromString('Alice = Bob > Charlie = Alice'),
      DuplicateCandidateException,
      'more than once',
    );
  });

  it('rejects a duplicate within the same tied group', () => {
    expectThrows(
      () => VoteLine.fromString('Alice = Alice > Bob'),
      DuplicateCandidateException,
      'more than once',
    );
  });

  it('parses candidate names that contain spaces', () => {
    const line = VoteLine.fromString('Candidate A > Candidate B = Candidate C');

    expect(line.ranking?.ranks).toEqual([['Candidate A'], ['Candidate B', 'Candidate C']]);
  });

  it('parses UTF-8 candidate names', () => {
    const line = VoteLine.fromString('Élise > 日本語 > Müller');

    expect(line.ranking?.ranks).toEqual([['Élise'], ['日本語'], ['Müller']]);
  });

  it('parses a trailing quantifier', () => {
    const line = VoteLine.fromString('A > B * 42');

    expect(line.ranking?.ranks).toEqual([['A'], ['B']]);
    expect(line.quantifier).toBe(42);
    expect(line.weight).toBeNull();
  });

  it('parses a trailing quantifier in compact form', () => {
    const line = VoteLine.fromString('A>B*42');

    expect(line.ranking?.ranks).toEqual([['A'], ['B']]);
    expect(line.quantifier).toBe(42);
  });

  it('parses a trailing weight', () => {
    const line = VoteLine.fromString('A > B ^7');

    expect(line.ranking?.ranks).toEqual([['A'], ['B']]);
    expect(line.weight).toBe(7);
    expect(line.quantifier).toBeNull();
  });

  it('parses weight then quantifier in the spec order', () => {
    const line = VoteLine.fromString('A > B ^7 * 8');

    expect(line.weight).toBe(7);
    expect(line.quantifier).toBe(8);
  });

  it('parses weight + quantifier in compact form', () => {
    const line = VoteLine.fromString('A>B^7*8');

    expect(line.weight).toBe(7);
    expect(line.quantifier).toBe(8);
  });

  it('parses tags before the ranking', () => {
    const line = VoteLine.fromString('julien@example.com, signature:abc || A > B');

    expect(line.tags).toEqual(['julien@example.com', 'signature:abc']);
    expect(line.ranking?.ranks).toEqual([['A'], ['B']]);
  });

  it('parses tags + ranking + weight + quantifier together', () => {
    const line = VoteLine.fromString('tag1, tag2 || A > B ^3 * 5');

    expect(line.tags).toEqual(['tag1', 'tag2']);
    expect(line.ranking?.ranks).toEqual([['A'], ['B']]);
    expect(line.weight).toBe(3);
    expect(line.quantifier).toBe(5);
  });

  it('parses an inline comment', () => {
    const line = VoteLine.fromString('A > B # my note');

    expect(line.ranking?.ranks).toEqual([['A'], ['B']]);
    expect(line.inlineComment).toBe('my note');
  });

  it('keeps the inline comment after weight and quantifier', () => {
    const line = VoteLine.fromString('A > B ^7 * 2 # late ballot');

    expect(line.weight).toBe(7);
    expect(line.quantifier).toBe(2);
    expect(line.inlineComment).toBe('late ballot');
  });

  it('parses the EMPTY_RANKING sentinel', () => {
    const line = VoteLine.fromString('/EMPTY_RANKING/');

    expect(line.ranking?.ranks).toEqual([]);
  });

  it('parses an EMPTY_RANKING with a quantifier', () => {
    const line = VoteLine.fromString('/EMPTY_RANKING/ * 2');

    expect(line.ranking?.ranks).toEqual([]);
    expect(line.quantifier).toBe(2);
  });

  it('parses a single-candidate vote', () => {
    const line = VoteLine.fromString('Alice');

    expect(line.ranking?.ranks).toEqual([['Alice']]);
  });

  it('round-trips the spec example "Candidate C > Candidate A = Candidate B ^7 * 8"', () => {
    const line = VoteLine.fromString('Candidate C > Candidate A = Candidate B ^7 * 8');

    expect(line.format(true)).toBe('Candidate C > Candidate A = Candidate B ^7 * 8');
  });

  it('rejects an empty string', () => {
    expectThrows(() => VoteLine.fromString(''), InvalidValueException, 'empty');
  });

  it('rejects a string with only whitespace', () => {
    expectThrows(() => VoteLine.fromString('   '), InvalidValueException);
  });

  it('rejects a string with only an inline comment (no ranking)', () => {
    expectThrows(
      () => VoteLine.fromString('# just a comment'),
      InvalidWriterStateException,
      'no ranking',
    );
  });

  it('rejects a string with only tags and no ranking', () => {
    expectThrows(() => VoteLine.fromString('tag1 || '), InvalidWriterStateException, 'no ranking');
  });

  it('rejects a candidate that contains a reserved character', () => {
    expectThrows(() => VoteLine.fromString('A > B/C'), ReservedCharacterException);
  });

  it('rejects a duplicate candidate', () => {
    expectThrows(
      () => VoteLine.fromString('A > B > A'),
      DuplicateCandidateException,
      'more than once',
    );
  });

  it('rejects an empty rank in the middle of the ranking', () => {
    expectThrows(() => VoteLine.fromString('A >  > B'), InvalidValueException);
  });

  it('rejects a zero quantifier', () => {
    expectThrows(() => VoteLine.fromString('A * 0'), InvalidValueException);
  });

  it('rejects an empty tag in the tags list', () => {
    expectThrows(() => VoteLine.fromString('tag1, , tag2 || A'), InvalidValueException);
  });
});
