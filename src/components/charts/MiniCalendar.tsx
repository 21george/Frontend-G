'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCheckins } from '@/lib/hooks'
import { formatDate } from '@/lib/utils'

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface Checkin {
  id: string
  client_id: string
  client_name?: string
  scheduled_at: string
  notes?: string
}

interface DayProgram {
  date: Date
  checkins: Checkin[]
  workoutPlans?: any[]
}

export default function MiniCalendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())
  const { data: checkinsData } = useCheckins()

  const { days, blanks } = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return {
      blanks: Array.from({ length: firstDay }),
      days: Array.from({ length: daysInMonth }, (_, i) => i + 1),
    }
  }, [year, month])

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const next = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const isSelected = (d: number) =>
    d === selectedDay && month === today.getMonth() && year === today.getFullYear()

  // Get programs for selected day
  const dayProgram: DayProgram | null = useMemo(() => {
    if (!selectedDay) return null

    const selectedDate = new Date(year, month, selectedDay)
    const dateStr = selectedDate.toISOString().split('T')[0]

    const checkins: Checkin[] = (checkinsData ?? []).filter((c: Checkin) => {
      const checkinDate = new Date(c.scheduled_at)
      return checkinDate.toISOString().split('T')[0] === dateStr
    })

    return {
      date: selectedDate,
      checkins,
    }
  }, [selectedDay, month, year, checkinsData])

  const hasCheckins = (day: number) => {
    const checkDate = new Date(year, month, day)
    const dateStr = checkDate.toISOString().split('T')[0]
    return (checkinsData ?? []).some((c: Checkin) => {
      const checkinDate = new Date(c.scheduled_at)
      return checkinDate.toISOString().split('T')[0] === dateStr
    })
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <motion.h3
          key={`${MONTHS[month]} ${year}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-sm font-semibold text-slate-900 dark:text-white"
        >
          {MONTHS[month]} {year}
        </motion.h3>
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={prev}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/[0.08] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={next}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/[0.08] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-slate-500 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {blanks.map((_, i) => (
          <div key={`blank-${i}`} className="aspect-square" />
        ))}
        {days.map(d => {
          const hasEvents = hasCheckins(d)
          const todayFlag = isToday(d)
          const selectedFlag = isSelected(d)

          return (
            <motion.button
              key={d}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDay(d)}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-150 relative ${
                selectedFlag
                  ? 'bg-cyan-950 text-white shadow-md shadow-cyan-900/30'
                  : todayFlag
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/30'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-neutral-300 dark:hover:bg-white/[0.08] dark:hover:text-white'
              }`}
            >
              {d}
              {hasEvents && !selectedFlag && !todayFlag && (
                <span className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full" />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Day Program Panel */}
      <AnimatePresence mode="wait">
        {selectedDay && dayProgram && (
          <motion.div
            key={`${year}-${month}-${selectedDay}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 pt-4 border-t border-slate-200 dark:border-white/[0.08] overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {dayProgram.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h4>
            </div>

            {dayProgram.checkins.length === 0 ? (
              <div className="text-center py-4">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400">No scheduled events</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dayProgram.checkins.map((checkin, i) => (
                  <motion.div
                    key={checkin.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                        {checkin.client_name || 'Client Check-in'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                        {formatDate(checkin.scheduled_at, 'h:mm a')}
                        {checkin.notes && ` · ${checkin.notes}`}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
