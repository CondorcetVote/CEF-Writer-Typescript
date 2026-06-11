import * as fs from 'node:fs';

import { describe, expect, it } from 'bun:test';

import { Cef, FileWriteTarget, StringBuffer, VoteLine } from '../../src';
import { CandidatesParameter } from '../../src';
import { makeTempPath } from '../helpers';

describe('Cef file target', () => {
  it('writes to a path provided as a string', () => {
    const path = makeTempPath();

    const cef = new Cef({ file: path });
    cef.autoFormat = false;
    cef.addParameter(new CandidatesParameter(['A', 'B']));
    cef.addVote(VoteLine.fromRanking([['A'], ['B']]));
    cef.close();

    expect(fs.readFileSync(path, 'utf-8')).toBe('#/Candidates:A;B\nA>B\n');
  });

  it('writes to a provided FileWriteTarget opened on a path', () => {
    const path = makeTempPath();
    const target = new FileWriteTarget(path);

    const cef = new Cef({ file: target });
    cef.autoFormat = false;
    cef.addParameter(new CandidatesParameter(['A']));
    cef.close();

    expect(fs.readFileSync(path, 'utf-8')).toBe('#/Candidates:A\n');
  });

  it('writes through an already-open FileWriteTarget', () => {
    const path = makeTempPath();
    const target = new FileWriteTarget(path);

    const cef = new Cef({ file: target });
    cef.autoFormat = false;
    cef.addParameter(new CandidatesParameter(['Alice', 'Bob']));
    cef.addVote(VoteLine.fromRanking([['Alice']]));
    target.close();

    expect(fs.readFileSync(path, 'utf-8')).toBe('#/Candidates:Alice;Bob\nAlice\n');
  });

  it('exposes the file handle through the readonly file property', () => {
    const path = makeTempPath();

    const cef = new Cef({ file: path });

    expect(cef.file).toBeInstanceOf(FileWriteTarget);
    cef.close();
  });

  it('exposes file as null when writing to a string buffer', () => {
    const buffer = new StringBuffer();
    const cef = new Cef({ string: buffer });

    expect(cef.file).toBeNull();
  });
});
