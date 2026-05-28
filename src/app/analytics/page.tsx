'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useCoachAnalytics } from '@/lib/hooks'
import { QueryWrapper } from '@/components/ui/QueryWrapper'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Users,
  Activity,
  TrendingUp,
  Dumbbell,
  BarChart3,
  UserCheck,
  Calendar,
  ArrowUpRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  sub?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-[var(--border)] p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      <p className="text-xs font-medium text-[var(--text-secondary)] mt-1">{label}</p>
      {sub && <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{sub}</p>}
    </motion.div>
  )
}

function AnalyticsSkeleton() {
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </DashboardLayout>
  )
}

export default function AnalyticsDashboardPage() {
  const { data, isLoading } = useCoachAnalytics()

  if (isLoading) return <AnalyticsSkeleton />

  const stats = [
    {
      label: 'Total Clients',
      value: data?.total_clients ?? 0,
      icon: Users,
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      sub: `${data?.new_clients_this_month ?? 0} new this month`,
    },
    {
      label: 'Active Clients',
      value: data?.active_clients ?? 0,
      icon: UserCheck,
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
      sub: 'Worked out in last 7 days',
    },
    {
      label: 'Total Workouts',
      value: data?.total_workouts ?? 0,
      icon: Dumbbell,
      color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',
      sub: 'All time completed',
    },
    {
      label: 'Completion Rate',
      value: `${data?.completion_rate ?? 0}%`,
      icon: BarChart3,
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
      sub: 'Plan days completed',
    },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Advanced Analytics
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Business insights across your entire coaching practice.
            </p>
          </div>
          <Link
            href="/clients"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            View Clients
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>

        {/* Top Clients */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--text-tertiary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Top Clients This Month
            </h3>
          </div>

          {data?.top_clients?.length > 0 ? (
            <div className="divide-y divide-[var(--border)]">
              {data.top_clients.map((client: any, i: number) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-[var(--bg-subtle)]/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[10px] font-bold text-[var(--text-secondary)]">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">{client.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {client.sessions} sessions
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="w-8 h-8 text-[var(--text-tertiary)]/30 mb-2" />
              <p className="text-sm text-[var(--text-secondary)]">No workout sessions in the last 30 days.</p>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
