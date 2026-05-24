'use client'

import { useState, useMemo } from 'react'
import { X, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const BRAND   = '#132E35'
const BRAND_H = '#1C4A54'

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

export function AISuggestionBanner({ inactiveCount, todayCount }: AISuggestionBannerProps) {
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
              className="flex-shrink-0 w-64 bg-[var(--bg-card)] dark:bg-[#1A1A1A] border border-[var(--border)] dark:border-white/[0.07] p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--text-primary)] dark:text-[#FAFAFA]">{card.label}</p>
                <button
                  onClick={() => dismiss(card.id)}
                  aria-label={`Dismiss ${card.label}`}
                  className="flex-shrink-0 text-[var(--text-secondary)] dark:text-[#FAFAFA]/40 hover:text-[var(--text-primary)] dark:hover:text-[#FAFAFA] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#132E35]"
                >
                  <X size={13} />
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-[var(--text-secondary)] dark:text-[#FAFAFA]/60">
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
