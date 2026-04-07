import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import type { Coach } from '@/types'

const buildCookieOptions = (expires: number) => {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'

  return {
    expires,
    secure: isHttps,
    sameSite: 'strict' as const,
    path: '/',
  }
}

interface AuthState {
  coach: Coach | null
  isAuthenticated: boolean
  setCoach: (coach: Coach, accessToken: string, refreshToken: string) => void
  updateCoach: (coach: Coach) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      coach: null,
      isAuthenticated: false,
      setCoach: (coach, accessToken, refreshToken) => {
        Cookies.set('access_token', accessToken, buildCookieOptions(1 / 96))
        Cookies.set('refresh_token', refreshToken, buildCookieOptions(30))
        set({ coach, isAuthenticated: true })
      },
      updateCoach: (coach) => {
        set({ coach, isAuthenticated: true })
      },
      logout: () => {
        Cookies.remove('access_token', { path: '/' })
        Cookies.remove('refresh_token', { path: '/' })
        set({ coach: null, isAuthenticated: false })
      },
    }),
    { name: 'coach-auth', partialize: (s) => ({ coach: s.coach, isAuthenticated: s.isAuthenticated }) }
  )
)
