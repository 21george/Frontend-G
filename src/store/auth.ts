import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Coach } from '@/types'
import { setAuthInvalidationCallback, setAuthTokenGetter, setTokenRefreshCallback } from '@/lib/api/client'
import api from '@/lib/api/client'

const resolveBaseUrl = () => {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8000/v1'
  const normalized = raw.replace(/\/+$/, '')
  return normalized.endsWith('/v1') ? normalized : `${normalized}/v1`
}

interface AuthState {
  coach: Coach | null
  isAuthenticated: boolean
  accessToken: string | null
  setCoach: (coach: Coach, token?: string) => void
  updateCoach: (coach: Coach) => void
  logout: () => void
  clearAuth: () => void
  setToken: (token: string) => void
  refreshAccessToken: () => Promise<string | null>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      coach: null,
      isAuthenticated: false,
      accessToken: null,
      setCoach: (coach, token) => {
        set({ coach, isAuthenticated: true, accessToken: token ?? null })
      },
      updateCoach: (coach) => {
        set({ coach, isAuthenticated: true })
      },
      setToken: (token) => {
        set({ accessToken: token })
      },
      logout: () => {
        // Clear httpOnly cookies via backend; use raw fetch to avoid interceptor loop
        fetch(`${resolveBaseUrl()}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        }).catch(() => {})
        set({ coach: null, isAuthenticated: false, accessToken: null })
      },
      clearAuth: () => {
        // Clear local state only (e.g., when session expires or 401/403 received)
        set({ coach: null, isAuthenticated: false, accessToken: null })
      },
      refreshAccessToken: async () => {
        try {
          const res = await api.post('/auth/refresh')
          const token = res.data?.data?.access_token ?? null
          if (token) {
            set({ accessToken: token })
          }
          return token
        } catch {
          // Refresh failed — clear auth so the user is redirected to login
          get().clearAuth()
          return null
        }
      },
    }),
    { name: 'coach-auth', partialize: (s) => ({ coach: s.coach, isAuthenticated: s.isAuthenticated }) }
  )
)

// Register callback for API client to clear auth on 403/refresh failure
setAuthInvalidationCallback(() => {
  useAuthStore.getState().clearAuth()
})

// Register token getter for API client request interceptor
setAuthTokenGetter(() => useAuthStore.getState().accessToken)

// Register callback so interceptor can update token after refresh
setTokenRefreshCallback((token) => {
  useAuthStore.getState().setToken(token)
})
