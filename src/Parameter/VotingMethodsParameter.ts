import { CefFormat } from '../CefFormat';
import { InvalidValueException } from '../Exception';
import type { ParameterInterface } from './ParameterInterface';
import { StandardParameter } from './StandardParameter';

/**
 * `#/Voting Methods:` parameter — list of method identifiers separated by `;`.
 */
export class VotingMethodsParameter implements ParameterInterface {
  public readonly methods: readonly string[];

  /**
   * @param methods non-empty list of method names
   *
   * @throws {CefFormatException}
   */
  public constructor(methods: readonly string[]) {
    if (methods.length === 0) {
      throw new InvalidValueException('Voting methods list cannot be empty.');
    }

    for (const method of methods) {
      CefFormat.assertValueIsClean(method.trim(), 'Voting method name');
    }

    this.methods = methods.map((method) => method.trim());
  }

  public getName(): string {
    return StandardParameter.VotingMethods;
  }

  public getFormattedValue(autoFormat = true): string {
    return this.methods.join(autoFormat ? ' ; ' : ';');
  }
}
