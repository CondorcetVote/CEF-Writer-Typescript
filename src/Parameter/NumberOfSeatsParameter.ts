import { InvalidValueException } from '../Exception';
import type { ParameterInterface } from './ParameterInterface';
import { StandardParameter } from './StandardParameter';

/**
 * `#/Number of Seats:` parameter — strictly positive integer.
 */
export class NumberOfSeatsParameter implements ParameterInterface {
  /**
   * @throws {CefFormatException}
   */
  public constructor(public readonly seats: number) {
    if (!Number.isInteger(seats) || seats < 1) {
      throw new InvalidValueException('Number of seats must be a positive integer.');
    }
  }

  public getName(): string {
    return StandardParameter.NumberOfSeats;
  }

  public getFormattedValue(_autoFormat = true): string {
    return String(this.seats);
  }
}
