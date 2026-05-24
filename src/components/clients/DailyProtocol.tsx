'use client'

import { CheckCircle2, Check } from 'lucide-react'
import { getWorkoutCategory, CATEGORY_CONFIG } from '@/lib/workoutCategories'
import type { PaginatedResponse, WorkoutPlan } from '@/types'

interface Props {
  plans: PaginatedResponse<WorkoutPlan> | undefined
  completedDaysMap: Record<string, boolean>
}

const ORDERED_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function DailyProtocol({ plans, completedDaysMap }: Props) {
  const activePlans = (plans?.data ?? []).filter(p => p.status === 'active')
  if (activePlans.length === 0) return null

  const today = new Date()
  const todayName = ORDERED_DAYS[today.getDay() === 0 ? 6 : today.getDay() - 1]

  return (
    <div className="dark:border-white/[0.07] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-brand-600" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">Today's Protocol</p>
        <span className="text-[10px] text-slate-400 dark:text-slate-600 ml-auto">{todayName}</span>
      </div>

      <div className="space-y-3">
        {activePlans.map(plan => {
          const todayDay = plan.days?.find(d => d.day.toLowerCase().startsWith(todayName.toLowerCase()))
          if (!todayDay) return null

          const key = `${plan.id}-${todayDay.day.toLowerCase()}`
          const done = completedDaysMap[key] ?? false
          const category = getWorkoutCategory(todayDay.exercises ?? [])
          const cfg = CATEGORY_CONFIG[category]

          return (
            <div key={plan.id} className={`flex items-center gap-3 p-3 border transition-all ${done ? 'border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-900/5' : 'border-[var(--border)] dark:border-white/[0.05] bg-[var(--bg-subtle)] dark:bg-white/[0.02]'}`}>
              <div className="w-8 h-8 flex items-center justify-center text-lg flex-shrink-0" style={{ background: cfg.bg }}>
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)] truncate">{plan.title}</p>
                <p className="text-[11px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                  {todayDay.exercises?.length ?? 0} exercises · <span style={{ color: cfg.color }}>{cfg.label}</span>
                </p>
              </div>
              <div className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 ${done ? 'border-emerald-400 bg-emerald-400/10' : 'border-slate-200 dark:border-white/10'}`}>
                {done && <Check size={10} className="text-emerald-400" />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
