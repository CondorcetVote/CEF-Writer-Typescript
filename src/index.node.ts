/**
 * CEF Writer — a TypeScript library that streams valid Condorcet Election
 * Format (CEF) documents to a file or string buffer with a friendly object API.
 *
 * This is the Node.js entry point with full file system support via
 * {@link FileWriteTarget}. For browser-only usage, import from
 * `@condorcet.vote/cef-writer/browser` which excludes Node.js dependencies.
 *
 * TypeScript port of {@link https://github.com/CondorcetVote/CEF-Writer | CondorcetVote/CEF-Writer}.
 */

import { Cef } from './Cef';
import { FileWriteTarget } from './FileWriteTarget';

// Wire the file-path convenience for Node.js. This is the side effect that
// makes `new Cef({ file: '/some/path' })` work; the browser entry point omits
// it, keeping `node:fs` out of browser bundles. Marked in package.json's
// `sideEffects` so bundlers never tree-shake this registration away.
Cef.fileWriteTargetFactory = (path: string): FileWriteTarget => new FileWriteTarget(path);

export { Cef, StringBuffer, type CefOptions, type WriteTarget } from './Cef';
export { FileWriteTarget } from './FileWriteTarget';
export { CefFormat } from './CefFormat';
export { CommentLine } from './CommentLine';
export { Ranking } from './Ranking';
export { VoteLine } from './VoteLine';

export {
  CefFormatException,
  CefWriteException,
  DuplicateCandidateException,
  InvalidUtf8Exception,
  InvalidValueException,
  InvalidWriterStateException,
  ReservedCharacterException,
} from './Exception';

export {
  CandidatesParameter,
  CustomParameter,
  ImplicitRankingParameter,
  NumberOfSeatsParameter,
  StandardParameter,
  VotingMethodsParameter,
  WeightAllowedParameter,
  type ParameterInterface,
} from './Parameter';
