import * as fs from 'node:fs';

import type { WriteTarget } from './Cef';

/**
 * A {@link WriteTarget} backed by a real file descriptor, opened in truncating
 * write mode. Created automatically when a filesystem path is passed to the
 * {@link Cef} constructor in Node.js environments.
 *
 * **Note**: This class is only available in Node.js environments. Browser users
 * must use {@link StringBuffer} or provide a custom {@link WriteTarget}.
 *
 * @example
 * ```typescript
 * import { Cef, FileWriteTarget } from 'cef-writer';
 *
 * const target = new FileWriteTarget('/tmp/election.cvotes');
 * const cef = new Cef({ file: target });
 * // ... add parameters and votes
 * cef.close();
 * ```
 */
export class FileWriteTarget implements WriteTarget {
  private readonly fd: number;

  private closed = false;

  public constructor(path: string) {
    this.fd = fs.openSync(path, 'w');
  }

  public write(chunk: string): number {
    return fs.writeSync(this.fd, Buffer.from(chunk, 'utf-8'));
  }

  public close(): void {
    if (!this.closed) {
      fs.closeSync(this.fd);
      this.closed = true;
    }
  }
}
