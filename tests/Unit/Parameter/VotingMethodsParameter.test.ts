import { describe, expect, it } from 'bun:test';

import { VotingMethodsParameter } from '../../../src';
import { InvalidValueException, ReservedCharacterException } from '../../../src';
import { expectThrows } from '../../helpers';

describe('VotingMethodsParameter', () => {
  it('joins method names with semicolons', () => {
    const param = new VotingMethodsParameter(['Schulze', 'Copeland', 'Ranked Pairs']);

    expect(param.getName()).toBe('Voting Methods');
    expect(param.getFormattedValue(false)).toBe('Schulze;Copeland;Ranked Pairs');
    expect(param.getFormattedValue(true)).toBe('Schulze ; Copeland ; Ranked Pairs');
  });

  it('rejects an empty methods list', () => {
    expectThrows(() => new VotingMethodsParameter([]), InvalidValueException);
  });

  it('rejects a method name with a reserved character', () => {
    expectThrows(
      () => new VotingMethodsParameter(['Schulze', 'Copeland;Variant']),
      ReservedCharacterException,
    );
  });
});
