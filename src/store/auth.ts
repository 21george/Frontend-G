import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Coach } from '@/types'

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
    }),
    { name: 'coach-auth', partialize: (s) => ({ coach: s.coach, isAuthenticated: s.isAuthenticated }) }
  )
)
