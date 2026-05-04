'use client'

import { useMemo, useCallback } from 'react'
import { format, isToday, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { motion } from 'framer-motion'
import { Video, Phone, MessageCircle } from 'lucide-react'
import type { CheckinMeeting, Client } from '@/types'
import { parseDateValue } from '@/lib/utils'
import { EVENT_TYPES } from '@/lib/constants'

interface WeekViewProps {
  selectedDate: Date
  checkins: CheckinMeeting[]
  clientMap: Map<string, Client>
  filteredEvents: CheckinMeeting[]
  onSelectEvent: (event: CheckinMeeting) => void
}

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 15 }, (_, i) => i + 6)

export function WeekView({ selectedDate, checkins, clientMap, filteredEvents, onSelectEvent }: WeekViewProps) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [selectedDate])

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
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="min-w-[900px]"
    >
      {/* Day headers */}
      <div className="grid grid-cols-8 mb-3">
        <div className="p-3" />
        {weekDays.map((day, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className={`p-3 text-center ${isToday(day) ? 'bg-[#C65D3B]/5' : ''}`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#A89B8C] mb-1">{DAYS_SHORT[i]}</div>
            <div className={`text-2xl font-serif font-medium w-10 h-10 flex items-center justify-center mx-auto ${
              isToday(day) ? 'bg-[#C65D3B] text-white' : 'text-[#1A1A1A] dark:text-[#F0EBE3]'
            }`}>
              {format(day, 'd')}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Time grid */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#E8E2D9] dark:border-white/[0.06] overflow-hidden">
        {HOURS.map(hour => (
          <motion.div
            key={hour}
            variants={itemVariants}
            className="grid grid-cols-8 border-b border-[#F4F0EA] dark:border-white/[0.04] last:border-b-0"
          >
            <div className="p-3 text-[11px] font-medium text-[#A89B8C] text-right pr-5 border-r border-[#F4F0EA] dark:border-white/[0.04]">
              {format(new Date(2024, 0, 1, hour), 'h a')}
            </div>
            {weekDays.map((day, dayIndex) => {
              const events = dayEvents(day).filter(e => {
                const date = parseDateValue(e.scheduled_at)
                return date && date.getHours() === hour
              })
              const isTodayDay = isToday(day)
              return (
                <div
                  key={dayIndex}
                  className={`relative min-h-[72px] p-1.5 border-r border-[#F4F0EA] dark:border-white/[0.04] last:border-r-0 transition-colors ${isTodayDay ? 'bg-[#C65D3B]/[0.02]' : ''}`}
                >
                  {events.map((event, eventIndex) => {
                    const colors = EVENT_TYPES[event.type as keyof typeof EVENT_TYPES] ?? EVENT_TYPES.chat
                    const client = clientMap.get(event.client_id)
                    return (
                      <motion.button
                        key={event.id}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: eventIndex * 0.05, duration: 0.25 }}
                        whileHover={{ y: -2, boxShadow: '0 8px 24px -6px rgba(0,0,0,0.12)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectEvent(event)}
                        className={`w-full ${colors.bg} ${colors.border} border p-2.5 text-left transition-all mb-1.5 last:mb-0 group rounded`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 flex items-center justify-center flex-shrink-0 rounded ${colors.iconBg}`}>
                            {event.type === 'video' && <Video size={10} className="text-white" />}
                            {event.type === 'call' && <Phone size={10} className="text-white" />}
                            {event.type === 'chat' && <MessageCircle size={10} className="text-white" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {client?.name ?? 'Client'}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {(() => { const d = parseDateValue(event.scheduled_at); return d ? format(d, 'h:mm a') : '-'; })()}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              )
            })}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
