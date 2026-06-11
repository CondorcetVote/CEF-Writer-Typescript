import { describe, expect, it } from 'bun:test';

import { CandidatesParameter } from '../../../src';
import {
  DuplicateCandidateException,
  InvalidValueException,
  ReservedCharacterException,
} from '../../../src';
import { expectThrows } from '../../helpers';

describe('CandidatesParameter', () => {
  it('exposes the standard CEF parameter name', () => {
    expect(new CandidatesParameter(['A']).getName()).toBe('Candidates');
  });

  it('emits compact format when autoFormat is off', () => {
    const param = new CandidatesParameter(['Alice', 'Bob', 'Charlie']);

    expect(param.getFormattedValue(false)).toBe('Alice;Bob;Charlie');
  });

  it('emits pretty format when autoFormat is on', () => {
    const param = new CandidatesParameter(['Alice', 'Bob', 'Charlie']);

    expect(param.getFormattedValue(true)).toBe('Alice ; Bob ; Charlie');
  });

  it('trims candidate names', () => {
    const param = new CandidatesParameter(['  Alice  ', '\tBob\t']);

    expect(param.candidates).toEqual(['Alice', 'Bob']);
  });

  it('preserves UTF-8 candidate names', () => {
    const param = new CandidatesParameter(['Élise', '日本語', 'Müller']);

    expect(param.getFormattedValue(false)).toBe('Élise;日本語;Müller');
  });

  it('rejects an empty list', () => {
    expectThrows(() => new CandidatesParameter([]), InvalidValueException, 'empty');
  });

  it('rejects an empty candidate name', () => {
    expectThrows(() => new CandidatesParameter(['Alice', '   ']), InvalidValueException);
  });

  it('rejects duplicate candidates', () => {
    expectThrows(
      () => new CandidatesParameter(['Alice', 'Bob', 'Alice']),
      DuplicateCandidateException,
      'Duplicate',
    );
  });

  for (const reserved of ['>', '=', ';', ',', '#', '/', '*', '^']) {
    it(`rejects a candidate containing the reserved character "${reserved}"`, () => {
      expectThrows(
        () => new CandidatesParameter(['Alice', 'Bob' + reserved + 'X']),
        ReservedCharacterException,
        'reserved',
      );
    });
  }

  it('rejects a candidate containing a newline', () => {
    expectThrows(() => new CandidatesParameter(['Alice\nMalice']), InvalidValueException);
  });
});
