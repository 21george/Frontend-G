'use client'
// DashboardLayout is kept as a lightweight auth-guard wrapper.
// The sidebar is provided by route-level layout.tsx files (AuthLayout).
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { coach } = useAuthStore()
  const router    = useRouter()

  useEffect(() => {
    if (!coach) router.replace('/auth/login')
  }, [coach, router])

  if (!coach) return null

  return <>{children}</>
}
