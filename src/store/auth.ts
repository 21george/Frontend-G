import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Coach } from '@/types'
import { setAuthInvalidationCallback } from '@/lib/api/client'

const resolveBaseUrl = () => {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8000/v1'
  const normalized = raw.replace(/\/+$/, '')
  return normalized.endsWith('/v1') ? normalized : `${normalized}/v1`
}

interface AuthState {
  coach: Coach | null
  isAuthenticated: boolean
  setCoach: (coach: Coach) => void
  updateCoach: (coach: Coach) => void
  logout: () => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      coach: null,
      isAuthenticated: false,
      setCoach: (coach) => {
        set({ coach, isAuthenticated: true })
      },
      updateCoach: (coach) => {
        set({ coach, isAuthenticated: true })
      },
      logout: () => {
        // Clear httpOnly cookies via backend; use raw fetch to avoid interceptor loop
        fetch(`${resolveBaseUrl()}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        }).catch(() => {})
        set({ coach: null, isAuthenticated: false })
      },
      clearAuth: () => {
        // Clear local state only (e.g., when session expires or 401/403 received)
        set({ coach: null, isAuthenticated: false })
      },
    }),
    { name: 'coach-auth', partialize: (s) => ({ coach: s.coach, isAuthenticated: s.isAuthenticated }) }
  )
)

// Register callback for API client to clear auth on 403/refresh failure
setAuthInvalidationCallback(() => {
  useAuthStore.getState().clearAuth()
})
