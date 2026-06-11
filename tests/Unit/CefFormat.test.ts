import { describe, expect, it } from 'bun:test';

import { CefFormat } from '../../src';
import {
  InvalidUtf8Exception,
  InvalidValueException,
  ReservedCharacterException,
} from '../../src';
import { expectThrows } from '../helpers';

const RESERVED = ['>', '=', ';', ',', '#', '/', '*', '^'];

describe('CefFormat', () => {
  it('lists the reserved characters mandated by the spec', () => {
    expect(CefFormat.RESERVED_CHARACTERS).toEqual(['>', '=', ';', ',', '#', '/', '*', '^']);
  });

  it('exposes the blank-ballot sentinel verbatim', () => {
    expect(CefFormat.EMPTY_RANKING).toBe('/EMPTY_RANKING/');
  });

  it('exposes the tags separator', () => {
    expect(CefFormat.TAGS_SEPARATOR).toBe('||');
  });

  it('rejects empty strings', () => {
    expectThrows(() => CefFormat.assertValueIsClean('', 'X'), InvalidValueException, 'empty');
  });

  for (const reserved of RESERVED) {
    it(`rejects values containing the reserved character "${reserved}"`, () => {
      expectThrows(
        () => CefFormat.assertValueIsClean('foo' + reserved + 'bar', 'X'),
        ReservedCharacterException,
        'reserved',
      );
    });
  }

  for (const brk of ['\n', '\r', '\r\n']) {
    it('rejects values containing line breaks', () => {
      expectThrows(
        () => CefFormat.assertValueIsClean('foo' + brk + 'bar', 'X'),
        InvalidValueException,
        'line break',
      );
    });
  }

  it('accepts inline-comment text that has no line break', () => {
    expect(() =>
      CefFormat.assertSingleLine('this is fine; with # symbols / and *', 'X'),
    ).not.toThrow();
  });

  it('rejects inline-comment text that has a line break', () => {
    expectThrows(() => CefFormat.assertSingleLine('ok\nno good', 'X'), InvalidValueException);
  });

  it('rejects values containing a null byte (assertValueIsClean)', () => {
    expectThrows(
      () => CefFormat.assertValueIsClean('Ali\0ce', 'X'),
      InvalidValueException,
      'null byte',
    );
  });

  it('rejects values containing a null byte (assertNoReservedNorLineBreak)', () => {
    expectThrows(
      () => CefFormat.assertNoReservedNorLineBreak('Ali\0ce', 'X'),
      InvalidValueException,
      'null byte',
    );
  });

  it('rejects values containing a null byte (assertSingleLine)', () => {
    expectThrows(
      () => CefFormat.assertSingleLine('Ali\0ce', 'X'),
      InvalidValueException,
      'null byte',
    );
  });

  for (const badUtf8 of ['\uD800', '\uDFFF', 'a\uD834b', '\uDC00\uD800']) {
    it('rejects ill-formed (non-UTF-8-encodable) strings (assertValueIsClean)', () => {
      expectThrows(
        () => CefFormat.assertValueIsClean(badUtf8, 'X'),
        InvalidUtf8Exception,
        'invalid UTF-8',
      );
    });
  }

  it('rejects ill-formed strings (assertNoReservedNorLineBreak)', () => {
    expectThrows(
      () => CefFormat.assertNoReservedNorLineBreak('\uD800', 'X'),
      InvalidUtf8Exception,
      'invalid UTF-8',
    );
  });

  it('rejects ill-formed strings (assertSingleLine)', () => {
    expectThrows(() => CefFormat.assertSingleLine('\uD800', 'X'), InvalidUtf8Exception, 'invalid UTF-8');
  });

  it('still accepts valid UTF-8 multi-byte sequences', () => {
    expect(() => CefFormat.assertValueIsClean('Élise 日本語 🗳', 'X')).not.toThrow();
  });
});

describe('CefFormat.assertNoReservedNorLineBreak', () => {
  it('accepts an empty string (unlike assertValueIsClean)', () => {
    expect(() => CefFormat.assertNoReservedNorLineBreak('', 'X')).not.toThrow();
  });

  for (const reserved of RESERVED) {
    it(`rejects the reserved character "${reserved}"`, () => {
      expectThrows(
        () => CefFormat.assertNoReservedNorLineBreak('foo' + reserved + 'bar', 'X'),
        ReservedCharacterException,
        'reserved',
      );
    });
  }

  for (const brk of ['\n', '\r', '\r\n']) {
    it('rejects line breaks', () => {
      expectThrows(
        () => CefFormat.assertNoReservedNorLineBreak('foo' + brk + 'bar', 'X'),
        InvalidValueException,
        'line break',
      );
    });
  }

  it('accepts UTF-8 content without reserved characters', () => {
    expect(() => CefFormat.assertNoReservedNorLineBreak('Élise 日本語 🗳', 'X')).not.toThrow();
  });
});
