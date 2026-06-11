import { describe, expect, it } from 'bun:test';

import { NumberOfSeatsParameter } from '../../../src';
import { InvalidValueException } from '../../../src';
import { expectThrows } from '../../helpers';

describe('NumberOfSeatsParameter', () => {
  it('emits the integer as its formatted value', () => {
    const param = new NumberOfSeatsParameter(42);

    expect(param.getName()).toBe('Number of Seats');
    expect(param.getFormattedValue(false)).toBe('42');
    expect(param.getFormattedValue(true)).toBe('42');
  });

  it('accepts one seat', () => {
    expect(new NumberOfSeatsParameter(1).seats).toBe(1);
  });

  it('rejects zero seats', () => {
    expectThrows(() => new NumberOfSeatsParameter(0), InvalidValueException, 'positive');
  });

  it('rejects a negative number of seats', () => {
    expectThrows(() => new NumberOfSeatsParameter(-3), InvalidValueException, 'positive');
  });
});
