/**
 * Safely extract an error message from an unknown caught value.
 *
 * Usage:
 * ```ts
 * catch (error: unknown) {
 *   log.error('Something failed', { error: getErrorMessage(error) })
 * }
 * ```
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}
