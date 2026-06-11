/**
 * CEF Writer — a TypeScript library that streams valid Condorcet Election
 * Format (CEF) documents to a string buffer with a friendly object API.
 *
 * This is the browser-only entry point. For Node.js usage, import from the
 * main export which includes {@link FileWriteTarget} for file system access.
 *
 * TypeScript port of {@link https://github.com/CondorcetVote/CEF-Writer | CondorcetVote/CEF-Writer}.
 */

export { Cef, StringBuffer, type CefOptions, type WriteTarget } from './Cef';
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
