'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, AlertCircle, Dumbbell, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface ClientProgressPlan {
  id: string
  title: string
  status: string
  total_days: number
  completed_days: number
  progress_pct: number
}

interface ClientProgressData {
  client_id: string
  client_name: string
  client_photo?: string | null
  has_active_plan: boolean
  current_plan?: ClientProgressPlan | null
  completed_plans?: ClientProgressPlan[]
  needs_new_plan: boolean
  last_workout_at?: string | null
}

interface ClientsProgressChartProps {
  clients: ClientProgressData[]
  isLoading?: boolean
}

export function ClientsProgressChart({ clients, isLoading }: ClientsProgressChartProps) {
  // Sort: needs new plan first, then by progress %
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => {
      if (a.needs_new_plan && !b.needs_new_plan) return -1
      if (!a.needs_new_plan && b.needs_new_plan) return 1
      return (b.current_plan?.progress_pct ?? 0) - (a.current_plan?.progress_pct ?? 0)
    })
  }, [clients])

  const getProgressColor = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-500'
    if (pct >= 50) return 'bg-blue-500'
    if (pct >= 25) return 'bg-amber-500'
    return 'bg-slate-400'
  }

  const getProgressTextColor = (pct: number) => {
    if (pct >= 80) return 'text-emerald-600 dark:text-emerald-400'
    if (pct >= 50) return 'text-blue-600 dark:text-blue-400'
    if (pct >= 25) return 'text-amber-600 dark:text-amber-400'
    return 'text-[var(--text-tertiary)] dark:text-slate-400'
  }

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-card)] border border-slate-200/80 dark:border-white/[0.08] rounded-xl overflow-hidden p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[var(--bg-subtle)] dark:bg-white/[0.06] rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--bg-subtle)] dark:bg-white/[0.06] rounded w-1/3" />
                <div className="h-3 bg-[var(--bg-subtle)] dark:bg-white/[0.06] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-card)] border border-slate-200/80 dark:border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
            Client Progress
          </h3>
          <p className="text-xs text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)] mt-0.5">
            {clients.filter(c => c.needs_new_plan).length} need new plan assignment
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            On Track
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            In Progress
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            Needs Plan
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
        {sortedClients.map((client, index) => {
          const plan = client.current_plan
          const pct = plan?.progress_pct ?? 0
          const isComplete = plan?.status === 'completed' || pct >= 100
          const needsPlan = client.needs_new_plan

          return (
            <motion.div
              key={client.client_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="px-6 py-4 hover:bg-[#13131314] dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                {client.client_photo ? (
                  <img
                    src={client.client_photo}
                    alt={client.client_name}
                    className="h-10 w-10 object-cover rounded-xl bg-[var(--bg-subtle)] dark:bg-slate-800 flex-shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gradient-to-br from-[#132e35] to-[#0b1e22] rounded-xl flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {client.client_name?.[0]?.toUpperCase() ?? 'C'}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)] truncate">
                      {client.client_name}
                    </span>
                    {needsPlan && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight bg-red-50 text-red-700 border border-red-200/60 rounded-lg dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
                        <AlertCircle className="w-3 h-3" />
                        Needs Plan
                      </span>
                    )}
                    {isComplete && !needsPlan && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-lg dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        Complete
                      </span>
                    )}
                  </div>

                  {/* Plan Title or Status */}
                  <div className="text-xs text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)] mb-2">
                    {plan ? (
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-3 h-3" />
                        {plan.title} · {plan.completed_days}/{plan.total_days} days
                      </span>
                    ) : needsPlan ? (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Clock className="w-3 h-3" />
                        No active workout plan assigned
                      </span>
                    ) : (
                      <span>No program data</span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {plan && (
                    <div className="relative">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-[var(--bg-subtle)] dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, pct)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              needsPlan ? 'bg-red-500' : getProgressColor(pct)
                            }`}
                          />
                        </div>
                        <span className={`text-xs font-semibold w-10 text-right ${getProgressTextColor(pct)}`}>
                          {Math.round(pct)}%
                        </span>
                      </div>

                      {/* Day markers */}
                      {plan.total_days > 0 && (
                        <div className="flex mt-1.5">
                          {Array.from({ length: Math.min(plan.total_days, 7) }).map((_, i) => {
                            const dayPct = ((i + 1) / plan.total_days) * 100
                            const isDone = pct >= dayPct
                            return (
                              <div key={i} className="flex-1 flex justify-center">
                                <div
                                  className={`w-1 h-1 rounded-full ${
                                    isDone
                                      ? needsPlan ? 'bg-red-400' : 'bg-emerald-400'
                                      : 'bg-[var(--bg-subtle)] dark:bg-slate-700'
                                  }`}
                                />
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action */}
                <Link
                  href={`/clients/${client.client_id}`}
                  className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-[var(--text-primary)] hover:bg-[#13131314] dark:hover:bg-white/[0.06] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )
        })}

        {sortedClients.length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)]">
            No client progress data available
          </div>
        )}
      </div>
    </div>
  )
}
