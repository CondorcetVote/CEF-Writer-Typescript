import { describe, expect, it } from 'bun:test';

import { CommentLine, InvalidValueException } from '../../src';
import { expectThrows } from '../helpers';

describe('CommentLine', () => {
  it('prefixes the text with "#" and a space when autoFormat is on', () => {
    const comment = new CommentLine('hello world');

    expect(comment.format(true)).toBe('# hello world');
  });

  it('omits the leading space when autoFormat is off', () => {
    const comment = new CommentLine('hello world');

    expect(comment.format(false)).toBe('#hello world');
  });

  it('keeps a user-supplied leading space rather than doubling it', () => {
    const comment = new CommentLine(' hello');

    expect(comment.format(true)).toBe('# hello');
    expect(comment.format(false)).toBe('# hello');
  });

  it('renders a lone "#" for an empty comment text', () => {
    const comment = new CommentLine('');

    expect(comment.format(true)).toBe('#');
    expect(comment.format(false)).toBe('#');
  });

  it('rejects a multi-line comment text', () => {
    expectThrows(() => new CommentLine('one\ntwo'), InvalidValueException);
  });
});
