import { describe, expect, it } from 'bun:test';

import { StandardParameter } from '../../../src';

describe('StandardParameter', () => {
  it('maps each case to the exact spec parameter name', () => {
    expect(StandardParameter.Candidates).toBe('Candidates');
    expect(StandardParameter.NumberOfSeats).toBe('Number of Seats');
    expect(StandardParameter.ImplicitRanking).toBe('Implicit Ranking');
    expect(StandardParameter.VotingMethods).toBe('Voting Methods');
    expect(StandardParameter.WeightAllowed).toBe('Weight Allowed');
  });

  it('exposes exactly the five standard parameters', () => {
    expect(Object.keys(StandardParameter)).toHaveLength(5);
  });
});
