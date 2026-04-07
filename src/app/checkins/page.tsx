'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useCheckins, useClients, useCreateCheckin } from '@/lib/hooks'
import Link from 'next/link'
import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Plus, Calendar, Video, Phone, MessageCircle, ChevronLeft,
  ChevronRight, Clock, Copy, Pencil, Bell, X, Search, Link2,
} from 'lucide-react'
import { formatDate, parseDateValue } from '@/lib/utils'
import {
  format, isSameDay, addDays, subDays, addMonths, subMonths,
  startOfWeek, addWeeks, subWeeks, eachDayOfInterval,
} from 'date-fns'
import type { CheckinMeeting } from '@/types'

/* ── constants ────────────────────────────────────────────────────────────── */
const HOURS = Array.from({ length: 14 }, (_, i) => i + 6) // 6 AM → 7 PM
const HOUR_HEIGHT = 72
const TYPE_ICON: Record<string, typeof Video> = { video: Video, call: Phone, chat: MessageCircle }
const TYPE_COLOR: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  video: {
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    text: 'text-sky-800 dark:text-sky-200',
    border: 'border-sky-200 dark:border-sky-800/30',
    dot: 'bg-sky-500',
  },
  call: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-800 dark:text-emerald-200',
    border: 'border-emerald-200 dark:border-emerald-800/30',
    dot: 'bg-emerald-500',
  },
  chat: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    text: 'text-violet-800 dark:text-violet-200',
    border: 'border-violet-200 dark:border-violet-800/30',
    dot: 'bg-violet-500',
  },
}

type ViewMode = 'day' | 'week' | 'month'

/* ── helpers ──────────────────────────────────────────────────────────────── */
function getMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1)
  const start = startOfWeek(first, { weekStartsOn: 1 })
  const last = new Date(year, month + 1, 0)
  const end = addDays(startOfWeek(addDays(last, 7), { weekStartsOn: 1 }), -1)
  return eachDayOfInterval({ start, end })
}

function eventPosition(scheduledAt: string) {
  const d = parseDateValue(scheduledAt)
  if (!d) return { top: 0, height: HOUR_HEIGHT }
  const minutes = d.getHours() * 60 + d.getMinutes()
  const top = ((minutes - 6 * 60) / 60) * HOUR_HEIGHT
  return { top: Math.max(0, top), height: HOUR_HEIGHT }
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  PAGE                                                                     */
/* ══════════════════════════════════════════════════════════════════════════ */
export default function SchedulePage() {
  const { data: checkins, isLoading } = useCheckins()
  const { data: clientsData }         = useClients()
  const createCheckin                 = useCreateCheckin()
  const clients                       = clientsData?.data ?? []
  const clientMap                     = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients])

  /* state */
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode]         = useState<ViewMode>('week')
  const [selected, setSelected]         = useState<CheckinMeeting | null>(null)
  const [searchQuery, setSearchQuery]   = useState('')
  const [showModal, setShowModal]       = useState(false)

  /* modal form */
  const [formClient, setFormClient]   = useState('')
  const [formDate, setFormDate]       = useState('')
  const [formTime, setFormTime]       = useState('')
  const [formType, setFormType]       = useState<'video' | 'call' | 'chat'>('video')
  const [formLink, setFormLink]       = useState('')
  const [formNotes, setFormNotes]     = useState('')
  const [formLoading, setFormLoading] = useState(false)

  /* mini-calendar */
  const [calDate, setCalDate] = useState(new Date())
  const calGrid = useMemo(() => getMonthGrid(calDate.getFullYear(), calDate.getMonth()), [calDate])

  /* live clock for current-time indicator */
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  /* filtered events */
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
    return list
  }, [checkins, searchQuery, clientMap])

  /* days shown in day / week view */
  const viewDays = useMemo<Date[]>(() => {
    if (viewMode === 'day') return [selectedDate]
    if (viewMode === 'week') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
      return Array.from({ length: 7 }, (_, i) => addDays(start, i))
    }
    return [] // month handled separately
  }, [selectedDate, viewMode])

  const dayEvents = useCallback(
    (day: Date) =>
      filteredEvents.filter(c => {
        const d = parseDateValue(c.scheduled_at)
        return d ? isSameDay(d, day) : false
      }),
    [filteredEvents],
  )

  /* dots on mini-calendar */
  const eventDates = useMemo(() => {
    const set = new Set<string>()
    ;(checkins ?? []).forEach(c => {
      const d = parseDateValue(c.scheduled_at)
      if (d) set.add(format(d, 'yyyy-MM-dd'))
    })
    return set
  }, [checkins])

  /* nav helpers */
  const goToday = () => { setSelectedDate(new Date()); setCalDate(new Date()) }
  const goPrev = () => {
    if (viewMode === 'day') setSelectedDate(d => subDays(d, 1))
    else if (viewMode === 'week') setSelectedDate(d => subWeeks(d, 1))
    else setSelectedDate(d => subMonths(d, 1))
  }
  const goNext = () => {
    if (viewMode === 'day') setSelectedDate(d => addDays(d, 1))
    else if (viewMode === 'week') setSelectedDate(d => addWeeks(d, 1))
    else setSelectedDate(d => addMonths(d, 1))
  }
  const selectCalDay = (d: Date) => { setSelectedDate(d); setSelected(null) }

  const selectedClient = selected ? clientMap.get(selected.client_id) : undefined

  /* month grid (only when month view) */
  const monthGrid = useMemo(() => {
    if (viewMode !== 'month') return []
    return getMonthGrid(selectedDate.getFullYear(), selectedDate.getMonth())
  }, [selectedDate, viewMode])

  /* current time position on timeline */
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowTop = ((nowMinutes - 6 * 60) / 60) * HOUR_HEIGHT

  /* modal helpers */
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

  /* ═════════════════════════════════ RENDER ═══════════════════════════════ */
  return (
    <DashboardLayout>
      <div className="flex flex-col  sm:-mx-6 -mt-16 lg:-mt-8 -mb-10">

        {/* ── HEADER ── */}
        <div className="bg-white dark:bg-[#141414] border-b border-t-8 border-slate-200 dark:border-white/[0.07] px-4 sm:px-6 py-4 flex-shrink-0">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            {/* Left – title + date */}
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Schedule</h1>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                {format(selectedDate, 'MMMM d, yyyy')} · {format(selectedDate, 'EEEE')}
              </p>
            </div>

            {/* Center – view mode pills */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.06] rounded-xl p-1">
              {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-colors ${
                    viewMode === mode
                      ? 'bg-white dark:bg-white/[0.12] text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Right – controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center">
                <button onClick={goPrev} className="w-8 h-8 rounded-l-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors">
                  <ChevronLeft size={15} />
                </button>
                <button onClick={goNext} className="w-8 h-8 rounded-r-lg border border-l-0 border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors">
                  <ChevronRight size={15} />
                </button>
              </div>

              <button onClick={goToday} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors">
                Today
              </button>

              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-36 sm:w-44 pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[12px] text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20 transition-colors"
                />
              </div>

              {/* New Schedule */}
              <button
                onClick={openModal}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-white text-[12px] font-semibold transition-colors"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">New Schedule</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ━━━ MAIN AREA ━━━ */}
          <div className="flex-1 overflow-auto min-w-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-[13px] text-slate-500 dark:text-slate-400">Loading schedule…</div>
              </div>
            ) : viewMode === 'month' ? (
              /* ────── MONTH GRID ────── */
              <div className="p-4">
                <div className="grid grid-cols-7 mb-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                    <div key={d} className="text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-2">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 border-t border-l border-slate-200 dark:border-white/[0.06]">
                  {monthGrid.map((day, i) => {
                    const isCurrent = day.getMonth() === selectedDate.getMonth()
                    const isToday = isSameDay(day, now)
                    const evts = dayEvents(day)
                    return (
                      <button
                        key={i}
                        onClick={() => { setSelectedDate(day); setViewMode('day') }}
                        className={`min-h-[100px] p-2 border-b border-r border-slate-200 dark:border-white/[0.06] text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02] ${
                          !isCurrent ? 'bg-slate-50/50 dark:bg-white/[0.01]' : 'bg-white dark:bg-[#141414]'
                        }`}
                      >
                        <span className={`text-[12px] font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          isToday ? 'bg-cyan-950 text-white' : isCurrent ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'
                        }`}>{day.getDate()}</span>
                        <div className="mt-1 space-y-0.5">
                          {evts.slice(0, 3).map(ev => {
                            const colors = TYPE_COLOR[ev.type] ?? TYPE_COLOR.chat
                            return (
                              <div key={ev.id} className={`${colors.bg} ${colors.text} rounded px-1.5 py-0.5 text-[10px] font-medium truncate`}>
                                {clientMap.get(ev.client_id)?.name ?? 'Client'}
                              </div>
                            )
                          })}
                          {evts.length > 3 && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">+{evts.length - 3} more</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* ────── DAY / WEEK TIMELINE ────── */
             <> none</>
            )}
          </div>

          {/* ━━━ RIGHT SIDEBAR ━━━ */}
          <div className="hidden lg:flex flex-col w-[300px] xl:w-[320px] border-l border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#141414] overflow-y-auto flex-shrink-0">

            {/* ── Mini Calendar ── */}
            <div className="p-4 border-b border-slate-200 dark:border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setCalDate(d => subMonths(d, 1))} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[13px] font-semibold text-slate-800 dark:text-white">
                  {format(calDate, 'MMMM yyyy')}
                </span>
                <button onClick={() => setCalDate(d => addMonths(d, 1))} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-1">
                {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-0.5">
                {calGrid.map((day, i) => {
                  const isCurrent = day.getMonth() === calDate.getMonth()
                  const isToday = isSameDay(day, now)
                  const isActive = isSameDay(day, selectedDate)
                  const hasEvent = eventDates.has(format(day, 'yyyy-MM-dd'))
                  return (
                    <button
                      key={i}
                      onClick={() => selectCalDay(day)}
                      className={`w-8 h-8 mx-auto rounded-full text-[11px] font-medium flex flex-col items-center justify-center transition-colors relative
                        ${!isCurrent ? 'text-slate-300 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300'}
                        ${isToday && !isActive ? 'bg-cyan-950 text-white font-semibold' : ''}
                        ${isActive ? 'ring-2 ring-cyan-950 dark:ring-cyan-400 font-semibold bg-cyan-950/10 dark:bg-cyan-900/30 text-cyan-900 dark:text-cyan-300' : ''}
                        ${!isToday && !isActive ? 'hover:bg-slate-100 dark:hover:bg-white/[0.06]' : ''}
                      `}
                    >
                      {day.getDate()}
                      {hasEvent && (
                        <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-cyan-950 dark:bg-cyan-400" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Event Detail ── */}
            {selected ? (
              <div className="p-4 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white leading-snug">
                    {selectedClient?.name ?? 'Client'} · <span className="capitalize">{selected.type}</span>
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors" title="Copy link">
                      <Copy size={13} />
                    </button>
                    <Link href={`/checkins/new?client=${selected.client_id}`} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors" title="Edit">
                      <Pencil size={13} />
                    </Link>
                  </div>
                </div>

                <div className="space-y-3 text-[12px]">
                  <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                    <Calendar size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    <span>{formatDate(selected.scheduled_at, 'EEEE, MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                    <Clock size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    <span>{formatDate(selected.scheduled_at, 'h:mm a')}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                    <Bell size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    <span>10 min before</span>
                  </div>

                  {/* Client */}
                  <div className="flex items-center gap-2.5 pt-2">
                    {selectedClient?.profile_photo_url ? (
                      <img src={selectedClient.profile_photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-white/[0.08] flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{selectedClient?.name?.[0]?.toUpperCase() ?? 'C'}</span>
                      </div>
                    )}
                    <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{selectedClient?.name ?? 'Client'}</span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      selected.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : selected.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    }`}>{selected.status}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      selected.client_response === 'accepted' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : selected.client_response === 'declined' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : selected.client_response === 'reschedule_requested' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400'
                    }`}>{selected.client_response?.replace('_', ' ')}</span>
                  </div>

                  {/* Proposed time */}
                  {selected.proposed_scheduled_at && (
                    <div className="mt-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/30">
                      <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mb-0.5">Proposed new time</p>
                      <p className="text-[12px] text-amber-600 dark:text-amber-300">
                        {formatDate(selected.proposed_scheduled_at, 'EEE, MMM d yyyy · h:mm a')}
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  {selected.notes && (
                    <div className="pt-3 border-t border-slate-200 dark:border-white/[0.06]">
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Notes</p>
                      <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">{selected.notes}</p>
                    </div>
                  )}

                  {/* Meeting link */}
                  {selected.meeting_link && (
                    <div className="pt-2">
                      <a
                        href={selected.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[12px] font-medium text-cyan-700 dark:text-cyan-400 hover:text-cyan-600 transition-colors"
                      >
                        <Video size={13} />
                        Join meeting
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center mb-3">
                  <Calendar className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Select an event</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Click on an event to see details</p>
              </div>
            )}

            {/* ── Day events list ── */}
           
          </div>
        </div>

        {/* ━━━ CREATE SCHEDULE MODAL ━━━ */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <div className="relative w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/10 dark:bg-cyan-900/20 flex items-center justify-center">
                    <Calendar size={18} className="text-cyan-950 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-slate-900 dark:text-white">Create Schedule</h2>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">Fill in the data below to add a schedule</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreate} className="px-6 pb-6 space-y-4">
                {/* Participant */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Participant</label>
                  <select
                    value={formClient}
                    onChange={e => setFormClient(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.04] text-[13px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20 transition-colors"
                  >
                    <option value="">Select client…</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="date"
                        value={formDate}
                        onChange={e => setFormDate(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.04] text-[13px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Time</label>
                    <div className="relative">
                      <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="time"
                        value={formTime}
                        onChange={e => setFormTime(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.04] text-[13px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Meeting Type</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as 'video' | 'call' | 'chat')}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.04] text-[13px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20 transition-colors"
                  >
                    <option value="video">Video Call</option>
                    <option value="call">Phone Call</option>
                    <option value="chat">Chat</option>
                  </select>
                </div>

                {/* Meeting link */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Meeting Link</label>
                  <div className="relative">
                    <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="url"
                      value={formLink}
                      onChange={e => setFormLink(e.target.value)}
                      placeholder="https://meet.google.com/…"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.04] text-[13px] text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20 transition-colors"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Notes</label>
                  <textarea
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    rows={3}
                    placeholder="Agenda, topics to discuss…"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.04] text-[13px] text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20 transition-colors resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-5 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-white text-[13px] font-semibold transition-colors disabled:opacity-50"
                  >
                    {formLoading ? 'Saving…' : 'Save Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
