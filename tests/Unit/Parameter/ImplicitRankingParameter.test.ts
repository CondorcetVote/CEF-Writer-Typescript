import { describe, expect, it } from 'bun:test';

import { ImplicitRankingParameter } from '../../../src';

describe('ImplicitRankingParameter', () => {
  it('renders true as the literal "true"', () => {
    const param = new ImplicitRankingParameter(true);

    expect(param.getName()).toBe('Implicit Ranking');
    expect(param.getFormattedValue(false)).toBe('true');
    expect(param.getFormattedValue(true)).toBe('true');
  });

  it('renders false as the literal "false"', () => {
    expect(new ImplicitRankingParameter(false).getFormattedValue(false)).toBe('false');
  });
});
