import { describe, expect, it } from 'bun:test';

import { Cef, CommentLine, StringBuffer, VoteLine } from '../../src';
import {
  CandidatesParameter,
  ImplicitRankingParameter,
  WeightAllowedParameter,
} from '../../src';
import { InvalidValueException, InvalidWriterStateException } from '../../src';
import { expectThrows, makeStringCef } from '../helpers';

describe('Cef string target', () => {
  it('appends to the caller buffer', () => {
    const [cef, buffer] = makeStringCef();

    cef.addComment(new CommentLine('first line'));
    cef.addEmptyLine();

    expect(buffer()).toBe('# first line\n\n');
  });

  it('throws when neither file nor string is provided', () => {
    expectThrows(() => new Cef(), InvalidWriterStateException, 'Exactly one');
  });

  it('throws when both file and string are provided', () => {
    expectThrows(
      () => new Cef({ file: '/tmp/whatever', string: new StringBuffer() }),
      InvalidWriterStateException,
      'Exactly one',
    );
  });

  it("reproduces the spec's implicit-ranking example almost verbatim", () => {
    const [cef, buffer] = makeStringCef();
    cef.autoFormat = true;

    cef.addComment(new CommentLine('My beautiful election'));
    cef.addParameter(new CandidatesParameter(['Candidate A', 'Candidate B', 'Candidate C']));
    cef.addParameter(new ImplicitRankingParameter(true));
    cef.addParameter(new WeightAllowedParameter(true));
    cef.addComment(new CommentLine('Here the votes datas:'));

    cef.addVote(
      VoteLine.fromRanking([['Candidate A'], ['Candidate B'], ['Candidate C']], { quantifier: 42 }),
    );
    cef.addVote(
      VoteLine.fromRanking([['Candidate A'], ['Candidate B'], ['Candidate C']], {
        tags: ['julien@condorcet.vote', 'signature:55073db57b0a859911'],
      }),
    );
    cef.addVote(
      VoteLine.fromRanking([['Candidate C'], ['Candidate A', 'Candidate B']], {
        weight: 7,
        quantifier: 8,
      }),
    );

    expect(buffer()).toContain('#/Candidates: Candidate A ; Candidate B ; Candidate C');
    expect(buffer()).toContain('#/Implicit Ranking: true');
    expect(buffer()).toContain('#/Weight Allowed: true');
    expect(buffer()).toContain('Candidate A > Candidate B > Candidate C * 42');
    expect(buffer()).toContain(
      'julien@condorcet.vote, signature:55073db57b0a859911 || Candidate A > Candidate B > Candidate C',
    );
    expect(buffer()).toContain('Candidate C > Candidate A = Candidate B ^7 * 8');
  });

  it('uses compact formatting when autoFormat is off', () => {
    const [cef, buffer] = makeStringCef(false);

    cef.addParameter(new CandidatesParameter(['A', 'B']));
    cef.addVote(VoteLine.fromRanking([['A'], ['B']]));

    expect(buffer()).toBe('#/Candidates:A;B\nA>B\n');
  });

  it('inserts an automatic blank line between params and votes when autoFormat is on', () => {
    const [cef, buffer] = makeStringCef(true);

    cef.addParameter(new CandidatesParameter(['A', 'B']));
    cef.addVote(VoteLine.fromRanking([['A'], ['B']]));

    expect(buffer()).toBe('#/Candidates: A ; B\n\nA > B\n');
  });

  it('does NOT insert an automatic blank line when autoFormat is off', () => {
    const [cef, buffer] = makeStringCef(false);

    cef.addParameter(new CandidatesParameter(['A', 'B']));
    cef.addVote(VoteLine.fromRanking([['A'], ['B']]));

    expect(buffer()).toBe('#/Candidates:A;B\nA>B\n');
  });

  it('does not insert an auto separator when no parameter was written', () => {
    const [cef, buffer] = makeStringCef(true);

    cef.addVote(VoteLine.fromRanking([['A']]));

    expect(buffer()).toBe('A\n');
  });

  it('inserts the auto separator only once even with multiple vote calls', () => {
    const [cef, buffer] = makeStringCef(true);

    cef.addParameter(new CandidatesParameter(['A', 'B']));
    cef.addVote(VoteLine.fromRanking([['A']]));
    cef.addVote(VoteLine.fromRanking([['B']]));

    expect(buffer().split('\n\n').length - 1).toBe(1);
  });

  it('locks parameter writing after the first vote', () => {
    const [cef] = makeStringCef();

    cef.addParameter(new CandidatesParameter(['A']));
    cef.addVote(VoteLine.fromRanking([['A']]));

    expectThrows(
      () => cef.addParameter(new ImplicitRankingParameter(true)),
      InvalidWriterStateException,
      'before any vote',
    );
  });

  it('allows comments and empty lines on either side of the vote boundary', () => {
    const [cef, buffer] = makeStringCef();

    cef.addComment(new CommentLine('preamble'));
    cef.addParameter(new CandidatesParameter(['A']));
    cef.addComment(new CommentLine('between'));
    cef.addEmptyLine();
    cef.addVote(VoteLine.fromRanking([['A']]));
    cef.addComment(new CommentLine('trailing'));

    expect(buffer()).toContain('# preamble');
    expect(buffer()).toContain('# between');
    expect(buffer()).toContain('# trailing');
  });

  it('renders a vote with an inline comment', () => {
    const [cef, buffer] = makeStringCef();

    cef.addVote(VoteLine.fromRanking([['A']], { inlineComment: 'my note' }));

    expect(buffer()).toBe('A # my note\n');
  });

  it('renders an inline comment compactly when autoFormat is off', () => {
    const [cef, buffer] = makeStringCef(false);

    cef.addVote(VoteLine.fromRanking([['A']], { inlineComment: 'note' }));

    expect(buffer()).toBe('A#note\n');
  });

  it('exposes addCommentLine() as a shortcut that builds a CommentLine for you', () => {
    const [cef, buffer] = makeStringCef();

    cef.addCommentLine('hello world');

    expect(buffer()).toBe('# hello world\n');
  });

  it('addCommentLine() validates the text just like CommentLine would', () => {
    const [cef] = makeStringCef();

    expectThrows(() => cef.addCommentLine('multi\nline'), InvalidValueException);
  });

  it('returns this from every add method to support chaining', () => {
    const [cef] = makeStringCef();

    const result = cef
      .addParameter(new CandidatesParameter(['A']))
      .addEmptyLine()
      .addComment(new CommentLine('x'))
      .addVote(VoteLine.fromRanking([['A']]));

    expect(result).toBe(cef);
  });
});
