'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useCheckins, useClients, useCreateCheckin } from '@/lib/hooks'
import { useState, useMemo, useCallback } from 'react'
import {
  Plus, Calendar, Video, Phone, MessageCircle, ChevronLeft,
  ChevronRight, Clock, X, Search, User, CheckCircle2, ArrowRight
} from 'lucide-react'
import { formatDate, parseDateValue } from '@/lib/utils'
import { format, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns'
import type { CheckinMeeting } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

const TYPE_COLOR: Record<string, { bg: string; text: string; iconBg: string; border: string; hover: string }> = {
  video: { bg: 'bg-sky-950/10 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-400', iconBg: 'bg-sky-950 dark:bg-sky-500', border: 'border-sky-200 dark:border-sky-800/30', hover: 'hover:bg-sky-950/20 dark:hover:bg-sky-800/30' },
  call: { bg: 'bg-emerald-950/10 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', iconBg: 'bg-emerald-950 dark:bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-800/30', hover: 'hover:bg-emerald-950/20 dark:hover:bg-emerald-800/30' },
  chat: { bg: 'bg-violet-950/10 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400', iconBg: 'bg-violet-950 dark:bg-violet-500', border: 'border-violet-200 dark:border-violet-800/30', hover: 'hover:bg-violet-950/20 dark:hover:bg-violet-800/30' },
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6) // 6 AM to 8 PM
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeekDays(baseDate: Date) {
  const start = startOfWeek(baseDate, { weekStartsOn: 1 })
  const end = endOfWeek(baseDate, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

export default function SchedulePage() {
  const { data: checkins } = useCheckins()
  const { data: clientsData } = useClients()
  const createCheckin = useCreateCheckin()
  const clients = clientsData?.data ?? []
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients])

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selected, setSelected] = useState<CheckinMeeting | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [view, setView] = useState<'month' | 'week' | 'day'>('week')
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['video', 'call', 'chat']))
  const [showSidebar, setShowSidebar] = useState(false)

  const [formClient, setFormClient] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formType, setFormType] = useState<'video' | 'call' | 'chat'>('video')
  const [formLink, setFormLink] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const [calDate, setCalDate] = useState(new Date())
  const calGrid = useMemo(() => {
    const first = new Date(calDate.getFullYear(), calDate.getMonth(), 1)
    const start = startOfWeek(first, { weekStartsOn: 1 })
    const last = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0)
    const end = endOfWeek(last, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [calDate])

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate])

  const filteredEvents = useMemo(() => {
    let list = checkins ?? []
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(c => {
        const client = clientMap.get(c.client_id)
        return (
          client?.name?.toLowerCase().includes(q) ||
          c.type?.toLowerCase().includes(q) ||
          c.notes?.toLowerCase().includes(q)
        )
      })
    }
    if (selectedTypes.size > 0 && selectedTypes.size < 3) {
      list = list.filter(c => selectedTypes.has(c.type))
    }
    return list
  }, [checkins, searchQuery, clientMap, selectedTypes])

  const dayEvents = useCallback(
    (day: Date) =>
      filteredEvents.filter(c => {
        const d = parseDateValue(c.scheduled_at)
        return d ? isSameDay(d, day) : false
      }),
    [filteredEvents],
  )

  const eventDates = useMemo(() => {
    const set = new Set<string>()
    ;(checkins ?? []).forEach(c => {
      const d = parseDateValue(c.scheduled_at)
      if (d) set.add(format(d, 'yyyy-MM-dd'))
    })
    return set
  }, [checkins])

  const goToday = () => { setSelectedDate(new Date()); setCalDate(new Date()) }
  const goPrev = () => setSelectedDate(d => view === 'month' ? subMonths(d, 1) : new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000))
  const goNext = () => setSelectedDate(d => view === 'month' ? addMonths(d, 1) : new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000))
  const selectCalDay = (d: Date) => { setSelectedDate(d); setSelected(null) }

  const selectedClient = selected ? clientMap.get(selected.client_id) : undefined

  const openModal = () => {
    setFormClient('')
    setFormDate(format(selectedDate, 'yyyy-MM-dd'))
    setFormTime('09:00')
    setFormType('video')
    setFormLink('')
    setFormNotes('')
    setShowModal(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      await createCheckin.mutateAsync({
        client_id: formClient,
        scheduled_at: `${formDate}T${formTime}`,
        type: formType,
        meeting_link: formLink,
        notes: formNotes,
      })
      setShowModal(false)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-[#141414]">

        {/* TOP BAR */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white dark:bg-[#171717] border-b border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 sm:hidden hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors">
              <Calendar size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
            <div className="flex items-center gap-1 sm:gap-2">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={goPrev} className="p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors">
                <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={goNext} className="p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors">
                <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
              </motion.button>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                {format(selectedDate, 'MMMM yyyy')}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                {format(selectedDate, 'EEEE, MMM d')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-56 pl-9 pr-3 py-2 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20 rounded-lg transition-all"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/[0.06] rounded-lg">
              {(['month', 'week', 'day'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                    view === v
                      ? 'bg-white dark:bg-[#171717] text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openModal}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-950 hover:bg-cyan-900 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Event</span>
            </motion.button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT SIDEBAR */}
          <AnimatePresence>
            {(showSidebar || typeof window === 'undefined' || window.innerWidth >= 640) && (
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`absolute inset-y-0 left-0 z-40 w-72 bg-white dark:bg-[#171717] border-r border-slate-200 dark:border-white/[0.08] sm:relative sm:transform-none sm:w-72 shadow-lg sm:shadow-none`}
              >
                <div className="p-5 h-full overflow-y-auto">
                  <div className="flex items-center justify-between mb-4 sm:hidden">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">Calendar</span>
                    <button onClick={() => setShowSidebar(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors">
                      <X size={18} className="text-slate-600 dark:text-slate-400" />
                    </button>
                  </div>

                  {/* Mini Calendar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <button onClick={() => setCalDate(d => subMonths(d, 1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors">
                        <ChevronLeft size={16} className="text-slate-600 dark:text-slate-400" />
                      </button>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {format(calDate, 'MMMM yyyy')}
                      </span>
                      <button onClick={() => setCalDate(d => addMonths(d, 1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors">
                        <ChevronRight size={16} className="text-slate-600 dark:text-slate-400" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
                        <div key={d} className="text-center text-[10px] font-semibold text-slate-400">{d}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {calGrid.map((day, i) => {
                        const isCurrent = day.getMonth() === calDate.getMonth()
                        const isTodayDay = isToday(day)
                        const isActive = isSameDay(day, selectedDate)
                        const hasEvent = eventDates.has(format(day, 'yyyy-MM-dd'))
                        return (
                          <motion.button
                            key={i}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => selectCalDay(day)}
                            className={`w-8 h-8 text-xs font-medium flex items-center justify-center transition-colors relative mx-auto
                              ${!isCurrent ? 'text-slate-300 dark:text-slate-600' : ''}
                              ${isTodayDay && !isActive ? 'bg-cyan-950 text-white rounded-full' : ''}
                              ${isActive ? 'bg-cyan-950 text-white rounded-full' : ''}
                              ${!isTodayDay && !isActive && isCurrent ? 'hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 rounded-full' : ''}
                            `}
                          >
                            {day.getDate()}
                            {hasEvent && !isActive && (
                              <span className="absolute bottom-1 w-1 h-1 bg-cyan-500" />
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Filters */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Event Types</h3>
                    <div className="space-y-2">
                      {Object.entries(TYPE_COLOR).map(([key, colors]) => {
                        const isSelected = selectedTypes.has(key)
                        return (
                          <motion.label
                            key={key}
                            whileHover={{ x: 4 }}
                            onClick={() => {
                              const newTypes = new Set(selectedTypes)
                              if (newTypes.has(key)) {
                                if (newTypes.size > 1) newTypes.delete(key)
                              } else {
                                newTypes.add(key)
                              }
                              setSelectedTypes(newTypes)
                            }}
                            className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                          >
                            <div className={`w-5 h-5 flex items-center justify-center transition-colors rounded-md ${
                              isSelected ? colors.iconBg : `bg-slate-100 dark:bg-white/[0.06]`
                            }`}>
                              {isSelected && <CheckCircle2 size={14} className="text-white" />}
                            </div>
                            <span className={`text-sm capitalize ${isSelected ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-600 dark:text-slate-400'}`}>
                              {key}
                            </span>
                          </motion.label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Upcoming Events */}
                  <div className="mt-6">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Today's Schedule</h3>
                    <div className="space-y-2">
                      {dayEvents(new Date()).slice(0, 3).map((event, i) => {
                        const colors = TYPE_COLOR[event.type] ?? TYPE_COLOR.chat
                        const client = clientMap.get(event.client_id)
                        const time = parseDateValue(event.scheduled_at)
                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-6 h-6 flex items-center justify-center rounded ${colors.iconBg}`}>
                                {event.type === 'video' && <Video size={12} className="text-white" />}
                                {event.type === 'call' && <Phone size={12} className="text-white" />}
                                {event.type === 'chat' && <MessageCircle size={12} className="text-white" />}
                              </div>
                              <span className={`text-xs font-medium ${colors.text}`}>{client?.name ?? 'Client'}</span>
                            </div>
                            {time && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 ml-8">
                                {format(time, 'h:mm a')}
                              </p>
                            )}
                          </motion.div>
                        )
                      })}
                      {dayEvents(new Date()).length === 0 && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No events today</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Overlay for mobile */}
          {showSidebar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-30 sm:hidden"
              onClick={() => setShowSidebar(false)}
            />
          )}

          {/* CALENDAR GRID */}
          <div className="flex-1 overflow-auto bg-slate-50 dark:bg-[#0f0f0f]">
            {view === 'week' && (
              <div className="min-w-[800px] p-6">
                {/* Day headers */}
                <div className="grid grid-cols-8 mb-4">
                  <div className="p-3" />
                  {weekDays.map((day, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      className={`p-3 text-center rounded-lg ${isToday(day) ? 'bg-cyan-950/5 dark:bg-cyan-900/10' : ''}`}
                    >
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{DAYS_SHORT[i]}</div>
                      <div className={`text-lg font-semibold mt-1 w-8 h-8 flex items-center justify-center mx-auto rounded-full ${
                        isToday(day) ? 'bg-cyan-950 text-white' : 'text-slate-900 dark:text-white'
                      }`}>
                        {format(day, 'd')}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Time slots */}
                <div className="bg-white dark:bg-[#171717] rounded-lg border border-slate-200 dark:border-white/[0.08] overflow-hidden">
                  {HOURS.map(hour => (
                    <div key={hour} className="grid grid-cols-8 border-b border-slate-100 dark:border-white/[0.06] last:border-b-0">
                      <div className="p-3 text-xs text-slate-400 text-right pr-4 border-r border-slate-100 dark:border-white/[0.06]">
                        {format(new Date(2024, 0, 1, hour), 'h a')}
                      </div>
                      {weekDays.map((day, dayIndex) => {
                        const events = dayEvents(day).filter(e => {
                          const date = parseDateValue(e.scheduled_at)
                          return date && date.getHours() === hour
                        })
                        const isTodayDay = isToday(day)
                        return (
                          <motion.div
                            key={dayIndex}
                            whileHover={{ backgroundColor: isTodayDay ? 'rgba(6, 182, 212, 0.05)' : 'rgba(148, 163, 184, 0.05)' }}
                            className={`relative min-h-[60px] p-1 border-r border-slate-100 dark:border-white/[0.06] last:border-r-0 ${isTodayDay ? 'bg-cyan-950/5 dark:bg-cyan-900/10' : ''}`}
                          >
                            {events.map((event, eventIndex) => {
                              const colors = TYPE_COLOR[event.type] ?? TYPE_COLOR.chat
                              const client = clientMap.get(event.client_id)
                              return (
                                <motion.button
                                  key={event.id}
                                  initial={{ scale: 0.9, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: eventIndex * 0.05 }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setSelected(event)}
                                  className={`w-full ${colors.bg} ${colors.border} border p-2 text-left transition-all hover:shadow-md z-10 relative rounded-md mb-1 last:mb-0`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 flex items-center justify-center flex-shrink-0 rounded-md ${colors.iconBg}`}>
                                      {event.type === 'video' && <Video size={14} className="text-white" />}
                                      {event.type === 'call' && <Phone size={14} className="text-white" />}
                                      {event.type === 'chat' && <MessageCircle size={14} className="text-white" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                        {client?.name ?? 'Client'}
                                      </div>
                                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                        {format(parseDateValue(event.scheduled_at)!, 'h:mm a')}
                                      </div>
                                    </div>
                                  </div>
                                </motion.button>
                              )
                            })}
                          </motion.div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'day' && (
              <div className="min-w-[400px] p-6">
                <div className="bg-white dark:bg-[#171717] rounded-lg border border-slate-200 dark:border-white/[0.08] overflow-hidden mb-4">
                  <div className="p-4 text-center border-b border-slate-100 dark:border-white/[0.06]">
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">
                      {format(selectedDate, 'EEEE')}
                    </div>
                    <div className={`text-3xl font-semibold mt-1 ${isToday(selectedDate) ? 'text-cyan-950 dark:text-cyan-400' : 'text-slate-900 dark:text-white'}`}>
                      {format(selectedDate, 'd')}
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-[#171717] rounded-lg border border-slate-200 dark:border-white/[0.08] overflow-hidden">
                  {HOURS.map(hour => {
                    const events = dayEvents(selectedDate).filter(e => {
                      const date = parseDateValue(e.scheduled_at)
                      return date && date.getHours() === hour
                    })
                    return (
                      <div key={hour} className="flex border-b border-slate-100 dark:border-white/[0.06] last:border-b-0">
                        <div className="w-20 p-3 text-xs text-slate-400 text-right pr-4 border-r border-slate-100 dark:border-white/[0.06] flex-shrink-0">
                          {format(new Date(2024, 0, 1, hour), 'h a')}
                        </div>
                        <div className="flex-1 p-2">
                          {events.map((event, i) => {
                            const colors = TYPE_COLOR[event.type] ?? TYPE_COLOR.chat
                            const client = clientMap.get(event.client_id)
                            return (
                              <motion.button
                                key={event.id}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ scale: 1.01 }}
                                onClick={() => setSelected(event)}
                                className={`w-full ${colors.bg} ${colors.border} border p-3 text-left mb-2 last:mb-0 rounded-lg transition-all hover:shadow-md`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-lg ${colors.iconBg}`}>
                                    {event.type === 'video' && <Video size={16} className="text-white" />}
                                    {event.type === 'call' && <Phone size={16} className="text-white" />}
                                    {event.type === 'chat' && <MessageCircle size={16} className="text-white" />}
                                  </div>
                                  <div className="flex-1 min-w-0 text-left">
                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                      {client?.name ?? 'Client'}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                      {format(parseDateValue(event.scheduled_at)!, 'h:mm a')} · {event.type}
                                    </div>
                                  </div>
                                  <ArrowRight size={16} className="text-slate-400" />
                                </div>
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {view === 'month' && (
              <div className="p-6">
                <div className="bg-white dark:bg-[#171717] rounded-lg border border-slate-200 dark:border-white/[0.08] overflow-hidden">
                  <div className="grid grid-cols-7 border-b border-slate-200 dark:border-white/[0.08]">
                    {DAYS_SHORT.map(d => (
                      <div key={d} className="p-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-white/[0.04]">
                        {d}
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
                    const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
                    const startDate = startOfWeek(firstDay, { weekStartsOn: 1 })
                    const endDate = endOfWeek(lastDay, { weekStartsOn: 1 })
                    const allDays = eachDayOfInterval({ start: startDate, end: endDate })

                    const weeks: typeof allDays[] = []
                    for (let i = 0; i < allDays.length; i += 7) {
                      weeks.push(allDays.slice(i, i + 7))
                    }

                    return weeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="grid grid-cols-7 border-b border-slate-100 dark:border-white/[0.06] last:border-b-0">
                        {week.map((day, i) => {
                          const isCurrent = day.getMonth() === selectedDate.getMonth()
                          const isTodayDay = isToday(day)
                          const events = dayEvents(day)
                          return (
                            <motion.div
                              key={i}
                              whileHover={{ backgroundColor: 'rgba(148, 163, 184, 0.05)' }}
                              onClick={() => { setSelectedDate(day); setView('day') }}
                              className={`p-2 min-h-[100px] cursor-pointer border-r border-slate-100 dark:border-white/[0.06] last:border-r-0 ${
                                !isCurrent ? 'bg-slate-50/50 dark:bg-white/[0.02]' : ''
                              } ${isTodayDay ? 'bg-cyan-950/5 dark:bg-cyan-900/10' : ''}`}
                            >
                              <div className={`text-sm font-medium mb-2 w-7 h-7 flex items-center justify-center rounded-full ${
                                isTodayDay ? 'bg-cyan-950 text-white' : isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                              }`}>
                                {format(day, 'd')}
                              </div>
                              <div className="space-y-1">
                                {events.slice(0, 3).map(event => {
                                  const colors = TYPE_COLOR[event.type] ?? TYPE_COLOR.chat
                                  const client = clientMap.get(event.client_id)
                                  return (
                                    <div
                                      key={event.id}
                                      className={`${colors.bg} ${colors.text} px-2 py-1 text-[10px] font-medium truncate rounded-md`}
                                    >
                                      {client?.name?.split(' ')[0] ?? 'Client'}
                                    </div>
                                  )
                                })}
                                {events.length > 3 && (
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 pl-1">
                                    +{events.length - 3} more
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    ))
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* EVENT DETAIL POPUP */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setSelected(null)}
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-md bg-white dark:bg-[#171717] rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/[0.08]"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 flex items-center justify-center bg-cyan-950 dark:bg-cyan-500 rounded-lg">
                        <User size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {selectedClient?.name ?? 'Client'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium capitalize rounded-md ${
                            TYPE_COLOR[selected.type]?.bg ?? 'bg-slate-100'
                          } ${TYPE_COLOR[selected.type]?.text ?? 'text-slate-700'}`}>
                            {selected.type === 'video' && <Video size={12} />}
                            {selected.type === 'call' && <Phone size={12} />}
                            {selected.type === 'chat' && <MessageCircle size={12} />}
                            {selected.type}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium capitalize rounded-md ${
                            selected.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : selected.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {selected.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors">
                      <X size={18} className="text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm p-3 bg-slate-50 dark:bg-white/[0.04] rounded-lg">
                      <Calendar size={16} className="text-slate-400" />
                      <span className="text-slate-700 dark:text-slate-300">
                        {formatDate(selected.scheduled_at, 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm p-3 bg-slate-50 dark:bg-white/[0.04] rounded-lg">
                      <Clock size={16} className="text-slate-400" />
                      <span className="text-slate-700 dark:text-slate-300">
                        {formatDate(selected.scheduled_at, 'h:mm a')}
                      </span>
                    </div>
                    {selected.meeting_link && (
                      <div className="flex items-center gap-3 text-sm p-3 bg-slate-50 dark:bg-white/[0.04] rounded-lg">
                        <Video size={16} className="text-slate-400" />
                        <a href={selected.meeting_link} target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 hover:underline font-medium">
                          Join meeting
                        </a>
                      </div>
                    )}
                    {selected.notes && (
                      <div className="pt-3">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Notes</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 p-3 bg-slate-50 dark:bg-white/[0.04] rounded-lg">{selected.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-white/[0.08]">
                    <button className="flex-1 px-4 py-2.5 bg-cyan-950 hover:bg-cyan-900 text-white text-sm font-medium rounded-lg transition-colors">
                      Reschedule
                    </button>
                    <button className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors hover:bg-slate-200 dark:hover:bg-white/[0.1]">
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CREATE MODAL */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-md bg-white dark:bg-[#171717] rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/[0.08]"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/[0.08]">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Add Event</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Schedule a new session</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors">
                    <X size={18} className="text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Client</label>
                    <select
                      value={formClient}
                      onChange={e => setFormClient(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20 rounded-lg transition-all"
                    >
                      <option value="">Select a client...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Date</label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={e => setFormDate(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20 rounded-lg transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Time</label>
                      <input
                        type="time"
                        value={formTime}
                        onChange={e => setFormTime(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20 rounded-lg transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Type</label>
                    <select
                      value={formType}
                      onChange={e => setFormType(e.target.value as 'video' | 'call' | 'chat')}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20 rounded-lg transition-all"
                    >
                      <option value="video">Video Call</option>
                      <option value="call">Phone Call</option>
                      <option value="chat">Chat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Meeting Link</label>
                    <input
                      type="url"
                      value={formLink}
                      onChange={e => setFormLink(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20 rounded-lg transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Notes</label>
                    <textarea
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                      rows={3}
                      placeholder="Agenda, topics to discuss..."
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20 rounded-lg transition-all resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="px-5 py-2.5 bg-cyan-950 hover:bg-cyan-900 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {formLoading ? 'Saving...' : 'Save Event'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}
