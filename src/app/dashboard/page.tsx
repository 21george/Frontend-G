'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useClients, useCheckins, useWorkoutPlans } from '@/lib/hooks'
import { useState, useMemo } from 'react'
import {
  X, Video, Phone, MessageCircle, Users, Calendar,CalendarDays,
  TrendingUp, ChevronRight, MoreHorizontal, Briefcase, AlertCircle,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { parseDateValue } from '@/lib/utils'
import type { Client, CheckinMeeting, WorkoutPlan, PaginatedResponse } from '@/types'
import {
  isToday, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isAfter,
} from 'date-fns'
import { humanDate } from '@/lib/formatDate'
import { motion, AnimatePresence } from 'framer-motion'
import { ClientAvatar } from '@/components/ui/ClientAvatar'

// ── Design tokens ─────────────────────────────────────────────────────────────

const BRAND   = '#132E35'
const BRAND_H = '#1C4A54'

// ── Heatmap intensity classes (0 = empty … 4 = max) ──────────────────────────

const HEATMAP_CLS = [
  'bg-[#F4F4F4] dark:bg-[#242424]',
  'bg-[#C8E6E0] dark:bg-[#1C4A54]',
  'bg-[#8BCDBF] dark:bg-[#1F5F6E]',
  'bg-[#4CA896] dark:bg-[#227A8A]',
  'bg-[#132E35] dark:bg-[#2A96AD]',
] as const

// ── Shared helpers ────────────────────────────────────────────────────────────

function idHash(s: string): number {
  return s.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
}

function intensityIndex(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0 || max === 0) return 0
  const r = count / max
  if (r < 0.25) return 1
  if (r < 0.5)  return 2
  if (r < 0.75) return 3
  return 4
}

function fmtHour(h: number): string {
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

const TYPE_ICON: Record<string, LucideIcon> = { video: Video, call: Phone, chat: MessageCircle }

const HOURS      = [9, 10, 11, 12, 13, 14, 15, 16, 17]
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ── AISuggestionBanner ────────────────────────────────────────────────────────

interface SuggestionCard {
  id:          string
  label:       string
  description: string
  cta:         string
  href:        string
}

interface AISuggestionBannerProps {
  inactiveCount: number
  todayCount:    number
}

function AISuggestionBanner({ inactiveCount, todayCount }: AISuggestionBannerProps) {
  const allCards = useMemo<SuggestionCard[]>(() => [
    {
      id:          'reengage',
      label:       'Re-engage Clients',
      description: `${inactiveCount} client${inactiveCount !== 1 ? 's' : ''} are inactive. Reach out to reignite their training journey.`,
      cta:         'View Clients',
      href:        '/clients',
    },
    {
      id:          'schedule-gap',
      label:       'Schedule Gap',
      description: 'Friday afternoon is consistently underbooked. Consider opening additional coaching slots.',
      cta:         'Book Session',
      href:        '/checkins/new',
    },
    {
      id:          'plan-renewals',
      label:       'Plan Renewals',
      description: 'Several workout plans are nearing their end date. Review and renew to maintain client momentum.',
      cta:         'View Plans',
      href:        '/workout-plans',
    },
    {
      id:          'log-progress',
      label:       'Log Progress',
      description: `You have ${todayCount} session${todayCount !== 1 ? 's' : ''} today. Log notes right after each for best outcomes.`,
      cta:         "Today's Sessions",
      href:        '/checkins',
    },
  ], [inactiveCount, todayCount])

  const [dismissed, setDismissed] = useState<string[]>([])

  const visible = useMemo(
    () => allCards.filter(c => !dismissed.includes(c.id)),
    [allCards, dismissed],
  )

  function dismiss(id: string): void {
    setDismissed(prev => [...prev, id])
  }

  function dismissAll(): void {
    setDismissed(allCards.map(c => c.id))
  }

  if (visible.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0 }}
      className="mb-6 bg-[#EAF4F1] dark:bg-[#132E35]/30 border border-[#132E35]/20 dark:border-[#132E35]/60"
    >
      {/* Header strip */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#132E35]/20 dark:border-[#132E35]/60">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#132E35] dark:text-[#2A96AD]">
            Insights
          </span>
          <span className="text-[10px] font-semibold text-[#132E35]/60 dark:text-[#2A96AD]/60">
            {visible.length}
          </span>
        </div>
        <button
          onClick={dismissAll}
          className="text-[11px] font-medium text-[#132E35]/70 dark:text-[#2A96AD]/70 hover:text-[#132E35] dark:hover:text-[#2A96AD] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#132E35]"
        >
          Dismiss all
        </button>
      </div>

      {/* Scrollable suggestion cards */}
      <div className="flex gap-4 overflow-x-auto px-5 py-4 scrollbar-none">
        <AnimatePresence initial={false}>
          {visible.map(card => (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 w-64 bg-white dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-white/[0.07] p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-[#171717] dark:text-[#FAFAFA]">{card.label}</p>
                <button
                  onClick={() => dismiss(card.id)}
                  aria-label={`Dismiss ${card.label}`}
                  className="flex-shrink-0 text-[#888780] dark:text-[#FAFAFA]/40 hover:text-[#171717] dark:hover:text-[#FAFAFA] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#132E35]"
                >
                  <X size={13} />
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-[#444441] dark:text-[#FAFAFA]/60">
                {card.description}
              </p>
              <Link
                href={card.href}
                style={{ backgroundColor: BRAND }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = BRAND_H }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = BRAND }}
                className="inline-flex items-center gap-1 self-start px-3 py-1.5 text-[11px] font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#132E35]"
              >
                {card.cta} <ChevronRight size={11} />
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ── SessionVolumeHeatmap ──────────────────────────────────────────────────────

interface SessionVolumeHeatmapProps {
  checkins: CheckinMeeting[]
}

function SessionVolumeHeatmap({ checkins }: SessionVolumeHeatmapProps) {
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), [])
  const weekEnd   = useMemo(() => addDays(weekStart, 6), [weekStart])
  const weekDays  = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd],
  )
  const weekLabel = useMemo(
    () => `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    [weekStart, weekEnd],
  )

  // grid[dayIndex 0-6][hourIndex 0-8] = session count
  const grid = useMemo<number[][]>(() => {
    const g: number[][] = Array.from({ length: 7 }, () => Array(HOURS.length).fill(0))
    checkins.forEach(c => {
      const d = parseDateValue(c.scheduled_at)
      if (!d) return
      const dayIdx  = weekDays.findIndex(wd => wd.toDateString() === d.toDateString())
      if (dayIdx < 0) return
      const hourIdx = HOURS.indexOf(d.getHours())
      if (hourIdx < 0) return
      g[dayIdx][hourIdx]++
    })
    return g
  }, [checkins, weekDays])

  const maxCount = useMemo(() => Math.max(1, ...grid.flat()), [grid])

  const hourTotals = useMemo(
    () => HOURS.map((h, hi) => ({ hour: h, total: grid.reduce((s, col) => s + col[hi], 0) })),
    [grid],
  )

  const peakHours = useMemo(
    () => [...hourTotals].sort((a, b) => b.total - a.total).slice(0, 3),
    [hourTotals],
  )

  const peakMax = useMemo(
    () => Math.max(1, ...peakHours.map(p => p.total)),
    [peakHours],
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 }}
      className="xl:col-span-3 bg-white dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-white/[0.07] p-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-sm font-semibold text-[#171717] dark:text-[#FAFAFA]">Your sessions this week</p>
          <p className="text-[11px] text-[#888780] dark:text-[#FAFAFA]/40 mt-0.5">{weekLabel}</p>
        </div>
        <button
          aria-label="More options"
          className="p-1 text-[#888780] dark:text-[#FAFAFA]/40 hover:text-[#171717] dark:hover:text-[#FAFAFA] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#132E35]"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="flex gap-4">
        {/* Scrollable grid */}
        <div className="flex-1 min-w-0 overflow-x-auto">
          {/* Day labels */}
          <div className="flex mb-1 ml-16">
            {DAY_LABELS.map((d, i) => (
              <div
                key={`dh-${i}`}
                className="flex-1 min-w-[34px] text-center text-[10px] font-semibold text-[#888780] dark:text-[#FAFAFA]/40"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Hour rows */}
          {HOURS.map((hour, hi) => (
            <div key={`hr-${hour}`} className="flex items-center mb-1">
              <span className="w-16 pr-2 text-right text-[10px] text-[#888780] dark:text-[#FAFAFA]/40 flex-shrink-0">
                {fmtHour(hour)}
              </span>
              {grid.map((dayCol, di) => {
                const count = dayCol[hi]
                const idx   = intensityIndex(count, maxCount)
                const cls   = HEATMAP_CLS[idx] ?? HEATMAP_CLS[0]
                const isDark = idx >= 3
                return (
                  <div
                    key={`cell-${di}-${hi}`}
                    title={`${DAY_LABELS[di]} ${fmtHour(hour)}: ${count} session${count !== 1 ? 's' : ''}`}
                    className={`flex-1 min-w-[34px] h-7 mx-0.5 flex items-center justify-center text-[10px] font-semibold ${cls} ${
                      count > 0
                        ? isDark
                          ? 'text-white dark:text-[#FAFAFA]'
                          : 'text-[#132E35] dark:text-[#FAFAFA]'
                        : 'text-transparent'
                    }`}
                  >
                    {count > 0 ? count : '·'}
                  </div>
                )
              })}
            </div>
          ))}

          {/* Colour-key legend */}
          <div className="flex items-center gap-2 mt-3 ml-16">
            <span className="text-[10px] text-[#888780] dark:text-[#FAFAFA]/40">Low</span>
            {HEATMAP_CLS.map((cls, i) => (
              <div key={`lg-${i}`} className={`w-5 h-3 ${cls}`} />
            ))}
            <span className="text-[10px] text-[#888780] dark:text-[#FAFAFA]/40">High</span>
          </div>
        </div>

        {/* Peak Hours sidebar */}
        <div className="w-36 flex-shrink-0 border-l border-[#E5E5E5] dark:border-white/[0.07] pl-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#888780] dark:text-[#FAFAFA]/40 mb-3">
            Your busiest times
          </p>
          {peakHours.map(({ hour, total }) => (
            <div key={`pk-${hour}`} className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-[#171717] dark:text-[#FAFAFA]">
                  {fmtHour(hour)}
                </span>
                <span className="text-[10px] text-[#888780] dark:text-[#FAFAFA]/40">{total}</span>
              </div>
              <div className="h-1.5 bg-[#F4F4F4] dark:bg-[#242424]">
                <div
                  className="h-full bg-[#132E35] dark:bg-[#2A96AD] transition-all duration-700"
                  style={{ width: `${Math.round((total / peakMax) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ── UpcomingSessions ──────────────────────────────────────────────────────────

interface UpcomingSessionsProps {
  checkins:  CheckinMeeting[]
  clientMap: Map<string, Client>
}

function UpcomingSessions({ checkins, clientMap }: UpcomingSessionsProps) {
  const upcoming = useMemo(() => {
    const now = new Date()
    return checkins
      .filter(c => {
        const d = parseDateValue(c.scheduled_at)
        return d && isAfter(d, now)
      })
      .sort((a, b) => {
        const da = parseDateValue(a.scheduled_at)?.getTime() ?? 0
        const db = parseDateValue(b.scheduled_at)?.getTime() ?? 0
        return da - db
      })
      .slice(0, 5)
  }, [checkins])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="xl:col-span-2 bg-white dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-white/[0.07] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E5] dark:border-white/[0.07]">
        <p className="text-sm font-semibold text-[#171717] dark:text-[#FAFAFA]">What's coming up</p>
        <button
          aria-label="More options"
          className="p-1 text-[#888780] dark:text-[#FAFAFA]/40 hover:text-[#171717] dark:hover:text-[#FAFAFA] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#132E35]"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Session rows */}
      <div className="flex-1 divide-y divide-[#E5E5E5] dark:divide-white/[0.06]">
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#B4B2A9] dark:text-[#FAFAFA]/30">
            <CalendarDays size={24} className="mb-2" />
            <p className="text-xs">Nothing scheduled — book a session to fill your week.</p>
          </div>
        ) : (
          upcoming.map((session, i) => {
            const date   = parseDateValue(session.scheduled_at)
            const client = clientMap.get(session.client_id)
            const Icon   = TYPE_ICON[session.type] ?? MessageCircle
            const isNew  = i < 2
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + i * 0.06 }}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#FAFAFA] dark:hover:bg-[#FAFAFA]/[0.02] transition-colors"
              >
                {/* Date badge */}
                <div
                  className="w-10 h-10 flex-shrink-0 flex flex-col items-center justify-center text-white"
                  style={{ backgroundColor: BRAND }}
                >
                  <span className="text-sm font-bold leading-none">{date ? date.getDate() : '—'}</span>
                  <span className="text-[9px] font-semibold uppercase leading-none mt-0.5">
                    {date ? date.toLocaleDateString('en-US', { month: 'short' }) : ''}
                  </span>
                </div>

                {/* Type icon */}
                <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-[#F4F4F4] dark:bg-[#FAFAFA]/[0.05]">
                  <Icon size={13} className="text-[#444441] dark:text-[#FAFAFA]/60" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#171717] dark:text-[#FAFAFA] truncate">
                    {client?.name ?? 'Client'}
                  </p>
                  <p className="text-[11px] text-[#888780] dark:text-[#FAFAFA]/50 truncate">
                    {date ? humanDate(date) : ''} · {session.type}
                  </p>
                </div>

                {/* Status pill */}
                {isNew ? (
                  <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#132E35]/10 text-[#132E35] dark:bg-[#132E35]/40 dark:text-[#6DB9A8]">
                    New
                  </span>
                ) : (
                  <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#F4F4F4] dark:bg-[#FAFAFA]/[0.06] text-[#888780] dark:text-[#FAFAFA]/50">
                    Scheduled
                  </span>
                )}
              </motion.div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#E5E5E5] dark:border-white/[0.07]">
        <Link
          href="/checkins"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#132E35] dark:text-[#2A96AD] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#132E35]"
        >
          View all sessions <ChevronRight size={13} />
        </Link>
      </div>
    </motion.div>
  )
}

// ── ClientWorkload ────────────────────────────────────────────────────────────

interface ClientWorkloadProps {
  clients:  Client[]
  checkins: CheckinMeeting[]
}

interface WorkloadRow {
  client:  Client
  total:   number
  filled:  number
  overload: boolean
}

function ClientWorkload({ clients, checkins }: ClientWorkloadProps) {
  const rows = useMemo<WorkloadRow[]>(() => {
    return clients.slice(0, 6).map(client => {
      const h            = idHash(client.id)
      const total        = (h % 5) + 6
      const checkinCount = checkins.filter(c => c.client_id === client.id).length
      const filled       = Math.min(checkinCount + (h % 4), total)
      return { client, total, filled, overload: filled >= total }
    })
  }, [clients, checkins])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="xl:col-span-3 bg-white dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-white/[0.07] p-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-sm font-semibold text-[#171717] dark:text-[#FAFAFA]">Client Workload</p>
          <p className="text-[11px] text-[#888780] dark:text-[#FAFAFA]/40 mt-0.5">
            How busy you are today
          </p>
        </div>
        <button
          aria-label="More options"
          className="p-1 text-[#888780] dark:text-[#FAFAFA]/40 hover:text-[#171717] dark:hover:text-[#FAFAFA] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#132E35]"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-[#B4B2A9] dark:text-[#FAFAFA]/30">
          <Users size={24} className="mb-2" />
          <p className="text-xs">Add your first client to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map(({ client, total, filled, overload }, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18 + i * 0.06 }}
              className="flex items-center gap-3"
            >
              <ClientAvatar
                name={client.name}
                profile_photo_url={client.profile_photo_url}
                size="h-9 w-9"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-[12px] font-semibold text-[#171717] dark:text-[#FAFAFA] truncate">
                      {client.name}
                    </p>
                    {client.email && (
                      <p className="text-[11px] text-[#888780] dark:text-[#FAFAFA]/40 truncate hidden sm:block">
                        {client.email}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    {overload && (
                      <>
                        <AlertCircle size={11} className="text-[#EF4444]" />
                        <span className="text-[10px] font-semibold text-[#EF4444]">Overloaded</span>
                      </>
                    )}
                    <span
                      className={`text-[10px] font-semibold ${
                        overload
                          ? 'text-[#EF4444]'
                          : 'text-[#888780] dark:text-[#FAFAFA]/40'
                      }`}
                    >
                      {filled}/{total}
                    </span>
                  </div>
                </div>

                <div className="h-1.5 bg-[#F4F4F4] dark:bg-[#242424] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((filled / total) * 100)}%` }}
                    transition={{ duration: 0.7, delay: 0.18 + i * 0.06 }}
                    className={`h-full ${overload ? 'bg-[#EF4444]' : 'bg-[#132E35] dark:bg-[#2A96AD]'}`}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ── KpiCard ───────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: number
  icon:  LucideIcon
  trend: { value: string; up: boolean }
  delay: number
}

function KpiCard({ label, value, icon: Icon, trend, delay }: KpiCardProps) {
  const trendCls = trend.up
    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
    : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-white/[0.07] p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#888780] dark:text-[#FAFAFA]/40">
          {label}
        </p>
        <div className="w-7 h-7 flex items-center justify-center bg-[#132E35]/10 dark:bg-[#132E35]/30">
          <Icon size={14} className="text-[#132E35] dark:text-[#2A96AD]" />
        </div>
      </div>

      <p className="text-3xl font-bold text-[#171717] dark:text-[#FAFAFA] tracking-tight leading-none">
        {value}
      </p>

      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 ${trendCls}`}>
          {trend.up ? '↑' : '↓'} {trend.value}
        </span>
        <span className="text-[10px] text-[#888780] dark:text-[#FAFAFA]/40">vs last week</span>
      </div>
    </motion.div>
  )
}

// ── DashboardPage ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: clientsData  } = useClients()
  const { data: checkinsData } = useCheckins()
  const { data: workoutData  } = useWorkoutPlans()

  const clients: Client[] = useMemo(
    () => (clientsData as PaginatedResponse<Client> | undefined)?.data ?? [],
    [clientsData],
  )

  const checkins: CheckinMeeting[] = useMemo(
    () => (checkinsData as CheckinMeeting[] | undefined) ?? [],
    [checkinsData],
  )

  const workoutPlans: WorkoutPlan[] = useMemo(
    () =>
      (workoutData as PaginatedResponse<WorkoutPlan> | undefined)?.data ??
      (Array.isArray(workoutData) ? (workoutData as WorkoutPlan[]) : []),
    [workoutData],
  )

  const clientMap = useMemo(
    () => new Map<string, Client>(clients.map(c => [c.id, c])),
    [clients],
  )

  const activeClients = useMemo(
    () => clients.filter(c => c.active && !c.is_blocked).length,
    [clients],
  )

  const inactiveCount = useMemo(
    () => clients.filter(c => !c.active || !!c.is_blocked).length,
    [clients],
  )

  const todaySessions = useMemo(
    () => checkins.filter(c => { const d = parseDateValue(c.scheduled_at); return d && isToday(d) }).length,
    [checkins],
  )

  const thisWeekSessions = useMemo(() => {
    const ws = startOfWeek(new Date(), { weekStartsOn: 1 })
    const we = endOfWeek(new Date(), { weekStartsOn: 1 })
    return checkins.filter(c => {
      const d = parseDateValue(c.scheduled_at)
      return d && d >= ws && d <= we
    }).length
  }, [checkins])

  const activePlans = useMemo(
    () => workoutPlans.filter(p => p.status === 'active').length,
    [workoutPlans],
  )

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#171717] px-6 sm:px-10 py-8">

        {/* Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="flex items-start justify-between mb-6"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#888780] dark:text-[#FAFAFA]/40 mb-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            
          </div>
          
        </motion.div>

        {/* AI Insight Banner */}
        <AISuggestionBanner inactiveCount={inactiveCount} todayCount={todaySessions} />

        {/* Row 1: Session Volume Heatmap + Upcoming Sessions */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mb-4">
          <SessionVolumeHeatmap checkins={checkins} />
          <UpcomingSessions checkins={checkins} clientMap={clientMap} />
        </div>

        {/* Row 2: Client Workload + KPI 2×2 Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <ClientWorkload clients={clients} checkins={checkins} />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="xl:col-span-2 grid grid-cols-2 gap-4 content-start"
          >
            <KpiCard
              label="Total Clients"
              value={clients.length}
              icon={Users}
              trend={{ value: `${activeClients} active`, up: true }}
              delay={0.24}
            />
            <KpiCard
              label="Active Plans"
              value={activePlans}
              icon={Briefcase}
              trend={{ value: '12%', up: true }}
              delay={0.30}
            />
            <KpiCard
              label="Today's Sessions"
              value={todaySessions}
              icon={Calendar}
              trend={{ value: String(todaySessions), up: todaySessions > 0 }}
              delay={0.36}
            />
            <KpiCard
              label="This Week"
              value={thisWeekSessions}
              icon={TrendingUp}
              trend={{ value: '12%', up: thisWeekSessions > 0 }}
              delay={0.42}
            />
          </motion.div>
        </div>

      </div>
    </DashboardLayout>
  )
}
