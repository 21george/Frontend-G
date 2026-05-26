'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useWorkoutPlans, useClients } from '@/lib/hooks'
import { QueryWrapper } from '@/components/ui/QueryWrapper'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { WorkoutPlanType, WorkoutPlan } from '@/types'

// MUI Icons
import AddIcon from '@mui/icons-material/Add'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import GroupIcon from '@mui/icons-material/Group'
import SecurityIcon from '@mui/icons-material/Security'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import BarChartIcon from '@mui/icons-material/BarChart'
import TrackChangesIcon from '@mui/icons-material/TrackChanges'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'

const TYPE_CONFIG: Record<NonNullable<WorkoutPlanType>, { label: string; icon: any; color: string }> = {
  individual: { label: 'Individual', icon: FitnessCenterIcon, color: 'text-blue-600 dark:text-blue-400' },
  group:      { label: 'Group',      icon: GroupIcon,    color: 'text-amber-600 dark:text-amber-400' },
  team:       { label: 'Team',       icon: SecurityIcon,   color: 'text-emerald-600 dark:text-emerald-400' },
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  active:     { label: 'Active',     dot: 'bg-emerald-400', badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' },
  draft:      { label: 'Draft',      dot: 'bg-slate-400', badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20' },
  completed:  { label: 'Completed',  dot: 'bg-blue-400', badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20' },
  archived:   { label: 'Archived',   dot: 'bg-slate-400', badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20' },
}

/* ── Unassigned Plans Card ────────────────────────────────────────────────── */
function UnassignedPlansCard({ plans }: { plans: WorkoutPlan[]; clients: any[] }) {
  const unassignedPlans = useMemo(() => {
    return plans.filter(plan => !plan.client_ids || plan.client_ids.length === 0)
  }, [plans])

  const workoutStats = useMemo(() => {
    let totalExercises = 0
    let totalDays = 0
    unassignedPlans.forEach(plan => {
      plan.days?.forEach(day => {
        totalDays++
        day.exercises?.forEach(() => { totalExercises++ })
      })
    })
    return { totalExercises, totalDays }
  }, [unassignedPlans])

  const getPlanMeta = (type: WorkoutPlanType | null | undefined) => {
    return {
      label: type === 'team' ? 'Team' : type === 'group' ? 'Group' : 'Individual',
      Icon: type === 'team' ? SecurityIcon : type === 'group' ? GroupIcon : FitnessCenterIcon,
      color: type === 'team' ? 'text-emerald-600 dark:text-emerald-400' :
             type === 'group' ? 'text-amber-600 dark:text-amber-400' :
             'text-blue-600 dark:text-blue-400',
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="px-6 py-5  border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WarningAmberIcon className="w-8 h-8 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Workout Plans Not Assigned
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {unassignedPlans.length} plans waiting to be assigned
              </p>
            </div>
          </div>
          
        </div>
      </div>

      {unassignedPlans.length === 0 ? (
        <div className="p-8 text-center">
          <CheckCircleIcon className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-[var(--text-primary)]">All plans are assigned!</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No unassigned workout plans</p>
        </div>
      ) : (
        <>
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {unassignedPlans.slice(0, 6).map((plan, index) => {
              const meta = getPlanMeta(plan.plan_type)
              const MetaIcon = meta.Icon
              const totalExercises = plan.days?.reduce((sum, day) => sum + (day.exercises?.length || 0), 0) || 0

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-white dark:bg-[#171717] hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-tight ${meta.color}`}>
                      <MetaIcon className="w-3 h-3" />
                      {meta.label}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3 pr-20">
                      <InsertDriveFileIcon className={`w-5 h-5 ${meta.color} mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate leading-tight">
                          {plan.title}
                        </h3>
                        {plan.group_name && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {plan.group_name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
                      <span className="flex items-center gap-1">
                        <CalendarMonthIcon className="w-3 h-3" />
                        {plan.week_start}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUpIcon className="w-3 h-3" />
                        {plan.days?.length || 0} days
                      </span>
                      <span className="flex items-center gap-1">
                        <TrackChangesIcon className="w-3 h-3" />
                        {totalExercises} exercises
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight ${
                        plan.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : plan.status === 'draft'
                          ? 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                          : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          plan.status === 'active' ? 'bg-emerald-400' :
                          plan.status === 'draft' ? 'bg-slate-400' : 'bg-blue-400'
                        }`} />
                        {plan.status}
                      </span>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/workout-plans/${plan.id}/assign`}
                          className="inline-flex items-center gap-1.5  rounded-s-xl px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-white text-xs font-medium transition-colors"
                        >
                          <GroupIcon className="w-3 h-3" />
                          Assign
                        </Link>
                        <Link
                          href={`/workout-plans/${plan.id}`}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                        >
                          <NavigateNextIcon className="w-4 h-4 text-slate-400" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {unassignedPlans.length > 6 && (
            <div className="px-6 py-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.06]">
              <Link
                href="/workout-plans?filter=unassigned"
                className="text-sm font-medium text-cyan-950 dark:text-[#b3d2ef] hover:underline flex items-center gap-1"
              >
                View all {unassignedPlans.length} unassigned plans
                <ChevronRightIcon className="w-3.5 h-3.5" />
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
      className="bg-white dark:bg-[#171717] overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChartIcon className="w-6 h-6 text-purple-500" />
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Professional Fitness Details
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Comprehensive workout breakdown across all plans
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5">
              <FitnessCenterIcon className="w-3 h-3 text-slate-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">{allExercises.length} Total Exercises</span>
            </div>
          </div>
        </div>
      </div>

      {/* Exercise Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#13131314] dark:bg-white/[0.04] border-b border-slate-200/80 dark:border-white/[0.08]">
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
                className="hover:bg-[#13131314] dark:hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-5">{ex.order + 1}</span>
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-primary)]">{ex.exerciseName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{ex.planTitle}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">{ex.dayName}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-bold text-[var(--text-primary)]">{ex.sets}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-bold text-[var(--text-primary)]">{ex.reps}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-bold text-[var(--text-primary)]">{ex.restSeconds}s</span>
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
          <FitnessCenterIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
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
            <FilterListIcon className="w-3.5 h-3.5 text-slate-400" />
            {(['all', 'active', 'draft', 'completed', 'archived'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 border text-[12px] font-medium transition-colors ${ filter === s
                    ? 'bg-cyan-950 text-white border-cyan-950'
                    : 'border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.08]'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search plans..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-3 py-1.5 border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-[12px] font-medium text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20"
            />
          </div>
        </div>

        {/* ── PLANS LIST ── */}
        <QueryWrapper
          query={query}
          skeleton={
            <div className="bg-white dark:bg-[#171717] overflow-hidden divide-y divide-slate-100 dark:divide-white/[0.05]">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 lg:px-6 py-4">
                  <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full hidden sm:block" />
                  <Skeleton className="h-5 w-12 rounded-full hidden md:block" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          }
          emptyIcon={FitnessCenterIcon}
          emptyTitle="You haven't created any plans yet."
          emptyDescription="Create your first workout plan to get started."
          emptyAction={
            <div className="flex gap-2 justify-center mt-4 flex-wrap">
              <Link href="/workout-plans/new" className="px-4 py-2 bg-cyan-950 text-white text-sm font-medium hover:bg-cyan-900 transition-colors">
                New Plan
              </Link>
              <Link href="/workout-plans/import" className="px-4 py-2 bg-white dark:bg-[#05254e] text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-[#0a2b57] transition-colors">
                Import Excel
              </Link>
            </div>
          }
          isEmpty={(data) => (data?.data ?? []).length === 0}
        >
          {() => (
            <div className="bg-white dark:bg-[#171717] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#13131314] dark:bg-white/[0.04] border-b border-slate-200/80 dark:border-white/[0.08]">
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
                          className="hover:bg-[#13131314] dark:hover:bg-white/[0.03] transition-colors group"
                        >
                          <td className="px-4 lg:px-6 py-4">
                            <div className="flex items-center gap-3">
                              <TypeIcon className={`w-5 h-5 `} />
                              <div>
                                <div className="text-sm font-semibold text-[var(--text-primary)]">
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
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight ${ plan.plan_type === 'team' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                              plan.plan_type === 'group' ? '' :
                                                           ''
                            }`}>
                              <TypeIcon className="w-3 h-3" />
                              {typeConf.label}
                            </span>
                          </td>

                          <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <CalendarMonthIcon className="w-3.5 h-3.5 text-slate-400" />
                              <span>{plan.week_start}</span>
                            </div>
                          </td>

                          <td className="px-4 lg:px-6 py-4">
                            <span className={`inline-flex items-center rounded-4 gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight border ${statusConf.badge}`}>
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
                              <ChevronRightIcon className="w-3.5 h-3.5" />
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
