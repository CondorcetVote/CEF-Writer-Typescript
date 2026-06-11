import { CefFormat } from '../CefFormat';
import { InvalidValueException, ReservedCharacterException } from '../Exception';
import type { ParameterInterface } from './ParameterInterface';

/**
 * Free-form parameter for tooling that extends CEF with project-specific keys.
 *
 * The name must avoid every reserved character and `:`, since `:` separates a
 * parameter from its value. The value must avoid line breaks but is otherwise
 * free-form (the spec only reserves characters for *structured* values).
 */
export class CustomParameter implements ParameterInterface {
  public readonly name: string;

  public readonly value: string;

  /**
   * @throws {CefFormatException}
   */
  public constructor(name: string, value: string) {
    const trimmedName = name.trim();

    if (trimmedName === '') {
      throw new InvalidValueException('Custom parameter name cannot be empty.');
    }

    if (trimmedName.includes(':')) {
      throw new ReservedCharacterException('Custom parameter name cannot contain ":".');
    }

    CefFormat.assertValueIsClean(trimmedName, 'Custom parameter name');
    CefFormat.assertNoReservedNorLineBreak(value, 'Custom parameter value');

    this.name = trimmedName;
    this.value = value;
  }

  public getName(): string {
    return this.name;
  }

  public getFormattedValue(_autoFormat = true): string {
    return this.value;
  }
}
