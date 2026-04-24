'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useWorkoutPlans, useClients } from '@/lib/hooks'
import { QueryWrapper } from '@/components/ui/QueryWrapper'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import {
  Plus, Upload, Dumbbell, Users, Shield, Search, Filter,
  ChevronRight, Activity, Calendar, AlertCircle, BarChart3,
  Target, Zap, TrendingUp, Award, CheckCircle2
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { WorkoutPlanType, WorkoutPlan } from '@/types'

const TYPE_CONFIG: Record<NonNullable<WorkoutPlanType>, { label: string; icon: typeof Dumbbell; gradient: string; glow: string }> = {
  individual: { label: 'Individual', icon: Dumbbell, gradient: 'from-blue-500 to-blue-600', glow: 'shadow-blue-500/20' },
  group:      { label: 'Group',      icon: Users,    gradient: 'from-amber-500 to-amber-600', glow: 'shadow-amber-500/20' },
  team:       { label: 'Team',       icon: Shield,   gradient: 'from-emerald-500 to-emerald-600', glow: 'shadow-emerald-500/20' },
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  active:     { label: 'Active',     dot: 'bg-emerald-400', badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  draft:      { label: 'Draft',      dot: 'bg-slate-400', badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20' },
  completed:  { label: 'Completed',  dot: 'bg-blue-400', badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  archived:   { label: 'Archived',   dot: 'bg-slate-400', badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20' },
}

/* ── Unassigned Plans Card ────────────────────────────────────────────────── */
function UnassignedPlansCard({ plans, clients }: { plans: WorkoutPlan[]; clients: any[] }) {
  const unassignedPlans = useMemo(() => {
    return plans.filter(plan => !plan.client_ids || plan.client_ids.length === 0)
  }, [plans])

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients])

  // Calculate workout stats from unassigned plans
  const workoutStats = useMemo(() => {
    let totalExercises = 0
    let totalSets = 0
    let totalDays = 0
    const muscleGroups = new Set<string>()

    unassignedPlans.forEach(plan => {
      plan.days?.forEach(day => {
        totalDays++
        day.exercises?.forEach(ex => {
          totalExercises++
          totalSets += ex.sets || 0
          // Extract muscle group from exercise name or notes
          if (ex.name) {
            const muscles = ['Chest', 'Back', 'Leg', 'Shoulder', 'Arm', 'Core', 'Glute', 'Hamstring', 'Quad', 'Bicep', 'Tricep']
            muscles.forEach(m => {
              if (ex.name.toLowerCase().includes(m.toLowerCase())) {
                muscleGroups.add(m)
              }
            })
          }
        })
      })
    })

    return { totalExercises, totalSets, totalDays, muscleGroups: muscleGroups.size }
  }, [unassignedPlans])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-white/[0.06] bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/10 dark:to-orange-950/10">
        <div className="flex items-center gap-3">
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Workout Plans Not Assigned to Clients
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {unassignedPlans.length} plans ready for assignment
            </p>
          </div>
        </div>

      {unassignedPlans.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">All plans are assigned!</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No unassigned workout plans</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-5 border-b border-slate-100 dark:border-white/[0.06]">
            <div className="text-center p-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{unassignedPlans.length}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">Plans</div>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{workoutStats.totalDays}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">Workout Days</div>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{workoutStats.totalExercises}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">Exercises</div>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{workoutStats.muscleGroups}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">Muscle Groups</div>
            </div>
          </div>

          {/* Plans List */}
          <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {unassignedPlans.slice(0, 5).map((plan, index) => {
              const typeConf = TYPE_CONFIG[plan.plan_type ?? 'individual']
              const TypeIcon = typeConf.icon
              const totalExercises = plan.days?.reduce((sum, day) => sum + (day.exercises?.length || 0), 0) || 0

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeConf.gradient} flex items-center justify-center shadow-lg ${typeConf.glow} flex-shrink-0`}>
                        <TypeIcon size={18} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{plan.title}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight border ${
                            plan.status === 'active' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                            plan.status === 'draft' ? 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20' :
                            'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20'
                          }`}>
                            {plan.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {plan.week_start}
                          </span>
                          <span className="flex items-center gap-1">
                            <Dumbbell size={12} />
                            {plan.days?.length || 0} days
                          </span>
                          <span className="flex items-center gap-1">
                            <Target size={12} />
                            {totalExercises} exercises
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/workout-plans/${plan.id}/assign`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <Users size={12} />
                        Assign
                      </Link>
                      <Link
                        href={`/workout-plans/${plan.id}`}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
                      >
                        <ChevronRight size={16} className="text-slate-400" />
                      </Link>
                    </div>
                  </div>

                  {/* Exercise Preview */}
                  {plan.days && plan.days.length > 0 && (
                    <div className="mt-3 ml-13 pl-3 border-l-2 border-slate-200 dark:border-white/[0.08]">
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Workout Breakdown</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {plan.days.slice(0, 3).map((day, di) => (
                          <div key={di} className="bg-slate-50 dark:bg-white/[0.04] rounded-lg p-2">
                            <div className="text-xs font-semibold text-slate-900 dark:text-white capitalize mb-1">{day.day}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {day.exercises?.length || 0} exercises
                            </div>
                            {day.exercises?.slice(0, 2).map((ex, ei) => (
                              <div key={ei} className="text-[10px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                                • {ex.name}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {unassignedPlans.length > 5 && (
            <div className="px-6 py-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.06]">
              <Link href="/workout-plans?filter=unassigned" className="text-sm font-medium text-cyan-950 dark:text-[#b3d2ef] hover:underline flex items-center gap-1">
                View all {unassignedPlans.length} unassigned plans
                <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

/* ── Professional Workout Details Table ──────────────────────────────────── */
function WorkoutDetailsTable({ plans }: { plans: WorkoutPlan[] }) {
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
      plan.days?.forEach((day, dayIndex) => {
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
      className="bg-white dark:bg-[#171717] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Professional Fitness Details
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Comprehensive workout breakdown across all plans
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-white/[0.04] rounded-lg">
              <Dumbbell size={12} className="text-slate-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">{allExercises.length} Total Exercises</span>
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
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {ex.order + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{ex.exerciseName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{ex.planTitle}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="px-2.5 py-1 bg-slate-100 dark:bg-white/[0.04] rounded-md">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">{ex.dayName}</span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-8 bg-slate-100 dark:bg-white/[0.04] rounded-lg">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{ex.sets}</span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-8 bg-slate-100 dark:bg-white/[0.04] rounded-lg">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{ex.reps}</span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-8 bg-slate-100 dark:bg-white/[0.04] rounded-lg">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{ex.restSeconds}s</span>
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
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No exercises configured</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add exercises to your workout plans to see them here</p>
        </div>
      )}

      {allExercises.length > 20 && (
        <div className="px-6 py-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.06]">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Showing 20 of {allExercises.length} exercises. View individual plans for complete details.
          </p>
        </div>
      )}
    </motion.div>
  )
}

export default function WorkoutPlansPage() {
  const query = useWorkoutPlans()
  const { data: clientsData } = useClients()
  const plans = query.data?.data ?? []
  const clients = clientsData?.data ?? []
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'completed' | 'archived'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'individual' | 'group' | 'team'>('all')

  // Filter plans
  const filtered = useMemo(() => {
    let list = plans
    if (filter !== 'all') list = list.filter(p => p.status === filter)
    if (typeFilter !== 'all') list = list.filter(p => p.plan_type === typeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.group_name?.toLowerCase().includes(q)
      )
    }
    return list
  }, [plans, filter, typeFilter, search])

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── UNASSIGNED PLANS CARD ── */}
        <UnassignedPlansCard plans={plans} clients={clients} />

        {/* ── FILTERS ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-slate-400" />
            {(['all', 'active', 'draft', 'completed', 'archived'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors ${
                  filter === s
                    ? 'bg-cyan-950 text-white border-cyan-950'
                    : 'border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.08]'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search plans..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-[12px] font-medium text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20"
            />
          </div>
        </div>

        {/* ── PLANS LIST ── */}
        <QueryWrapper
          query={query}
          emptyIcon={Dumbbell}
          emptyTitle="No workout plans yet"
          emptyDescription="Create your first workout plan to get started"
          emptyAction={
            <div className="flex gap-2 justify-center mt-4 flex-wrap">
              <Link href="/workout-plans/new" className="px-4 py-2 bg-cyan-950 text-white rounded-lg text-sm font-medium hover:bg-cyan-900 transition-colors">
                New Plan
              </Link>
              <Link href="/workout-plans/import" className="px-4 py-2 bg-white dark:bg-[#05254e] text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-[#0a2b57] transition-colors">
                Import Excel
              </Link>
            </div>
          }
          isEmpty={(data) => (data?.data ?? []).length === 0}
        >
          {() => (
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-white/[0.04] border-b border-slate-200/80 dark:border-white/[0.08]">
                      <th className="px-4 lg:px-6 py-4 text-[10px] lg:text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Plan</th>
                      <th className="px-4 lg:px-6 py-4 text-[10px] lg:text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider hidden sm:table-cell">Type</th>
                      <th className="px-4 lg:px-6 py-4 text-[10px] lg:text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider hidden md:table-cell">Duration</th>
                      <th className="px-4 lg:px-6 py-4 text-[10px] lg:text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 lg:px-6 py-4 text-[10px] lg:text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                    {filtered.map((plan, index) => {
                      const typeConf = TYPE_CONFIG[plan.plan_type ?? 'individual']
                      const statusConf = STATUS_CONFIG[plan.status ?? 'draft']
                      const TypeIcon = typeConf.icon

                      return (
                        <motion.tr
                          key={plan.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="hover:bg-slate-50/50 dark:hover:bg-white/[0.03] transition-colors group"
                        >
                          <td className="px-4 lg:px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeConf.gradient} flex items-center justify-center shadow-lg ${typeConf.glow} flex-shrink-0`}>
                                <TypeIcon size={18} className="text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                  {plan.group_name ? `${plan.group_name} — ` : ''}{plan.title}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                                  Week of {plan.week_start} · {plan.days?.length ?? 0} days
                                  {(plan.client_ids?.length ?? 0) > 0 && ` · ${(plan.client_ids?.length ?? 0)} clients`}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 lg:px-6 py-4 hidden sm:table-cell">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight border ${
                              plan.plan_type === 'team' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                              plan.plan_type === 'group' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                                                           'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20'
                            }`}>
                              <TypeIcon size={12} />
                              {typeConf.label}
                            </span>
                          </td>

                          <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Calendar size={14} className="text-slate-400" />
                              <span>{plan.week_start}</span>
                            </div>
                          </td>

                          <td className="px-4 lg:px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight border ${statusConf.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                              {statusConf.label}
                            </span>
                          </td>

                          <td className="px-4 lg:px-6 py-4 text-right">
                            <Link
                              href={`/workout-plans/${plan.id}`}
                              className="inline-flex items-center gap-1 text-xs font-medium text-cyan-950 dark:text-[#b3d2ef] hover:underline"
                            >
                              View Details
                              <ChevronRight size={14} />
                            </Link>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </QueryWrapper>

        {/* ── PROFESSIONAL FITNESS DETAILS ── */}
        <WorkoutDetailsTable plans={plans} />
      </div>
    </DashboardLayout>
  )
}
