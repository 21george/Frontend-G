'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import Sidebar from '@/components/layout/Sidebar'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { motion } from 'framer-motion'

function AuthLayout({
  children,
  showHeader = true,
  showGreeting = false
}: {
  children: React.ReactNode
  showHeader?: boolean
  showGreeting?: boolean
}) {
  const { isAuthenticated, accessToken, refreshAccessToken, clearAuth } = useAuthStore()
  const router = useRouter()
  const refreshInProgressRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login')
      return
    }
    // Silently obtain a new access token on app load when the in-memory
    // token is absent (e.g. after a page refresh rehydrated coach/isAuthenticated
    // from localStorage but accessToken was not persisted).
    if (!accessToken && !refreshInProgressRef.current) {
      refreshInProgressRef.current = true
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
        })
    }
  }, [isAuthenticated, accessToken, refreshAccessToken, clearAuth, router])

  if (!isAuthenticated) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="min-h-screen flex bg-slate-100 dark:bg-surface-page-dark"
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
