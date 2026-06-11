import { describe, expect, it } from 'bun:test';

import { CefFormatException, VoteLine } from '../../src';
import {
  DuplicateCandidateException,
  InvalidValueException,
  InvalidWriterStateException,
} from '../../src';
import { expectThrows } from '../helpers';

describe('VoteLine.assertValidString', () => {
  for (const line of [
    'Alice > Bob',
    'Alice > Bob = Charlie',
    'Alice>Bob^7*8',
    'tag1, tag2 || Alice > Bob ^7 * 8 # note',
    '/EMPTY_RANKING/',
    '/EMPTY_RANKING/ * 2',
    'Élise > 日本語 = 🗳',
  ]) {
    it(`accepts the valid vote-line string "${line}" silently`, () => {
      expect(() => VoteLine.assertValidString(line)).not.toThrow();
    });
  }

  it('rejects an empty string', () => {
    expectThrows(() => VoteLine.assertValidString(''), InvalidValueException, 'empty');
  });

  it('rejects a duplicate candidate', () => {
    expectThrows(
      () => VoteLine.assertValidString('Alice > Bob > Alice'),
      DuplicateCandidateException,
      'more than once',
    );
  });

  it('rejects a zero weight', () => {
    expectThrows(() => VoteLine.assertValidString('Alice ^0'), InvalidValueException);
  });

  it('rejects a zero quantifier', () => {
    expectThrows(() => VoteLine.assertValidString('Alice * 0'), InvalidValueException);
  });

  it('rejects a missing ranking', () => {
    expectThrows(
      () => VoteLine.assertValidString('tag1 || '),
      InvalidWriterStateException,
      'no ranking',
    );
  });

  it('does not return any value', () => {
    const result = VoteLine.assertValidString('Alice > Bob');

    expect(result).toBeUndefined();
  });

  for (const line of [
    'Alice > Bob',
    'Alice > Bob > Alice',
    'Alice ^0',
    'Alice * 0',
    'tag1, , tag2 || Alice',
    '/EMPTY_RANKING/',
    'Alice >  > Bob',
  ]) {
    it(`shares its parsing pipeline with fromString for "${line}"`, () => {
      let fromStringThrew = false;
      let assertThrew = false;

      try {
        VoteLine.fromString(line);
      } catch (error) {
        if (error instanceof CefFormatException) {
          fromStringThrew = true;
        }
      }

      try {
        VoteLine.assertValidString(line);
      } catch (error) {
        if (error instanceof CefFormatException) {
          assertThrew = true;
        }
      }

      expect(assertThrew).toBe(fromStringThrew);
    });
  }
});
