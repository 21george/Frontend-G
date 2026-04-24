'use client'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useWorkoutPlan, useClient } from '@/lib/hooks'
import Link from 'next/link'
import { ChevronRight, Edit, Dumbbell, Clock, Calendar, ArrowLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { motion } from 'framer-motion'

export default function WorkoutPlanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: plan, isLoading, error } = useWorkoutPlan(id)
  const { data: client } = useClient(plan?.client_id ?? '')

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl space-y-4">
          <div className="h-8 w-48 rounded-xl bg-slate-100 dark:bg-white/[0.04] animate-pulse" />
          <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-6 space-y-3 animate-pulse">
            <div className="h-6 w-64 rounded bg-slate-200 dark:bg-white/[0.06]" />
            <div className="h-4 w-32 rounded bg-slate-100 dark:bg-white/[0.04]" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !plan) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Workout plan not found</p>
          <Link href="/workout-plans" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-cyan-950 hover:bg-cyan-900 text-white text-sm font-medium rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Plans
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400 mb-3 uppercase tracking-tighter">
              <Link href="/workout-plans" className="hover:text-cyan-950 dark:hover:text-[#b3d2ef] transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/workout-plans" className="hover:text-cyan-950 dark:hover:text-[#b3d2ef] transition-colors">
                Workout Plans
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-cyan-950 dark:text-[#b3d2ef] truncate max-w-[200px]">{plan.title}</span>
            </nav>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              {plan.title}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-neutral-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Week of {plan.week_start}</span>
              </div>
              {client && (
                <div className="flex items-center gap-1">
                  <Dumbbell className="w-4 h-4" />
                  <span>{client.name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight border ${
              plan.status === 'active' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
              plan.status === 'completed' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20' :
              'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                plan.status === 'active' ? 'bg-emerald-400' :
                plan.status === 'completed' ? 'bg-blue-400' :
                'bg-slate-400'
              }`} />
              {plan.status}
            </span>
            <Link href={`/workout-plans/${id}/edit`} className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#05254e] text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#0a2b57] transition-colors text-sm font-medium rounded-lg">
              <Edit className="w-4 h-4" />
              Edit Plan
            </Link>
          </div>
        </div>

        {/* ── NOTES CARD ── */}
        {plan.notes && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-5 border border-amber-200/60 dark:border-amber-800/30"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-1">Plan Notes</h3>
                <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">{plan.notes}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── WORKOUT DAYS ── */}
        {plan.days && plan.days.length > 0 ? (
          <div className="space-y-4">
            {plan.days.map((day, di) => (
              <motion.div
                key={di}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: di * 0.05 }}
                className="bg-white dark:bg-[#171717] rounded-xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden shadow-sm"
              >
                <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-white/[0.03] dark:to-white/[0.02] border-b border-slate-100 dark:border-white/[0.06]">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    {day.day}
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                  {day.exercises && day.exercises.length > 0 ? (
                    day.exercises.map((ex, ei) => (
                      <motion.div
                        key={ei}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: di * 0.05 + ei * 0.03 }}
                        className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-md bg-cyan-950 dark:bg-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {ei + 1}
                            </div>
                            <p className="font-semibold text-slate-900 dark:text-white">{ex.name}</p>
                          </div>
                          {ex.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 ml-9">{ex.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center px-3 py-1.5 bg-slate-100 dark:bg-white/[0.04] rounded-lg">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Sets</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{ex.sets}</p>
                          </div>
                          <div className="text-center px-3 py-1.5 bg-slate-100 dark:bg-white/[0.04] rounded-lg">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Reps</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{ex.reps}</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{ex.rest_seconds}s rest</span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="px-5 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                      <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      No exercises for this day
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#171717] rounded-xl border border-slate-200/80 dark:border-white/[0.08]">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center mb-4">
              <Dumbbell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No workout days configured</p>
            <Link href={`/workout-plans/${id}/edit`} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-cyan-950 hover:bg-cyan-900 text-white text-sm font-medium rounded-lg transition-colors">
              <Edit className="w-4 h-4" />
              Add Exercises
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
