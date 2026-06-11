import type { ParameterInterface } from './ParameterInterface';
import { StandardParameter } from './StandardParameter';

/**
 * `#/Implicit Ranking:` parameter — boolean toggle.
 */
export class ImplicitRankingParameter implements ParameterInterface {
  public constructor(public readonly enabled: boolean) {}

  public getName(): string {
    return StandardParameter.ImplicitRanking;
  }

  public getFormattedValue(_autoFormat = true): string {
    return this.enabled ? 'true' : 'false';
  }
}
