/**
 * Extracts a human-readable error message from any error object.
 * Works with:
 *  - Error thrown by errorInterceptor  → err.message
 *  - Raw HttpErrorResponse             → err.error?.message
 *  - Plain string                      → err
 */
export function extractErrorMessage(err: any, fallback = 'Une erreur est survenue'): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  // Interceptor wraps in Error — read .message first
  if (err instanceof Error && err.message) return err.message;
  // Raw HttpErrorResponse body
  if (err?.error?.message) return err.error.message;
  if (err?.error?.error)   return err.error.error;
  if (err?.message)        return err.message;
  return fallback;
}
