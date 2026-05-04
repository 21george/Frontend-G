'use client'

import { useMemo } from 'react'
import { format, isToday, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { motion } from 'framer-motion'
import type { CheckinMeeting, Client } from '@/types'
import { parseDateValue } from '@/lib/utils'
import { EVENT_TYPES, TEXT, SURFACE, ANIMATION } from '@/lib/constants'

interface MonthViewProps {
  selectedDate: Date
  onSelectDate: (date: Date) => void
  checkins: CheckinMeeting[]
  clientMap: Map<string, Client>
  filteredEvents: CheckinMeeting[]
}

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function MonthView({ selectedDate, onSelectDate, checkins, clientMap, filteredEvents }: MonthViewProps) {
  const dayEvents = useMemo(() => {
    const map = new Map<string, CheckinMeeting[]>()
    filteredEvents.forEach(c => {
      const d = parseDateValue(c.scheduled_at)
      if (d) {
        const key = format(d, 'yyyy-MM-dd')
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(c)
      }
    })
    return map
  }, [filteredEvents])

  const weeks = useMemo(() => {
    const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
    const startDate = startOfWeek(firstDay, { weekStartsOn: 1 })
    const endDate = endOfWeek(lastDay, { weekStartsOn: 1 })
    const allDays = eachDayOfInterval({ start: startDate, end: endDate })

    const result: typeof allDays[] = []
    for (let i = 0; i < allDays.length; i += 7) {
      result.push(allDays.slice(i, i + 7))
    }
    return result
  }, [selectedDate])

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
      variants={ANIMATION.container}
      initial="hidden"
      animate="show"
    >
      <div className="bg-white dark:bg-surface-card-dark border border-slate-200 dark:border-white/[0.06] overflow-hidden rounded-lg shadow-card dark:shadow-dark-card">
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-white/[0.06]">
          {DAYS_SHORT.map(d => (
            <div key={d} className="p-3 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.02]">
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-slate-100 dark:border-white/[0.04] last:border-b-0">
            {week.map((day, i) => {
              const isCurrent = day.getMonth() === selectedDate.getMonth()
              const isTodayDay = isToday(day)
              const events = dayEvents.get(format(day, 'yyyy-MM-dd')) ?? []
              return (
                <motion.div
                  key={i}
                  variants={ANIMATION.item}
                  whileHover={{ backgroundColor: isTodayDay ? 'rgba(79, 70, 229, 0.08)' : 'rgba(79, 70, 229, 0.03)' }}
                  onClick={() => onSelectDate(day)}
                  className={`p-2.5 min-h-[110px] cursor-pointer border-r border-slate-100 dark:border-white/[0.04] last:border-r-0 transition-colors ${
                    !isCurrent ? 'bg-slate-50/60 dark:bg-white/[0.015]' : ''
                  } ${isTodayDay ? 'bg-brand-500/[0.05] dark:bg-brand-500/[0.1]' : ''}`}
                >
                  <div className={`text-sm font-medium mb-2 w-8 h-8 flex items-center justify-center rounded-full ${
                    isTodayDay ? 'bg-brand-600 text-white' : isCurrent ? 'text-slate-900 dark:text-slate-100' : 'text-slate-300 dark:text-slate-600'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1.5">
                    {events.slice(0, 3).map(event => {
                      const colors = EVENT_TYPES[event.type as keyof typeof EVENT_TYPES] ?? EVENT_TYPES.chat
                      const client = clientMap.get(event.client_id)
                      return (
                        <div
                          key={event.id}
                          className={`${colors.bg} ${colors.text} px-2 py-1 text-[10px] font-semibold truncate border ${colors.border} rounded`}
                        >
                          {client?.name?.split(' ')[0] ?? 'Client'}
                        </div>
                      )
                    })}
                    {events.length > 3 && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 pl-1 font-medium">
                        +{events.length - 3} more
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        ))}
      </div>
    </motion.div>
  )
}
