import { describe, expect, it } from 'bun:test';

import { WeightAllowedParameter } from '../../../src';

describe('WeightAllowedParameter', () => {
  it('renders the standard boolean tokens', () => {
    const on = new WeightAllowedParameter(true);
    const off = new WeightAllowedParameter(false);

    expect(on.getName()).toBe('Weight Allowed');
    expect(on.getFormattedValue(true)).toBe('true');
    expect(off.getFormattedValue(true)).toBe('false');
  });
});
