'use client'

import { useMemo } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { parseDateValue } from '@/lib/utils'
import type { CheckinMeeting } from '@/types'
import { startOfWeek, endOfWeek, eachDayOfInterval, addDays } from 'date-fns'
import { motion } from 'framer-motion'

const HEATMAP_CLS = [
  'bg-[#F4F4F4] dark:bg-[#242424]',
  'bg-[#C8E6E0] dark:bg-[#1C4A54]',
  'bg-[#8BCDBF] dark:bg-[#1F5F6E]',
  'bg-[#4CA896] dark:bg-[#227A8A]',
  'bg-[#132E35] dark:bg-[#2A96AD]',
] as const

const HOURS      = [9, 10, 11, 12, 13, 14, 15, 16, 17]
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function fmtHour(h: number): string {
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

function intensityIndex(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0 || max === 0) return 0
  const r = count / max
  if (r < 0.25) return 1
  if (r < 0.5)  return 2
  if (r < 0.75) return 3
  return 4
}

interface SessionVolumeHeatmapProps {
  checkins: CheckinMeeting[]
}

export function SessionVolumeHeatmap({ checkins }: SessionVolumeHeatmapProps) {
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
      className="xl:col-span-3 bg-[var(--bg-card)] dark:bg-[#1A1A1A] border border-[var(--border)] dark:border-white/[0.07] p-5"
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)] dark:text-[#FAFAFA]">Your sessions this week</p>
          <p className="text-[11px] text-[var(--text-secondary)] dark:text-[#FAFAFA]/40 mt-0.5">{weekLabel}</p>
        </div>
        <button
          aria-label="More options"
          className="p-1 text-[var(--text-secondary)] dark:text-[#FAFAFA]/40 hover:text-[var(--text-primary)] dark:hover:text-[#FAFAFA] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#132E35]"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 min-w-0 overflow-x-auto">
          <div className="flex mb-1 ml-16">
            {DAY_LABELS.map((d, i) => (
              <div
                key={`dh-${i}`}
                className="flex-1 min-w-[34px] text-center text-[10px] font-semibold text-[var(--text-secondary)] dark:text-[#FAFAFA]/40"
              >
                {d}
              </div>
            ))}
          </div>

          {HOURS.map((hour, hi) => (
            <div key={`hr-${hour}`} className="flex items-center mb-1">
              <span className="w-16 pr-2 text-right text-[10px] text-[var(--text-secondary)] dark:text-[#FAFAFA]/40 flex-shrink-0">
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

          <div className="flex items-center gap-2 mt-3 ml-16">
            <span className="text-[10px] text-[var(--text-secondary)] dark:text-[#FAFAFA]/40">Low</span>
            {HEATMAP_CLS.map((cls, i) => (
              <div key={`lg-${i}`} className={`w-5 h-3 ${cls}`} />
            ))}
            <span className="text-[10px] text-[var(--text-secondary)] dark:text-[#FAFAFA]/40">High</span>
          </div>
        </div>

        <div className="w-36 flex-shrink-0 border-l border-[var(--border)] dark:border-white/[0.07] pl-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)] dark:text-[#FAFAFA]/40 mb-3">
            Your busiest times
          </p>
          {peakHours.map(({ hour, total }) => (
            <div key={`pk-${hour}`} className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-[var(--text-primary)] dark:text-[#FAFAFA]">
                  {fmtHour(hour)}
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] dark:text-[#FAFAFA]/40">{total}</span>
              </div>
              <div className="h-1.5 bg-[var(--bg-subtle)] dark:bg-[#242424]">
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
