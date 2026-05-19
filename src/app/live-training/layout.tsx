'use client'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { usePathname } from 'next/navigation'

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // The [id] detail page is a full-screen video call UI with its own header — hide the dashboard header there
  const showHeader = pathname === '/live-training'
  return <AuthLayout showHeader={showHeader}>{children}</AuthLayout>
}
