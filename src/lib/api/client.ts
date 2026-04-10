import axios from 'axios'

const resolveBaseUrl = () => {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8000/v1'
  const normalized = raw.replace(/\/+$/, '')
  return normalized.endsWith('/v1') ? normalized : `${normalized}/v1`
}


let accessToken: string | null = null;
let accessTokenExpiry: number | null = null;
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
  withCredentials: true, // send httpOnly cookies automatically
});

function setAccessToken(token: string, expiresIn: number) {
  accessToken = token;
  accessTokenExpiry = Date.now() + expiresIn * 1000 - 5000; // 5s early
}

function isAccessTokenExpired() {
  return !accessToken || !accessTokenExpiry || Date.now() > accessTokenExpiry;
}

async function refreshToken() {
  const res = await api.post('/auth/refresh');
  const { access_token, refresh_token, expires_in } = res.data.data;
  setAccessToken(access_token, expires_in || 900);
}

async function getAccessToken() {
  if (!isAccessTokenExpired()) return accessToken;
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = refreshToken().finally(() => {
      isRefreshing = false;
    });
  }
  await refreshPromise;
  return accessToken;
}

// ── Response: refresh on 401, global error normalisation ──────────────────────

const AUTH_PATHS = ['/auth/coach/login', '/auth/client/login', '/auth/coach/register', '/auth/refresh'];

api.interceptors.request.use(async (config) => {
  // Only attach Authorization if not an auth endpoint
  if (!AUTH_PATHS.some((p) => config.url?.includes(p))) {
    const token = await getAccessToken();
    if (token) config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    const url = original?.url || '';
    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      await new Promise((r) => setTimeout(r, 1000));
      return api(original);
    }
    // Handle 401 Unauthorized
    if (
      error.response?.status !== 401 ||
      original._retry ||
      AUTH_PATHS.some((p) => url.includes(p))
    ) {
      return Promise.reject(error);
    }
    if (isRefreshing) {
      await refreshPromise;
      return api(original);
    }
    original._retry = true;
    isRefreshing = true;
    try {
      await refreshToken();
      return api(original);
    } catch (err) {
      window.location.href = '/auth/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api
