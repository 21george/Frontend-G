'use client'

import { ChevronDown, Plus, ExternalLink, Salad } from 'lucide-react'
import Link from 'next/link'
import type { NutritionPlan, NutritionDay } from '@/types'
import { formatDate } from '@/lib/utils'

interface Props {
  plan: NutritionPlan
  expanded: boolean
  onToggle: () => void
}

function MacroBar({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div>
      <span className="text-[10px] text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)]">{label}</span>
      <p className="text-[13px] font-semibold" style={{ color }}>{value}<span className="text-[10px] font-normal text-[var(--text-tertiary)] ml-0.5">{unit}</span></p>
    </div>
  )
}

function DayRow({ day }: { day: NutritionDay }) {
  const totalCal = day.meals.reduce((sum, m) => sum + m.foods.reduce((s, f) => s + (f.calories ?? 0), 0), 0)
  const totalProt = day.meals.reduce((sum, m) => sum + m.foods.reduce((s, f) => s + (f.protein_g ?? 0), 0), 0)

  return (
    <div className="p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-[var(--text-primary)] dark:text-[var(--text-primary)] capitalize">{day.day}</p>
        <div className="flex items-center gap-4 text-[11px] text-[var(--text-tertiary)]">
          <span>{Math.round(totalCal)} kcal</span>
          <span>{Math.round(totalProt)}g protein</span>
        </div>
      </div>
      {day.meals.map((meal, mi) => (
        <div key={mi} className="ml-4 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] dark:text-slate-400">{meal.meal_name}</span>
            <span className="text-[10px] text-slate-400">{meal.time}</span>
          </div>
          {meal.foods.map((food, fi) => (
            <div key={fi} className="flex items-center justify-between gap-3 pl-3 text-[11px] text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)]">
              <span className="truncate flex-1">{food.name} <span className="text-slate-400">· {food.quantity}</span></span>
              <span className="flex-shrink-0">{food.calories} kcal</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function NutritionListCard({ plan, expanded, onToggle }: Props) {
  const statusColor = {
    active: 'bg-emerald-100 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400',
    completed: 'bg-blue-100 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400',
    draft: 'bg-[var(--bg-subtle)] dark:bg-white/[0.06] text-[var(--text-secondary)] dark:text-slate-400',
  }[plan.status] ?? 'bg-[var(--bg-subtle)] text-[var(--text-tertiary)]'

  return (
    <div className={`border overflow-hidden transition-all ${expanded ? 'border-emerald-300 dark:border-emerald-700/50' : 'border-[var(--border)] dark:border-white/[0.07]'} bg-[var(--bg-card)]`}>
      {/* Header */}
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
            <Salad size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[14px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">{plan.title}</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 ${statusColor}`}>{plan.status}</span>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)] mt-0.5">
              Week of {formatDate(plan.week_start, 'MMM d, yyyy')} · {plan.days?.length ?? 0} days
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <button onClick={onToggle} className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-s-xl border border-[var(--border)] dark:border-white/[0.08] bg-[var(--bg-card)] dark:bg-white/[0.03] text-[11px] font-semibold text-[var(--text-secondary)] dark:text-slate-300 hover:bg-[#13131314] dark:hover:bg-white/[0.06] transition-colors">
              View Details
              <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Macro summary */}
        <div className="grid grid-cols-4 gap-3 p-3 bg-[var(--bg-subtle)] dark:bg-white/[0.02] border border-[var(--border)] dark:border-white/[0.05]">
          <MacroBar label="Calories" value={plan.daily_totals?.calories ?? 0} unit="kcal" color="#f97316" />
          <MacroBar label="Protein"  value={plan.daily_totals?.protein_g ?? 0} unit="g" color="#3b82f6" />
          <MacroBar label="Carbs"    value={plan.daily_totals?.carbs_g ?? 0}   unit="g" color="#10b981" />
          <MacroBar label="Fat"      value={plan.daily_totals?.fat_g ?? 0}     unit="g" color="#f59e0b" />
        </div>

        {/* Mobile toggle */}
        <button onClick={onToggle} className="sm:hidden flex items-center justify-center gap-1 px-3 py-1.5 rounded-s-xl border border-[var(--border)] dark:border-white/[0.08] bg-[var(--bg-card)] dark:bg-white/[0.03] text-[11px] font-semibold text-[var(--text-secondary)] dark:text-slate-300">
          {expanded ? 'Hide Details' : 'View Details'}
          <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-white/[0.06]">
          {plan.notes && (
            <div className="mx-4 sm:mx-5 mt-4 p-3 bg-amber-50 dark:bg-amber-900/10">
              <p className="text-[12px] text-amber-800 dark:text-amber-200">{plan.notes}</p>
            </div>
          )}

          <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {plan.days?.map((day, idx) => <DayRow key={idx} day={day} />)}
          </div>

          <div className="border-t border-slate-100 dark:border-white/[0.06] p-4 sm:px-5 flex items-center justify-end gap-2 bg-[var(--bg-card)]">
            <Link href={`/nutrition-plans/${plan.id}`} className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] rounded-s-xl font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/15 hover:bg-emerald-100 dark:hover:bg-emerald-900/25 transition-colors">
              <ExternalLink size={12} /> Open Plan
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
