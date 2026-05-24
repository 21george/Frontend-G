'use client'

import { useState, useMemo, useEffect } from 'react'
import { MoreHorizontal, CalendarDays, MessageCircle, Video, Phone, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { parseDateValue } from '@/lib/utils'
import type { Client, CheckinMeeting } from '@/types'
import { isAfter } from 'date-fns'
import { humanDate } from '@/lib/formatDate'
import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'

const BRAND = '#132E35'

const TYPE_ICON: Record<string, LucideIcon> = { video: Video, call: Phone, chat: MessageCircle }

interface UpcomingSessionsProps {
  checkins:  CheckinMeeting[]
  clientMap: Map<string, Client>
}

export function UpcomingSessions({ checkins, clientMap }: UpcomingSessionsProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const upcoming = useMemo(() => {
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
  }, [checkins, now])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="xl:col-span-2 bg-[var(--bg-card)] dark:bg-[#1A1A1A] border border-[var(--border)] dark:border-white/[0.07] flex flex-col"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] dark:border-white/[0.07]">
        <p className="text-sm font-semibold text-[var(--text-primary)] dark:text-[#FAFAFA]">What&apos;s coming up</p>
        <button
          aria-label="More options"
          className="p-1 text-[var(--text-secondary)] dark:text-[#FAFAFA]/40 hover:text-[var(--text-primary)] dark:hover:text-[#FAFAFA] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#132E35]"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="flex-1 divide-y divide-[var(--border)] dark:divide-white/[0.06]">
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--text-tertiary)] dark:text-[#FAFAFA]/30">
            <CalendarDays size={24} className="mb-2" />
            <p className="text-xs">Nothing scheduled — book a session to fill your week.</p>
          </div>
        ) : (
          upcoming.map((session, i) => {
            const date   = parseDateValue(session.scheduled_at)
            const client = clientMap.get(session.client_id)
            const Icon   = TYPE_ICON[session.type] ?? MessageCircle
            const respondedAt = session.client_responded_at ? new Date(session.client_responded_at) : null
            const nowTime = new Date()
            const twentyFourHoursAgo = new Date(nowTime.getTime() - 24 * 60 * 60 * 1000)
            const isNew = respondedAt !== null && respondedAt > twentyFourHoursAgo
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + i * 0.06 }}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--bg-subtle)] dark:hover:bg-[#FAFAFA]/[0.02] transition-colors"
              >
                <div
                  className="w-10 h-10 flex-shrink-0 flex flex-col items-center justify-center text-white"
                  style={{ backgroundColor: BRAND }}
                >
                  <span className="text-sm font-bold leading-none">{date ? date.getDate() : '—'}</span>
                  <span className="text-[9px] font-semibold uppercase leading-none mt-0.5">
                    {date ? date.toLocaleDateString('en-US', { month: 'short' }) : ''}
                  </span>
                </div>

                <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-[var(--bg-subtle)] dark:bg-[#FAFAFA]/[0.05]">
                  <Icon size={13} className="text-[var(--text-secondary)] dark:text-[#FAFAFA]/60" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] dark:text-[#FAFAFA] truncate">
                    {client?.name ?? 'Client'}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] dark:text-[#FAFAFA]/50 truncate">
                    {date ? humanDate(date) : ''} · {session.type}
                  </p>
                </div>

                {isNew ? (
                  <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[var(--bg-subtle)] text-[#132E35] dark:bg-[#132E35]/40 dark:text-[#6DB9A8]">
                    New
                  </span>
                ) : (
                  <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[var(--bg-subtle)] dark:bg-[#FAFAFA]/[0.06] text-[var(--text-secondary)] dark:text-[#FAFAFA]/50">
                    Scheduled
                  </span>
                )}
              </motion.div>
            )
          })
        )}
      </div>

      <div className="px-5 py-3 border-t border-[var(--border)] dark:border-white/[0.07]">
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
