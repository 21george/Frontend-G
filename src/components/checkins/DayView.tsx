'use client'

import { useMemo, useCallback } from 'react'
import { format, isToday, isSameDay } from 'date-fns'
import { motion } from 'framer-motion'
import { Video, Phone, MessageCircle, ArrowRight } from 'lucide-react'
import type { CheckinMeeting, Client } from '@/types'
import { parseDateValue } from '@/lib/utils'
import { EVENT_TYPES } from '@/lib/constants'

interface DayViewProps {
  selectedDate: Date
  checkins: CheckinMeeting[]
  clientMap: Map<string, Client>
  filteredEvents: CheckinMeeting[]
  onSelectEvent: (event: CheckinMeeting) => void
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6)

export function DayView({ selectedDate, checkins, clientMap, filteredEvents, onSelectEvent }: DayViewProps) {
  const dayEvents = useCallback(
    (day: Date) =>
      filteredEvents.filter(c => {
        const d = parseDateValue(c.scheduled_at)
        return d ? isSameDay(d, day) : false
      }),
    [filteredEvents],
  )

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04, delayChildren: 0.05 },
    },
  }
  const itemVariants = {
    hidden: { opacity: 0, x: -16 },
    show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-3xl mx-auto"
    >
      {/* Day header card */}
      <motion.div variants={itemVariants} className="mb-6 p-6 bg-white dark:bg-[#1A1A1A] border border-[#E8E2D9] dark:border-white/[0.06]">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A89B8C] mb-1">
          {format(selectedDate, 'EEEE')}
        </div>
        <div className={`text-5xl font-serif font-medium ${isToday(selectedDate) ? 'text-[#C65D3B]' : 'text-[#1A1A1A] dark:text-[#F0EBE3]'}`}>
          {format(selectedDate, 'd')}
        </div>
      </motion.div>

      <div className="bg-white dark:bg-[#1A1A1A] border border-[#E8E2D9] dark:border-white/[0.06] overflow-hidden">
        {HOURS.map(hour => {
          const events = dayEvents(selectedDate).filter(e => {
            const date = parseDateValue(e.scheduled_at)
            return date && date.getHours() === hour
          })
          return (
            <motion.div
              key={hour}
              variants={itemVariants}
              className="flex border-b border-[#F4F0EA] dark:border-white/[0.04] last:border-b-0"
            >
              <div className="w-24 p-4 text-[11px] font-medium text-[#A89B8C] text-right pr-5 border-r border-[#F4F0EA] dark:border-white/[0.04] flex-shrink-0">
                {format(new Date(2024, 0, 1, hour), 'h a')}
              </div>
              <div className="flex-1 p-2">
                {events.map((event, i) => {
                  const colors = EVENT_TYPES[event.type as keyof typeof EVENT_TYPES] ?? EVENT_TYPES.chat
                  const client = clientMap.get(event.client_id)
                  return (
                    <motion.button
                      key={event.id}
                      initial={{ x: -16, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.08 }}
                      whileHover={{ y: -2, boxShadow: '0 8px 24px -6px rgba(0,0,0,0.12)' }}
                      onClick={() => onSelectEvent(event)}
                      className={`w-full ${colors.bg} ${colors.border} border p-4 text-left mb-2 last:mb-0 transition-all group rounded-lg`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 flex items-center justify-center flex-shrink-0 rounded ${colors.iconBg}`}>
                          {event.type === 'video' && <Video size={15} className="text-white" />}
                          {event.type === 'call' && <Phone size={15} className="text-white" />}
                          {event.type === 'chat' && <MessageCircle size={15} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {client?.name ?? 'Client'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {(() => { const d = parseDateValue(event.scheduled_at); return d ? format(d, 'h:mm a') : ''; })()} &middot; {event.type}
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-slate-400 group-hover:text-brand-600 transition-colors" />
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
