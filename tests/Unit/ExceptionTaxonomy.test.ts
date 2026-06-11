import { describe, expect, it } from 'bun:test';

import { Cef, CommentLine, StringBuffer, VoteLine } from '../../src';
import {
  CefFormatException,
  DuplicateCandidateException,
  InvalidUtf8Exception,
  InvalidValueException,
  InvalidWriterStateException,
  ReservedCharacterException,
} from '../../src';
import {
  CandidatesParameter,
  CustomParameter,
  NumberOfSeatsParameter,
  VotingMethodsParameter,
} from '../../src';
import { makeStringCef } from '../helpers';

/*
 * Each test pins down the *specific* subclass thrown for one kind of violation,
 * and also implicitly checks that catching the base CefFormatException still
 * catches everything (since each subclass extends it).
 */

describe('Exception taxonomy', () => {
  it('extends CefFormatException for every subclass', () => {
    expect(new InvalidUtf8Exception('x')).toBeInstanceOf(CefFormatException);
    expect(new ReservedCharacterException('x')).toBeInstanceOf(CefFormatException);
    expect(new InvalidValueException('x')).toBeInstanceOf(CefFormatException);
    expect(new DuplicateCandidateException('x')).toBeInstanceOf(CefFormatException);
    expect(new InvalidWriterStateException('x')).toBeInstanceOf(CefFormatException);
  });

  it('throws InvalidUtf8Exception on an ill-formed candidate', () => {
    expect(() => new CandidatesParameter(['\uD800'])).toThrow(InvalidUtf8Exception);
  });

  it('throws InvalidUtf8Exception inside a CommentLine too', () => {
    expect(() => new CommentLine('\uD800')).toThrow(InvalidUtf8Exception);
  });

  it('throws ReservedCharacterException for a reserved char in a candidate', () => {
    expect(() => new CandidatesParameter(['Alice#Bob'])).toThrow(ReservedCharacterException);
  });

  it('throws ReservedCharacterException for a ":" in a custom parameter name', () => {
    expect(() => new CustomParameter('Foo:Bar', 'v')).toThrow(ReservedCharacterException);
  });

  it('throws ReservedCharacterException for "||" in a tag', () => {
    expect(() => VoteLine.fromRanking([['A']], { tags: ['oh||no'] })).toThrow(
      ReservedCharacterException,
    );
  });

  it('throws ReservedCharacterException for a raw vote line starting with #', () => {
    const [cef] = makeStringCef();

    expect(() => cef.addRawVoteLine('# not a vote')).toThrow(ReservedCharacterException);
  });

  it('throws InvalidValueException for an empty candidate name', () => {
    expect(() => new CandidatesParameter([''])).toThrow(InvalidValueException);
  });

  it('throws InvalidValueException for a candidate with a line break', () => {
    expect(() => new CandidatesParameter(['Ali\nce'])).toThrow(InvalidValueException);
  });

  it('throws InvalidValueException for a candidate with a null byte', () => {
    expect(() => new CandidatesParameter(['Ali\0ce'])).toThrow(InvalidValueException);
  });

  it('throws InvalidValueException for a zero quantifier', () => {
    expect(() => VoteLine.fromRanking([['A']], { quantifier: 0 })).toThrow(InvalidValueException);
  });

  it('throws InvalidValueException for a zero weight', () => {
    expect(() => VoteLine.fromRanking([['A']], { weight: 0 })).toThrow(InvalidValueException);
  });

  it('throws InvalidValueException for a non-positive Number of Seats', () => {
    expect(() => new NumberOfSeatsParameter(0)).toThrow(InvalidValueException);
  });

  it('throws InvalidValueException for an empty Candidates list', () => {
    expect(() => new CandidatesParameter([])).toThrow(InvalidValueException);
  });

  it('throws InvalidValueException for an empty Voting Methods list', () => {
    expect(() => new VotingMethodsParameter([])).toThrow(InvalidValueException);
  });

  it('throws InvalidValueException for an empty rank in the ranking', () => {
    expect(() => VoteLine.fromRanking([['A'], [], ['B']])).toThrow(InvalidValueException);
  });

  it('throws DuplicateCandidateException when a candidate repeats in a ranking', () => {
    expect(() => VoteLine.fromRanking([['A'], ['B'], ['A']])).toThrow(DuplicateCandidateException);
  });

  it('throws DuplicateCandidateException for a duplicate in the Candidates list', () => {
    expect(() => new CandidatesParameter(['Alice', 'Bob', 'Alice'])).toThrow(
      DuplicateCandidateException,
    );
  });

  it('throws InvalidWriterStateException when constructed with neither file nor string', () => {
    expect(() => new Cef()).toThrow(InvalidWriterStateException);
  });

  it('throws InvalidWriterStateException when constructed with both file and string', () => {
    expect(() => new Cef({ file: '/tmp/x', string: new StringBuffer() })).toThrow(
      InvalidWriterStateException,
    );
  });

  it('throws InvalidWriterStateException for a parameter added after a vote', () => {
    const [cef] = makeStringCef();
    cef.addVote(VoteLine.fromRanking([['A']]));

    expect(() => cef.addParameter(new CandidatesParameter(['A']))).toThrow(
      InvalidWriterStateException,
    );
  });

  it('throws InvalidWriterStateException for a vote-line string with no ranking', () => {
    expect(() => VoteLine.fromString('tag1 || ')).toThrow(InvalidWriterStateException);
  });

  it('catching CefFormatException still catches every subclass', () => {
    let caught = 0;

    const throwers: Array<() => unknown> = [
      () => new CandidatesParameter(['\uD800']), // InvalidUtf8Exception
      () => new CandidatesParameter(['A#B']), // ReservedCharacterException
      () => new NumberOfSeatsParameter(0), // InvalidValueException
      () => new CandidatesParameter(['A', 'A']), // DuplicateCandidateException
      () => new Cef(), // InvalidWriterStateException
    ];

    for (const thrower of throwers) {
      try {
        thrower();
      } catch (error) {
        if (error instanceof CefFormatException) {
          caught++;
        }
      }
    }

    expect(caught).toBe(5);
  });
});
