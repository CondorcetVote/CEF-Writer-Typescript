import { CefFormatException } from './CefFormatException';

/**
 * Thrown when the same candidate label appears more than once where the CEF
 * specification forbids it — either in `#/Candidates:` or in a single vote's
 * ranking (across tied groups included).
 */
export class DuplicateCandidateException extends CefFormatException {}
