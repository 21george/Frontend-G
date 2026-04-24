'use client'
// DashboardLayout is kept as a lightweight auth-guard wrapper.
// The sidebar is provided by route-level layout.tsx files (AuthLayout).
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { coach } = useAuthStore()
  const router    = useRouter()

  useEffect(() => {
    if (!coach) router.replace('/auth/login')
  }, [coach, router])

  if (!coach) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.15, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}
