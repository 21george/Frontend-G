'use client'
import { AuthLayout } from '@/components/layout/AuthLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthLayout showHeader={true}>{children}</AuthLayout>
}
