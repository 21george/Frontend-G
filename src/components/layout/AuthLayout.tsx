'use client'

import { useEffect } from 'react'
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
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) router.replace('/auth/login')
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="min-h-screen flex bg-slate-100 dark:bg-[#141414]"
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
