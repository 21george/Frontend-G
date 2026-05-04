/**
 * Structured API error handling — extracts safe, user-friendly messages
 * from Axios errors without exposing internal URLs or sensitive data.
 *
 * Usage:
 *   import { parseApiError } from '@/lib/api/errors'
 *   const err = parseApiError(error)
 *   // → { title: 'Not Found', message: 'Client not found', status: 404 }
 */

/* ── Public type ──────────────────────────────────────────────────────────── */
export interface ApiError {
  /** Human-readable title (e.g. "Unauthorized", "Not Found") */
  title: string
  /** Safe, user-facing message — never leaks internal URLs or stack traces */
  message: string
  /** HTTP status code, or 0 for network errors */
  status: number
}

/* ── Status → title mapping ────────────────────────────────────────────────── */
const STATUS_TITLES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Session Expired',
  403: 'Access Denied',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Validation Error',
  429: 'Too Many Requests',
  500: 'Server Error',
  502: 'Server Error',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
}

/* ── Fallback messages per status ───────────────────────────────────────────── */
const FALLBACK_MESSAGES: Record<number, string> = {
  400: 'The request was invalid. Please check your input and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You don\'t have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'A conflict occurred. The data may have already been modified.',
  422: 'Some fields contain invalid values.',
  429: 'You\'re making too many requests. Please wait a moment.',
  500: 'Something went wrong on our end. Please try again later.',
  502: 'The server is temporarily unavailable. Please try again.',
  503: 'The service is temporarily unavailable. Please try again later.',
  504: 'The gateway timed out. Please try again later.',
}

/* ── Known API message patterns to redact ──────────────────────────────────── */
const INTERNAL_PATTERNS = [
  /stack/i,
  /traceback/i,
  /exception/i,
  /at\s+\w+\.\w+\(/,          // stack-frame patterns like "at Object.foo ("
  /\/api\/v1\//i,              // internal API paths
  /mongodb|mongoose/i,         // DB driver leaks
  /jwt/i,                      // token internals
  /bcrypt/i,                   // hashing internals
  /ECONNREFUSED|ETIMEDOUT/i,  // raw network errors
]

function isInternalMessage(msg: string): boolean {
  return INTERNAL_PATTERNS.some((p) => p.test(msg))
}

/* ── Core parser ──────────────────────────────────────────────────────────── */
export function parseApiError(error: unknown): ApiError {
  // 1. Axios-style error with response
  if (error && typeof error === 'object' && (error as any).response) {
    const res = (error as any).response
    const status = res?.status ?? 0
    const data = res?.data

    // Prefer the API-provided message if it's safe
    const apiMessage =
      typeof data?.message === 'string' && data.message.trim() && !isInternalMessage(data.message)
        ? data.message.trim()
        : null

    // For validation errors (422), include field-level detail
    if (status === 422 && data?.errors && typeof data.errors === 'object') {
      const fieldMessages = Object.values(data.errors as Record<string, string[]>)
        .flat()
        .filter((m): m is string => typeof m === 'string')
        .slice(0, 3) // cap at 3 to avoid overwhelming the UI
        .join('; ')

      return {
        title: STATUS_TITLES[422],
        message: fieldMessages || FALLBACK_MESSAGES[422],
        status: 422,
      }
    }

    return {
      title: STATUS_TITLES[status] ?? 'Error',
      message: apiMessage ?? FALLBACK_MESSAGES[status] ?? 'An unexpected error occurred.',
      status,
    }
  }

  // 2. Network error (no response at all)
  if (error && typeof error === 'object' && 'request' in error && !(error as any).response) {
    return {
      title: 'Network Error',
      message: 'Could not reach the server. Please check your internet connection and try again.',
      status: 0,
    }
  }

  // 3. Timeout — check Axios error code first (reliable), then fall back to message
  if (error && typeof error === 'object') {
    const code = (error as { code?: string }).code
    if (code === 'ECONNABORTED' || code === 'ERR_CANCELED') {
      return {
        title: 'Request Timed Out',
        message: 'The server took too long to respond. Please try again.',
        status: 0,
      }
    }
  }
  if (error instanceof Error && error.message?.toLowerCase().includes('timeout')) {
    return {
      title: 'Request Timed Out',
      message: 'The server took too long to respond. Please try again.',
      status: 0,
    }
  }

  // 4. Generic Error instance
  if (error instanceof Error) {
    const msg = error.message && !isInternalMessage(error.message) ? error.message : 'An unexpected error occurred.'
    return {
      title: 'Error',
      message: msg,
      status: 0,
    }
  }

  // 5. Unknown
  return {
    title: 'Error',
    message: 'An unexpected error occurred.',
    status: 0,
  }
}

/* ── Retry policy for React Query ──────────────────────────────────────────── */
/**
 * Determines whether a failed request should be retried.
 * Returns false immediately for auth errors (401/403) since retrying won't help;
 * otherwise allows up to `maxRetries` attempts (default 2).
 */
export function shouldRetryRequest(failureCount: number, err: any, maxRetries = 2): boolean {
  const status = err?.response?.status
  if (status === 401 || status === 403) return false
  return failureCount < maxRetries
}