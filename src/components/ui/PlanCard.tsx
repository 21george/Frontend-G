'use client'

import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { Dumbbell, Apple, Calendar } from 'lucide-react'
import type { WorkoutPlan, NutritionPlan } from '@/types'
import Link from 'next/link'

/* ── Workout Plan Card ─────────────────────────────────────────────────────── */
interface WorkoutPlanCardProps {
  plan: WorkoutPlan
  href?: string
}

export function WorkoutPlanCard({ plan, href }: WorkoutPlanCardProps) {
  const link = href ?? `/workout-plans/${plan.id}`
  const totalExercises = plan.days?.reduce((sum, d) => sum + (d.exercises?.length ?? 0), 0) ?? 0
  const statusColor = {
    active: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    completed: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    draft: 'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400',
    saved: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  }[plan.status] ?? 'bg-slate-100 text-slate-500'

  return (
    <Link href={link} className="bg-[var(--bg-card)] border border-[var(--border)] p-4 hover:border-slate-300 dark:hover:border-white/20 transition-colors block">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] ">{plan.title || 'Untitled Plan'}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 capitalize">{plan.plan_type}</p>
          </div>
        </div>
        <span className={cn('px-2 py-0.5 text-[10px] font-semibold capitalize', statusColor)}>
          {plan.status}
        </span>
      </div>

      <div className="flex items-center gap-4 text-[11px] text-[var(--text-tertiary)] ">
        <span>{plan.days?.length ?? 0} days</span>
        <span>{totalExercises} exercises</span>
        {plan.created_at && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(plan.created_at, 'MMM dd')}
          </span>
        )}
      </div>
    </Link>
  )
}

/* ── Nutrition Plan Card ───────────────────────────────────────────────────── */
interface NutritionPlanCardProps {
  plan: NutritionPlan
  href?: string
}

export function NutritionPlanCard({ plan, href }: NutritionPlanCardProps) {
  const link = href ?? `/nutrition-plans/${plan.id}`
  const statusMap: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    completed: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    draft: 'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400',
  }
  const statusColor = statusMap[plan.status] ?? 'bg-emerald-50 text-emerald-600'

  return (
    <Link href={link} className="bg-[var(--bg-card)] border border-[var(--border)] p-4 hover:border-slate-300 dark:hover:border-white/20 transition-colors block">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 flex items-center justify-center">
            <Apple className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] ">{plan.title || 'Nutrition Plan'}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">{plan.days?.length ?? 0} days</p>
          </div>
        </div>
        <span className={cn('px-2 py-0.5 text-[10px] font-semibold capitalize', statusColor)}>
          {plan.status}
        </span>
      </div>

      {plan.daily_totals && (
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-orange-500 font-medium">{plan.daily_totals.calories} kcal</span>
          <span className="text-blue-500">{plan.daily_totals.protein_g}g P</span>
          <span className="text-amber-500">{plan.daily_totals.carbs_g}g C</span>
          <span className="text-red-400">{plan.daily_totals.fat_g}g F</span>
        </div>
      )}
    </Link>
  )
}
