import type { ParameterInterface } from './ParameterInterface';
import { StandardParameter } from './StandardParameter';

/**
 * `#/Weight Allowed:` parameter — boolean toggle.
 */
export class WeightAllowedParameter implements ParameterInterface {
  public constructor(public readonly enabled: boolean) {}

  public getName(): string {
    return StandardParameter.WeightAllowed;
  }

  public getFormattedValue(_autoFormat = true): string {
    return this.enabled ? 'true' : 'false';
  }
}
