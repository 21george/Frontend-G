import axios from 'axios'

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

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error?.config
    const url = original?.url || ''
    const status = error?.response?.status

    // Log error for debugging
    if (status && status >= 400) {
      console.error(`API Error ${status}: ${url}`, error?.response?.data)
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
      await api.post('/auth/refresh')
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
