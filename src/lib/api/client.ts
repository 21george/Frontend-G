import axios from 'axios'
import { parseApiError } from './errors'

const resolveBaseUrl = () => {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8000/v1'
  const normalized = raw.replace(/\/+$/, '')
  return normalized.endsWith('/v1') ? normalized : `${normalized}/v1`
}

const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
  withCredentials: true, // send httpOnly cookies automatically
})

// Token management for Bearer authentication
let getAuthToken: () => string | null = () => null

export const setAuthTokenGetter = (getter: () => string | null) => {
  getAuthToken = getter
}

export const setAuthToken = (token: string) => {
  // Token is now stored in auth store, this is for compatibility
  getAuthToken = () => token
}

// ── Response: refresh on 401, global error normalisation ──────────────────────
let isRefreshing = false
let refreshQueue: Array<{ resolve: () => void; reject: (err: unknown) => void }> = []

const processQueue = (error: unknown = null) => {
  refreshQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()))
  refreshQueue = []
}

// Auth endpoints that should never trigger a token refresh
const AUTH_PATHS = ['/auth/coach/login', '/auth/client/login', '/auth/coach/register', '/auth/refresh', '/auth/verify-email', '/auth/resend-verification']

// Callback for clearing auth state (set by auth store to avoid circular dependency)
let onAuthInvalidated: (() => void) | null = null

export const setAuthInvalidationCallback = (callback: () => void) => {
  onAuthInvalidated = callback
}

let onTokenRefreshed: ((token: string) => void) | null = null

/**
 * Register a callback invoked when the access token is refreshed.
 *
 * ⚠ The callback MUST write the new token to auth storage synchronously
 * (e.g. via a synchronous setter like `setToken`) before returning.
 * This ensures that the retried `api(original)` call reads the updated
 * token via `getAuthToken` immediately — async or batched state updates
 * (e.g. React setState) may not be flushed in time for the retry.
 */
export const setTokenRefreshCallback = (callback: (token: string) => void) => {
  onTokenRefreshed = callback
}

// Request interceptor to add Bearer token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    // Auth endpoints (especially /auth/refresh) must rely on the httpOnly cookie
    const isAuthPath = AUTH_PATHS.some((p) => config.url?.includes(p))
    if (token && config.headers && !isAuthPath) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error?.config
    const url = original?.url || ''
    const status = error?.response?.status

    // Log structured error info for debugging (skip 401/403 — handled below)
    if (status && status >= 400 && status !== 401 && status !== 403) {
      const parsed = parseApiError(error)
      console.error(`[API] ${parsed.status} ${parsed.title}: ${parsed.message}`)
    }

    // Handle 403 Forbidden - session expired or invalid, redirect to login
    if (status === 403) {
      // Clear auth state via callback
      onAuthInvalidated?.()
      // Redirect to login if not already on auth page
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login'
      }
      return Promise.reject(error)
    }

    // Handle 401 Unauthorized - try to refresh token
    if (
      status !== 401 ||
      original?._retry ||
      AUTH_PATHS.some((p) => url.includes(p))
    ) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then(() => api(original))
    }

    original._retry = true
    isRefreshing = true

    try {
      // httpOnly refresh_token cookie is sent automatically
      const res = await api.post('/auth/refresh')
      const newToken: string | undefined =
        res.data?.data?.access_token ?? res.data?.access_token
      if (newToken) {
        if (onTokenRefreshed) {
          onTokenRefreshed(newToken)
        } else {
          // No token callback registered — surface misconfiguration and abort
          const misconfig = new Error('[API] Token refresh succeeded but no token callback is registered. Retried requests will use the old token.')
          console.error(misconfig.message)
          processQueue(misconfig)
          onAuthInvalidated?.()
          return Promise.reject(misconfig)
        }
      }
      processQueue()
      return api(original)
    } catch (err) {
      processQueue(err)
      // Clear auth state and redirect on refresh failure
      onAuthInvalidated?.()
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login'
      }
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
