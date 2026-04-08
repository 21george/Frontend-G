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
const AUTH_PATHS = ['/auth/coach/login', '/auth/client/login', '/auth/coach/register', '/auth/refresh']

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    const url = original?.url || ''
    if (
      error.response?.status !== 401 ||
      original._retry ||
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
      window.location.href = '/auth/login'
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
