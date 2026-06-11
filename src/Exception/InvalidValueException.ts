import { CefFormatException } from './CefFormatException';

/**
 * Thrown when a value is structurally impossible at the CEF level — regardless
 * of which reserved/UTF-8 rule it would otherwise hit.
 *
 * Typical triggers:
 *   - empty string where one is required (candidate name, tag, parameter name);
 *   - embedded line break or null byte;
 *   - non-positive `weight` or `quantifier`;
 *   - empty list when one or more entries are required (candidates, methods);
 *   - empty rank inside a ranking.
 */
export class InvalidValueException extends CefFormatException {}
