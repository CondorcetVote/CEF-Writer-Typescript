import { describe, expect, it } from 'bun:test';

import { CustomParameter } from '../../../src';
import { InvalidValueException, ReservedCharacterException } from '../../../src';
import { expectThrows } from '../../helpers';

describe('CustomParameter', () => {
  it('exposes the supplied name and value', () => {
    const param = new CustomParameter('My Setting', 'some-value');

    expect(param.getName()).toBe('My Setting');
    expect(param.getFormattedValue(false)).toBe('some-value');
    expect(param.getFormattedValue(true)).toBe('some-value');
  });

  it('trims the name', () => {
    const param = new CustomParameter('   My Setting   ', 'value');

    expect(param.name).toBe('My Setting');
  });

  it('preserves whitespace inside the value', () => {
    const param = new CustomParameter('Key', '  spaced value  ');

    expect(param.value).toBe('  spaced value  ');
  });

  it('rejects an empty name', () => {
    expectThrows(() => new CustomParameter('   ', 'value'), InvalidValueException, 'empty');
  });

  for (const reserved of ['>', '=', ';', ',', '#', '/', '*', '^']) {
    it(`rejects a name containing the reserved character "${reserved}"`, () => {
      expectThrows(
        () => new CustomParameter('Foo' + reserved + 'Bar', 'value'),
        ReservedCharacterException,
        'reserved',
      );
    });
  }

  it('rejects a name containing a colon', () => {
    expectThrows(() => new CustomParameter('Foo:Bar', 'value'), ReservedCharacterException, ':');
  });

  for (const brk of ['\n', '\r', '\r\n']) {
    it('rejects a name containing a line break', () => {
      expectThrows(
        () => new CustomParameter('Foo' + brk + 'Bar', 'value'),
        InvalidValueException,
        'line break',
      );
    });
  }

  it('rejects a value containing a newline', () => {
    expectThrows(() => new CustomParameter('Foo', 'line1\nline2'), InvalidValueException);
  });

  for (const reserved of ['>', '=', ';', ',', '#', '/', '*', '^']) {
    it(`rejects a value containing the reserved character "${reserved}"`, () => {
      expectThrows(
        () => new CustomParameter('Foo', 'hello' + reserved + 'world'),
        ReservedCharacterException,
        'reserved',
      );
    });
  }

  it('accepts an empty value (no required minimum content)', () => {
    const param = new CustomParameter('Foo', '');

    expect(param.value).toBe('');
  });

  it('accepts whitespace-only value', () => {
    const param = new CustomParameter('Foo', '   ');

    expect(param.value).toBe('   ');
  });
});
