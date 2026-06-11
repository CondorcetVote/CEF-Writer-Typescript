import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { expect } from 'bun:test';

import { Cef, StringBuffer } from '../src';

/**
 * Build a Cef writer that streams into a fresh string buffer, returning both
 * the writer and a closure that yields the current buffer value.
 */
export function makeStringCef(autoFormat = true): [Cef, () => string] {
  const buffer = new StringBuffer();
  const cef = new Cef({ string: buffer });
  cef.autoFormat = autoFormat;

  return [cef, (): string => buffer.toString()];
}

/**
 * Path to a fresh writable temp file inside a unique temp directory.
 */
export function makeTempPath(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cef-'));

  return path.join(dir, 'election.cvotes');
}

/**
 * Assert that `fn` throws an instance of `errorClass`, optionally carrying a
 * message that contains `messagePart`. Mirrors Pest's `->throws(Class, 'msg')`.
 */
export function expectThrows(
  fn: () => unknown,
  errorClass: new (...args: never[]) => Error,
  messagePart?: string,
): void {
  let thrown: unknown;

  try {
    fn();
  } catch (error) {
    thrown = error;
  }

  expect(thrown).toBeInstanceOf(errorClass);

  if (messagePart !== undefined) {
    expect((thrown as Error).message).toContain(messagePart);
  }
}
