'use client'

import { useState, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2, MapPin, ArrowRight, Video, Phone, MessageCircle } from 'lucide-react'
import { format, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { motion } from 'framer-motion'
import type { CheckinMeeting, Client } from '@/types'
import { parseDateValue } from '@/lib/utils'
import { EVENT_TYPES, TEXT, SURFACE } from '@/lib/constants'

interface MiniCalendarProps {
  selectedDate: Date
  onSelectDate: (date: Date) => void
  checkins: CheckinMeeting[]
}

export function MiniCalendar({ selectedDate, onSelectDate, checkins }: MiniCalendarProps) {
  const [calDate, setCalDate] = useState(new Date())

  const calGrid = useMemo(() => {
    const first = new Date(calDate.getFullYear(), calDate.getMonth(), 1)
    const start = startOfWeek(first, { weekStartsOn: 1 })
    const last = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0)
    const end = endOfWeek(last, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [calDate])

  const eventDates = useMemo(() => {
    const set = new Set<string>()
    checkins.forEach(c => {
      const d = parseDateValue(c.scheduled_at)
      if (d) set.add(format(d, 'yyyy-MM-dd'))
    })
    return set
  }, [checkins])

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCalDate(d => subMonths(d, 1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors rounded-lg">
          <ChevronLeft size={14} className="text-slate-500 dark:text-slate-400" />
        </button>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {format(calDate, 'MMMM yyyy')}
        </span>
        <button onClick={() => setCalDate(d => addMonths(d, 1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors rounded-lg">
          <ChevronRight size={14} className="text-slate-500 dark:text-slate-400" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 mb-2">
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={`${d}-${i}`} className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {calGrid.map((day, i) => {
          const isCurrent = day.getMonth() === calDate.getMonth()
          const isTodayDay = isToday(day)
          const isActive = isSameDay(day, selectedDate)
          const hasEvent = eventDates.has(format(day, 'yyyy-MM-dd'))
          return (
            <motion.button
              key={i}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => onSelectDate(day)}
              className={`w-9 h-9 text-xs font-medium flex items-center justify-center transition-colors relative mx-auto rounded-full
                ${!isCurrent ? 'text-slate-300 dark:text-slate-600' : ''}
                ${isTodayDay && !isActive ? 'bg-brand-600 text-white' : ''}
                ${isActive ? 'bg-brand-600 dark:bg-brand-500 text-white' : ''}
                ${!isTodayDay && !isActive && isCurrent ? 'hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-900 dark:text-slate-100' : ''}
              `}
            >
              {day.getDate()}
              {hasEvent && !isActive && (
                <span className="absolute bottom-1.5 w-1 h-1 bg-brand-600 rounded-full" />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

interface EventTypeFilterProps {
  selectedTypes: Set<string>
  onToggleType: (type: string) => void
  checkins: CheckinMeeting[]
}

export function EventTypeFilter({ selectedTypes, onToggleType, checkins }: EventTypeFilterProps) {
  return (
    <div className="mb-8">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-4">Event Types</h3>
      <div className="space-y-2">
        {Object.entries(EVENT_TYPES).map(([key, colors]) => {
          const isSelected = selectedTypes.has(key)
          return (
            <motion.button
              key={key}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onToggleType(key)}
              className={`w-full flex items-center gap-3 cursor-pointer p-3 transition-all rounded-lg ${
                isSelected ? 'bg-white dark:bg-surface-subtle-dark shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
              }`}
            >
              <div className={`w-4 h-4 flex items-center justify-center transition-colors rounded ${colors.iconBg}`}>
                {isSelected && <CheckCircle2 size={10} className="text-white" />}
              </div>
              <span className={`text-sm capitalize ${isSelected ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                {key}
              </span>
              <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                {checkins.filter(c => c.type === key).length}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

interface TodaysScheduleProps {
  checkins: CheckinMeeting[]
  clientMap: Map<string, Client>
  onSelectEvent: (event: CheckinMeeting) => void
}

export function TodaysSchedule({ checkins, clientMap, onSelectEvent }: TodaysScheduleProps) {
  const dayEvents = useCallback(
    (day: Date) =>
      checkins.filter(c => {
        const d = parseDateValue(c.scheduled_at)
        return d ? isSameDay(d, day) : false
      }),
    [checkins],
  )

  return (
    <div>
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-4">Today</h3>
      <div className="space-y-3">
        {dayEvents(new Date()).slice(0, 4).map((event, i) => {
          const colors = EVENT_TYPES[event.type as keyof typeof EVENT_TYPES] ?? EVENT_TYPES.chat
          const client = clientMap.get(event.client_id)
          const time = parseDateValue(event.scheduled_at)
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="group p-3 bg-white dark:bg-surface-subtle-dark border border-slate-200 dark:border-white/[0.06] hover:border-brand-300 dark:hover:border-brand-700 transition-all cursor-pointer rounded-lg"
              onClick={() => onSelectEvent(event)}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 flex items-center justify-center rounded ${colors.iconBg}`}>
                  {event.type === 'video' && <Video size={13} className="text-white" />}
                  {event.type === 'call' && <Phone size={13} className="text-white" />}
                  {event.type === 'chat' && <MessageCircle size={13} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{client?.name ?? 'Client'}</p>
                  {time && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{format(time, 'h:mm a')}</p>
                  )}
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-brand-600 transition-colors" />
              </div>
            </motion.div>
          )
        })}
        {dayEvents(new Date()).length === 0 && (
          <div className="text-center py-6">
            <MapPin size={20} className="mx-auto text-slate-400 mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">No events today</p>
          </div>
        )}
      </div>
    </div>
  )
}
