'use client'

import { useState, useMemo } from 'react'
import { Dumbbell, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { WorkoutPlan } from '@/types'

/* ── Professional Workout Details Table ──────────────────────────────────── */
export function WorkoutDetailsTable({ plans }: { plans: WorkoutPlan[] }) {
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)

  // Flatten all exercises from all plans
  const allExercises = useMemo(() => {
    const exercises: Array<{
      planId: string
      planTitle: string
      dayName: string
      exerciseName: string
      sets: number
      reps: string
      restSeconds: number
      notes?: string
      order: number
    }> = []

    plans.forEach(plan => {
      plan.days?.forEach((day) => {
        day.exercises?.forEach((ex, exIndex) => {
          exercises.push({
            planId: plan.id,
            planTitle: plan.title,
            dayName: day.day,
            exerciseName: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.rest_seconds,
            notes: ex.notes,
            order: exIndex,
          })
        })
      })
    })

    return exercises
  }, [plans])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white dark:bg-surface-card-dark border border-slate-200/80 dark:border-white/[0.08] overflow-hidden "
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center ">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)] ">
                Professional Fitness Details
              </h2>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                Comprehensive workout breakdown across all plans
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-white/[0.04] ">
              <Dumbbell size={12} className="text-slate-400" />
              <span className="font-semibold text-[var(--text-secondary)] ">{allExercises.length} Total Exercises</span>
            </div>
          </div>
        </div>
      </div>

      {/* Exercise Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-white/[0.04] border-b border-slate-200/80 dark:border-white/[0.08]">
              <th className="text-left text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider px-5 py-4">Exercise</th>
              <th className="text-left text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider px-5 py-4">Plan / Day</th>
              <th className="text-center text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider px-5 py-4">Sets</th>
              <th className="text-center text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider px-5 py-4">Reps</th>
              <th className="text-center text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider px-5 py-4">Rest</th>
              <th className="text-left text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider px-5 py-4">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {allExercises.slice(0, 20).map((ex, index) => (
              <motion.tr
                key={`${ex.planId}-${ex.dayName}-${ex.exerciseName}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {ex.order + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-primary)] ">{ex.exerciseName}</div>
                      <div className="text-xs text-[var(--text-tertiary)] ">{ex.planTitle}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="px-2.5 py-1 bg-slate-100 dark:bg-white/[0.04] ">
                      <span className="text-xs font-medium text-[var(--text-secondary)] capitalize">{ex.dayName}</span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-8 bg-slate-100 dark:bg-white/[0.04] ">
                      <span className="text-sm font-bold text-[var(--text-primary)] ">{ex.sets}</span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-8 bg-slate-100 dark:bg-white/[0.04] ">
                      <span className="text-sm font-bold text-[var(--text-primary)] ">{ex.reps}</span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-8 bg-slate-100 dark:bg-white/[0.04] ">
                      <span className="text-sm font-bold text-[var(--text-primary)] ">{ex.restSeconds}s</span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {ex.notes ? (
                    <div className="text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate" title={ex.notes}>
                      {ex.notes}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {allExercises.length === 0 && (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No exercises configured</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add exercises to your workout plans to see them here</p>
        </div>
      )}

      {allExercises.length > 20 && (
        <div className="px-6 py-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.06]">
          <p className="text-xs text-[var(--text-tertiary)] text-center">
            Showing 20 of {allExercises.length} exercises. View individual plans for complete details.
          </p>
        </div>
      )}
    </motion.div>
  )
}