'use client'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useWorkoutPlan, useClient } from '@/lib/hooks'
import Link from 'next/link'
import { ClientAvatar } from '@/components/ui/ClientAvatar'
import { useState } from 'react'
import { ChevronRight, Edit, Dumbbell, Clock, Calendar, ArrowLeft, ChevronDown } from 'lucide-react'
import { addDays, format, parseISO, startOfWeek } from 'date-fns'
import { motion } from 'framer-motion'
import type { Exercise } from '@/types'

const BOARD_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

const SESSION_STYLES = {
  easy: {
    label: 'Easy Run',
    border: 'border-t-brand-400',
    badge: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300',
  },
  interval: {
    label: 'Interval Run',
    border: 'border-t-violet-400',
    badge: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  },
  strength: {
    label: 'Strength',
    border: 'border-t-amber-400',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  },
  long: {
    label: 'Long Run',
    border: 'border-t-emerald-400',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  general: {
    label: 'Training',
    border: 'border-t-slate-300 dark:border-t-slate-600',
    badge: 'bg-slate-100 text-slate-700 dark:bg-white/[0.08] dark:text-slate-300',
  },
} as const

function normalizeDay(value: string) {
  return value.trim().toLowerCase()
}

function getSessionStyle(exercises: Exercise[]) {
  const searchText = exercises
    .map((exercise) => `${exercise.name} ${exercise.notes ?? ''}`.toLowerCase())
    .join(' ')

  if (searchText.includes('long')) return SESSION_STYLES.long
  if (searchText.includes('interval') || searchText.includes('tempo') || searchText.includes('sprint')) return SESSION_STYLES.interval
  if (searchText.includes('strength') || searchText.includes('squat') || searchText.includes('deadlift') || searchText.includes('press')) return SESSION_STYLES.strength
  if (searchText.includes('easy') || searchText.includes('recovery') || searchText.includes('jog')) return SESSION_STYLES.easy
  return SESSION_STYLES.general
}

function getWeekStartDate(value: string) {
  const parsed = parseISO(`${value}T00:00:00`)
  if (!Number.isNaN(parsed.getTime())) return startOfWeek(parsed, { weekStartsOn: 1 })

  const fallback = new Date(value)
  if (!Number.isNaN(fallback.getTime())) return startOfWeek(fallback, { weekStartsOn: 1 })

  return startOfWeek(new Date(), { weekStartsOn: 1 })
}

export default function WorkoutPlanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: plan, isLoading, error } = useWorkoutPlan(id)
  const { data: client } = useClient(plan?.client_id || '')
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  // Use assigned_client from API response if available, fallback to separate client fetch
  const assignedClient = plan?.assigned_client ?? (client ? { id: client.id, name: client.name, profile_photo_url: client.profile_photo_url ?? null } : null)

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl space-y-4">
          <div className="h-8 w-48 bg-slate-100 dark:bg-white/[0.04] animate-pulse" />
          <div className="bg-slate-50 dark:bg-white/[0.03] p-6 space-y-3 animate-pulse">
            <div className="h-6 w-64 bg-slate-200 dark:bg-white/[0.06]" />
            <div className="h-4 w-32 bg-slate-100 dark:bg-white/[0.04]" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !plan) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Workout plan not found</p>
          <Link href="/workout-plans" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Plans
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const weekStart = getWeekStartDate(plan.week_start)
  const dayLookup = new Map(plan.days.map((day) => [normalizeDay(day.day), day]))

  const boardDays = BOARD_DAYS.map((dayKey, index) => {
    const date = addDays(weekStart, index)
    const workoutDay = dayLookup.get(dayKey)
    const exercises = workoutDay?.exercises ?? []
    const sessionStyle = getSessionStyle(exercises)
    return {
      key: dayKey,
      shortLabel: format(date, 'EEE').toUpperCase(),
      dateLabel: format(date, 'dd MMM'),
      fullLabel: format(date, 'EEE, dd MMM'),
      workoutDay,
      exercises,
      sessionStyle,
    }
  })

  const defaultExpandedDay = boardDays.find((day) => day.exercises.length > 0)?.key ?? boardDays[0].key
  const activeDayKey = expandedDay ?? defaultExpandedDay
  const activeDay = boardDays.find((day) => day.key === activeDayKey) ?? boardDays[0]
  const totalExercises = plan.days.reduce((sum, day) => sum + day.exercises.length, 0)
  const activeDays = plan.days.filter((day) => day.exercises.length > 0).length
  const averageRest = totalExercises > 0
    ? Math.round(plan.days.flatMap((day) => day.exercises).reduce((sum, exercise) => sum + (exercise.rest_seconds ?? 0), 0) / totalExercises)
    : 0
  const clientInitials = assignedClient?.name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'WP'
  const rangeLabel = `${format(weekStart, 'EEE, dd MMM')} - ${format(addDays(weekStart, 6), 'EEE, dd MMM')}`

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <section className="border border-slate-200/80 dark:border-white/[0.08] bg-[var(--bg-card)] overflow-hidden">
          <div className="border-b border-slate-200 dark:border-white/[0.08] px-4 py-3 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <nav className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  <Link href="/workout-plans" className="transition-colors hover:text-brand-600 dark:hover:text-brand-300">
                    Dashboard
                  </Link>
                  <ChevronRight className="h-3 w-3" />
                  <Link href="/workout-plans" className="transition-colors hover:text-brand-600 dark:hover:text-brand-300">
                    Weekly Menu
                  </Link>
                  <ChevronRight className="h-3 w-3" />
                  <span className="truncate text-brand-600 dark:text-brand-300">{plan.title}</span>
                </nav>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                  Weekly Training Menu
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {plan.title}{assignedClient ? ` for ${assignedClient.name}` : ' — Not assigned to any client'}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center justify-center gap-3 border border-slate-200 bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-slate-700 dark:border-white/[0.08] dark:text-slate-300">
                  <span className="font-semibold">{rangeLabel}</span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => router.push('/workout-plans')}
                    className="inline-flex items-center gap-2 border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/[0.08] dark:text-slate-200 dark:hover:bg-white/[0.04]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <Link
                    href={`/workout-plans/${id}/edit`}
                    className="inline-flex items-center gap-2 bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Plan
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 px-4 py-5 dark:border-white/[0.08] lg:hidden">
            <div className="flex items-start gap-3">
              <ClientAvatar name={assignedClient?.name} profile_photo_url={assignedClient?.profile_photo_url} initials={clientInitials} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-slate-900 dark:text-white">
                  {assignedClient?.name ?? 'Not assigned'}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 font-semibold uppercase tracking-[0.14em] text-slate-700 dark:bg-white/[0.05] dark:text-slate-300">
                    <span className={`h-1.5 w-1.5 ${
                      plan.status === 'active'
                        ? 'bg-emerald-400'
                        : plan.status === 'completed'
                          ? 'bg-blue-400'
                          : 'bg-slate-400'
                    }`} />
                    {plan.status}
                  </span>
                  <span>{activeDays} active day{activeDays === 1 ? '' : 's'}</span>
                  <span>{totalExercises} exercise{totalExercises === 1 ? '' : 's'}</span>
                </div>
              </div>
            </div>

            {plan.notes && (
              <div className="mt-4 bg-slate-50 p-4 text-sm leading-relaxed text-slate-500 dark:bg-white/[0.03] dark:text-slate-400">
                {plan.notes}
              </div>
            )}
          </div>

          <div className="grid gap-3 p-4 sm:p-6 lg:hidden" role="radiogroup" aria-label="Select a day">
            {boardDays.map((day) => {
              const isActive = activeDayKey === day.key
              const isRestDay = day.exercises.length === 0

              return (
                <button
                  key={`mobile-${day.key}`}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setExpandedDay(day.key)}
                  className={`border p-4 text-left transition-colors ${
                    isActive
                      ? 'border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10'
                      : 'border-slate-200 bg-[var(--bg-subtle)] dark:border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                        {day.shortLabel}
                      </p>
                      <h3 className="mt-1 text-base font-semibold capitalize text-slate-900 dark:text-white">
                        {day.dateLabel}
                      </h3>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${day.sessionStyle.badge}`}>
                      {isRestDay ? 'Recovery' : day.sessionStyle.label}
                    </span>
                  </div>

                  {isRestDay ? (
                    <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">No workout assigned for this day.</p>
                  ) : (
                    <div className="mt-4 space-y-2.5">
                      {day.exercises.slice(0, 3).map((exercise, index) => (
                        <div key={`${day.key}-mobile-${exercise.name}-${index}`}>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{exercise.name}</p>
                          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                            {exercise.sets} sets • {exercise.reps} reps • {exercise.rest_seconds}s rest
                          </p>
                        </div>
                      ))}

                      {day.exercises.length > 3 && (
                        <p className="pt-1 text-xs font-medium text-brand-700 dark:text-brand-400">
                          See {day.exercises.length - 3} more
                        </p>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <div className="min-w-[1160px]">
              <div
                className="grid border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02]"
                style={{ gridTemplateColumns: '230px repeat(7, minmax(132px, 1fr))' }}
              >
                <div className="border-r border-slate-200 px-5 py-4 dark:border-white/[0.08]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Athlete</p>
                </div>
                {boardDays.map((day) => (
                  <div key={day.key} className="border-r border-slate-200 px-4 py-4 last:border-r-0 dark:border-white/[0.08]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{day.shortLabel}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{day.dateLabel}</p>
                  </div>
                ))}
              </div>

              <div
                className="grid"
                style={{ gridTemplateColumns: '230px repeat(7, minmax(132px, 1fr))' }}
              >
                <div className="border-r border-slate-200 bg-[var(--bg-card)] px-5 py-5 dark:border-white/[0.08] ">
                  <div className="flex items-start gap-3">
                    <ClientAvatar name={assignedClient?.name} profile_photo_url={assignedClient?.profile_photo_url} initials={clientInitials} />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-slate-900 dark:text-white">
                        {assignedClient?.name ?? 'Not assigned'}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.05]">
                        <span className={`h-1.5 w-1.5 ${
                          plan.status === 'active'
                            ? 'bg-emerald-400'
                            : plan.status === 'completed'
                              ? 'bg-blue-400'
                              : 'bg-slate-400'
                        }`} />
                        {plan.status}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-slate-500 dark:text-slate-400">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Week Summary</p>
                      <div className="mt-2 space-y-1.5">
                        <p>{activeDays} active day{activeDays === 1 ? '' : 's'}</p>
                        <p>{totalExercises} exercise{totalExercises === 1 ? '' : 's'}</p>
                        <p>{averageRest}s average rest</p>
                      </div>
                    </div>

                    {plan.notes && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Coach Note</p>
                        <p className="mt-2 line-clamp-4 leading-relaxed">{plan.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {boardDays.map((day) => {
                  const isActive = activeDayKey === day.key
                  const isRestDay = day.exercises.length === 0

                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => setExpandedDay(day.key)}
                      className={`min-h-[260px] border-r border-slate-200 p-3 text-left align-top transition-colors last:border-r-0 dark:border-white/[0.08] ${
                        isActive ? 'bg-slate-50 dark:bg-white/[0.03]' : 'bg-[var(--bg-card)] '
                      }`}
                    >
                      {isRestDay ? (
                        <div className="flex h-full min-h-[224px] flex-col justify-between border border-dashed border-slate-200 bg-slate-50/60 px-4 py-4 dark:border-white/[0.08] dark:bg-white/[0.02]">
                          <div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recovery</p>
                            <p className="mt-2 text-xs leading-5 text-slate-400 dark:text-slate-500">
                              No workout assigned for this day.
                            </p>
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-600">Rest day</span>
                        </div>
                      ) : (
                        <div className={`flex h-full min-h-[224px] flex-col border border-slate-200 bg-[var(--bg-subtle)] dark:border-white/[0.08] ${day.sessionStyle.border} border-t-2`}>
                          <div className="flex items-start justify-between gap-2 px-4 py-3">
                            <div>
                              <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${day.sessionStyle.badge}`}>
                                {day.sessionStyle.label}
                              </span>
                              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                {day.exercises.length} exercise{day.exercises.length === 1 ? '' : 's'}
                              </p>
                            </div>
                            <ChevronDown className={`mt-1 h-4 w-4 text-slate-400 transition-transform ${isActive ? 'rotate-180' : ''}`} />
                          </div>

                          <div className="flex-1 border-t border-slate-100 px-4 py-3 dark:border-white/[0.06]">
                            <div className="space-y-2.5">
                              {day.exercises.slice(0, 3).map((exercise, index) => (
                                <div key={`${day.key}-${exercise.name}-${index}`}>
                                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{exercise.name}</p>
                                  <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                                    {exercise.sets} sets • {exercise.reps} reps • {exercise.rest_seconds}s rest
                                  </p>
                                </div>
                              ))}
                            </div>

                            {day.exercises.length > 3 && (
                              <p className="mt-4 text-xs font-medium text-brand-700 dark:text-brand-400">
                                See {day.exercises.length - 3} more
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-slate-200/80 bg-[var(--bg-card)] p-6 dark:border-white/[0.08] "
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Selected Session
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                  {activeDay.fullLabel}
                </h2>
              </div>
              {!activeDay.exercises.length ? null : (
                <span className={`inline-flex items-center px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${activeDay.sessionStyle.badge}`}>
                  {activeDay.sessionStyle.label}
                </span>
              )}
            </div>

            <div className="mt-6 space-y-3">
              {activeDay.exercises.length > 0 ? activeDay.exercises.map((exercise, index) => (
                <div
                  key={`${activeDay.key}-${exercise.name}-${index}`}
                  className="border border-slate-200 bg-slate-50/70 p-4 dark:border-white/[0.08] dark:bg-white/[0.03]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center bg-brand-600 text-xs font-bold text-white dark:bg-brand-500">
                          {index + 1}
                        </div>
                        <p className="text-base font-semibold text-slate-900 dark:text-white">{exercise.name}</p>
                      </div>
                      {exercise.notes && (
                        <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:ml-10">{exercise.notes}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:min-w-[250px]">
                      <div className="bg-white px-3 py-2 text-center dark:bg-white/[0.04]">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Sets</p>
                        <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{exercise.sets}</p>
                      </div>
                      <div className="bg-white px-3 py-2 text-center dark:bg-white/[0.04]">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Reps</p>
                        <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{exercise.reps}</p>
                      </div>
                      <div className="bg-white px-3 py-2 text-center dark:bg-white/[0.04]">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Rest</p>
                        <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{exercise.rest_seconds}s</p>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center dark:border-white/[0.08] dark:bg-white/[0.02]">
                  <Dumbbell className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p className="mt-4 text-base font-semibold text-slate-700 dark:text-slate-200">Recovery day</p>
                  <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                    This day has no assigned exercises. Use it for mobility, recovery, or leave it open between heavier sessions.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="space-y-4"
          >
            <div className="border border-slate-200/80 bg-[var(--bg-card)] p-6 dark:border-white/[0.08] ">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Plan Snapshot</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-4 dark:bg-white/[0.03]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Week Of</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{format(weekStart, 'dd MMM yyyy')}</p>
                </div>
                <div className="bg-slate-50 p-4 dark:bg-white/[0.03]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Status</p>
                  <p className="mt-2 text-sm font-semibold capitalize text-slate-900 dark:text-white">{plan.status}</p>
                </div>
                <div className="bg-slate-50 p-4 dark:bg-white/[0.03]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Training Days</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{activeDays}/7</p>
                </div>
                <div className="bg-slate-50 p-4 dark:bg-white/[0.03]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Exercises</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{totalExercises}</p>
                </div>
              </div>
            </div>

            <div className="border border-slate-200/80 bg-[var(--bg-card)] p-6 dark:border-white/[0.08] ">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Daily Overview</p>
              <div className="mt-5 space-y-3">
                {boardDays.map((day) => (
                  <button
                    key={`overview-${day.key}`}
                    type="button"
                    onClick={() => setExpandedDay(day.key)}
                    className={`flex w-full items-center justify-between border px-4 py-3 text-left transition-colors ${
                      activeDayKey === day.key
                        ? 'border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold capitalize text-slate-900 dark:text-white">{day.key}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {day.exercises.length > 0 ? `${day.exercises.length} exercise${day.exercises.length === 1 ? '' : 's'}` : 'Rest day'}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${day.sessionStyle.badge}`}>
                      {day.exercises.length > 0 ? day.sessionStyle.label : 'Recovery'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </DashboardLayout>
  )
}
