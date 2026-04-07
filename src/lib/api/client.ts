import axios from 'axios'
import Cookies from 'js-cookie'

const resolveBaseUrl = () => {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8000/v1'
  const normalized = raw.replace(/\/+$/, '')
  return normalized.endsWith('/v1') ? normalized : `${normalized}/v1`
}

const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

// ── Request: attach access token ──────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: refresh on 401, global error normalisation ──────────────────────
let isRefreshing = false
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

const processQueue = (token: string | null, error: unknown = null) => {
  refreshQueue.forEach(({ resolve, reject }) => (token ? resolve(token) : reject(error)))
  refreshQueue = []
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    const refresh = Cookies.get('refresh_token')
    if (!refresh) {
      isRefreshing = false
      Cookies.remove('access_token')
      Cookies.remove('refresh_token')
      window.location.href = '/auth/login'
      return Promise.reject(error)
    }

    try {
      const { data } = await api.post('/auth/refresh', { refresh_token: refresh })
      const newToken = data.data.access_token
      Cookies.set('access_token', newToken, { expires: 1 / 96, sameSite: 'strict', path: '/' })
      Cookies.set('refresh_token', data.data.refresh_token, { expires: 30, sameSite: 'strict', path: '/' })
      processQueue(newToken)
      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    } catch (err) {
      processQueue(null, err)
      Cookies.remove('access_token')
      Cookies.remove('refresh_token')
      window.location.href = '/auth/login'
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
