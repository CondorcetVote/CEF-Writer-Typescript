import { describe, expect, it } from 'bun:test';

import { Cef, CefWriteException, type WriteTarget } from '../../src';
import { CandidatesParameter } from '../../src';

/**
 * A write target whose every write reports failure (zero bytes written). Used
 * to simulate a broken underlying file target without touching the filesystem.
 */
class FailingWriteTarget implements WriteTarget {
  public write(): number {
    return 0;
  }
}

/**
 * A write target that throws on every write — the I/O-error path.
 */
class ThrowingWriteTarget implements WriteTarget {
  public write(): number {
    throw new Error('disk on fire');
  }
}

describe('Cef write failure', () => {
  it('throws CefWriteException when the underlying file write fails', () => {
    const cef = new Cef({ file: new FailingWriteTarget() });

    let thrown: unknown;

    try {
      cef.addParameter(new CandidatesParameter(['Alice', 'Bob']));
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(CefWriteException);
    expect((thrown as Error).message).toContain('Failed to write');
  });

  it('reports the byte count that failed to write', () => {
    const cef = new Cef({ file: new FailingWriteTarget() });

    try {
      cef.addParameter(new CandidatesParameter(['Alice']));
      throw new Error('expected CefWriteException');
    } catch (error) {
      expect(error).toBeInstanceOf(CefWriteException);
      expect((error as Error).message).toContain('bytes');
      expect((error as Error).message).toContain('write returned');
    }
  });

  it('wraps a throwing target into a CefWriteException carrying the cause', () => {
    const cef = new Cef({ file: new ThrowingWriteTarget() });

    let thrown: unknown;

    try {
      cef.addParameter(new CandidatesParameter(['Alice']));
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(CefWriteException);
    expect((thrown as Error & { cause?: unknown }).cause).toBeInstanceOf(Error);
  });
});
