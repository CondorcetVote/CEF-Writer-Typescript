/**
 * Utility functions for CEF Writer
 */

export function sanitize(input: string): string {
  return input.replace(/[|=\n\r]/g, '\\$&');
}
