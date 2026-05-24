'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { useSubscriptionStore } from '@/store/subscription'
import Sidebar from '@/components/layout/Sidebar'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { motion } from 'framer-motion'

function AuthLayout({
  children,
  showHeader = true,
  showGreeting = false,
}: {
  children: React.ReactNode
  showHeader?: boolean
  showGreeting?: boolean
}) {
  const { isAuthenticated, accessToken, refreshAccessToken, clearAuth, coach } = useAuthStore()
  const { setupToken } = useSubscriptionStore()
  const router = useRouter()
  const refreshInProgressRef = useRef(false)
  const [isLoading, setIsLoading] = useState(true)

  // Wait for Zustand's persist middleware to rehydrate from localStorage before
  // making any routing decisions. Without this, the first render always sees
  // isAuthenticated=false (initial state) and immediately redirects to /auth/login,
  // which then bounces back once hydration completes — causing an infinite loop.
  const [isHydrated, setIsHydrated] = useState(() => useAuthStore.persist.hasHydrated())

  useEffect(() => {
    if (isHydrated) return
    const unsub = useAuthStore.persist.onFinishHydration(() => setIsHydrated(true))
    return unsub
  }, [isHydrated])

  useEffect(() => {
    if (!isHydrated) return

    if (!isAuthenticated) {
      router.replace('/auth/login')
      return
    }

    // Pending coaches must complete subscription selection before accessing the app
    if (coach?.subscription_status === 'pending') {
      const token = setupToken ?? '';
      const coachId = coach.id ?? '';
      if (token && coachId) {
        router.replace(`/subscription/select-plan?token=${encodeURIComponent(token)}&coach_id=${coachId}`);
      } else {
        router.replace('/auth/login');
      }
      return
    }

    // Silently obtain a new access token on app load when the in-memory
    // token is absent (e.g. after a page refresh rehydrated coach/isAuthenticated
    // from localStorage but accessToken was not persisted).
    if (!accessToken && !refreshInProgressRef.current) {
      refreshInProgressRef.current = true
      setIsLoading(true)
      refreshAccessToken()
        .then((token) => {
          if (!token) {
            // Refresh returned null — session is invalid
            clearAuth()
            router.replace('/auth/login')
          }
        })
        .catch(() => {
          // Unexpected error — clear auth and redirect
          clearAuth()
          router.replace('/auth/login')
        })
        .finally(() => {
          refreshInProgressRef.current = false
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, isAuthenticated, accessToken, refreshAccessToken, clearAuth, coach, setupToken])

  if (!isHydrated || !isAuthenticated || isLoading) return null

  // Don't render dashboard content for pending coaches
  if (coach?.subscription_status === 'pending') return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="min-h-screen flex bg-slate-100 dark:bg-[#121212]"
    >
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-x-hidden">
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-6 sm:pb-10">
          {showHeader && <DashboardHeader showGreeting={showGreeting} />}
          {children}
        </div>
      </main>
    </motion.div>
  )
}

export { AuthLayout }
