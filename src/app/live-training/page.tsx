'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import {
  Plus, Search, Radio, Clock, CheckCircle2, Users, Play,
  Flame, Heart, Zap, Dumbbell, Filter,
  ArrowUpRight, Sparkles, Timer, Signal, TrendingUp,
} from 'lucide-react'
import { useLiveTrainingSessions, useGoLive, useEndSession, useDeleteLiveTraining } from '@/lib/hooks'
import { parseDateValue } from '@/lib/utils'
import { format } from 'date-fns'
import type { LiveTrainingSession } from '@/types'

/* ── Category config ─────────────────────────────────────────────────────── */
const CATEGORY_CONFIG: Record<string, { icon: typeof Flame; gradient: string; glow: string }> = {
  strength:    { icon: Dumbbell,    gradient: 'from-orange-500 to-red-500',     glow: 'shadow-orange-500/20' },
  cardio:      { icon: Heart,       gradient: 'from-rose-500 to-pink-500',      glow: 'shadow-rose-500/20' },
  hiit:        { icon: Zap,         gradient: 'from-amber-500 to-orange-500',   glow: 'shadow-amber-500/20' },
  yoga:        { icon: Sparkles,    gradient: 'from-violet-500 to-purple-500',  glow: 'shadow-violet-500/20' },
  pilates:     { icon: TrendingUp,  gradient: 'from-teal-500 to-emerald-500',   glow: 'shadow-teal-500/20' },
  stretching:  { icon: Heart,       gradient: 'from-sky-500 to-blue-500',       glow: 'shadow-sky-500/20' },
  functional:  { icon: Flame,       gradient: 'from-lime-500 to-green-500',     glow: 'shadow-lime-500/20' },
  other:       { icon: Radio,       gradient: 'from-slate-500 to-slate-600',    glow: 'shadow-slate-500/20' },
}

const LEVEL_BADGE: Record<string, string> = {
  beginner:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  intermediate: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  advanced:     'bg-red-500/15 text-red-400 border-red-500/20',
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  live:     { label: 'Live Now',  dot: 'bg-green-400 animate-pulse', badge: 'bg-green-500/15 text-green-400 border-green-500/20' },
  upcoming: { label: 'Upcoming',  dot: 'bg-amber-400',               badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  ended:    { label: 'Ended',     dot: 'bg-slate-500',               badge: 'bg-slate-500/15 text-slate-400 border-slate-500/20' },
}

const FILTER_CLS = 'px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-[12px] font-medium text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20'
const TH_CLS = 'text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider'
const TABLE_HEADERS = ['Class Name', 'Category', 'Level', 'Duration', 'Time', 'Participants', 'Action']

const FILTERS = [
  { key: 'status',   label: 'All Status',     options: [['live','Live Now'],['upcoming','Upcoming'],['ended','Ended']] },
  { key: 'category', label: 'All Categories', options: [['strength','Strength'],['cardio','Cardio'],['hiit','HIIT'],['yoga','Yoga'],['pilates','Pilates'],['stretching','Stretching'],['functional','Functional'],['other','Other']] },
  { key: 'level',    label: 'All Levels',     options: [['beginner','Beginner'],['intermediate','Intermediate'],['advanced','Advanced']] },
] as const

/* ══════════════════════════════════════════════════════════════════════════ */
export default function LiveTrainingPage() {
  const { data: sessions, isLoading } = useLiveTrainingSessions()
  const goLive       = useGoLive()
  const endSession   = useEndSession()
  const deleteMut    = useDeleteLiveTraining()

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({ status: 'all', category: 'all', level: 'all' })
  const setFilter = (key: string, val: string) => setFilters(f => ({ ...f, [key]: val }))

  /* ── Stats ── */
  const stats = useMemo(() => {
    const all = sessions ?? []
    return {
      live:     all.filter(s => s.status === 'live').length,
      upcoming: all.filter(s => s.status === 'upcoming').length,
      ended:    all.filter(s => s.status === 'ended').length,
      total:    all.reduce((sum, s) => sum + s.participant_count, 0),
    }
  }, [sessions])

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    let list = sessions ?? []
    if (filters.status !== 'all')   list = list.filter(s => s.status === filters.status)
    if (filters.category !== 'all') list = list.filter(s => s.category === filters.category)
    if (filters.level !== 'all')    list = list.filter(s => s.level === filters.level)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s => s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q))
    }
    return list
  }, [sessions, filters, search])

  const getScheduleLabel = (s: LiveTrainingSession) => {
    const d = parseDateValue(s.scheduled_at ?? '')
    if (!d) return '—'
    return format(d, 'MMM d, h:mm a')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
              Live Training
            </h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
              Create and manage live workout sessions for your clients
            </p>
          </div>
          <Link
            href="/live-training/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-950 hover:from-cyan-500 hover:to-cyan-900 text-white text-[13px] font-semibold rounded-xl shadow-lg shadow-cyan-950/25 transition-all hover:shadow-xl hover:shadow-cyan-950/30 hover:-translate-y-0.5"
          >
            <Plus size={16} />
            New Session
          </Link>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Signal,       value: stats.live,     label: 'Live Now',           gradient: 'from-green-500 to-green-600',   glow: 'shadow-green-500/20', accent: 'from-green-500/10', hover: 'hover:border-green-500/30 hover:shadow-green-500/5', pulse: true },
            { icon: Clock,        value: stats.upcoming, label: 'Upcoming',           gradient: 'from-amber-500 to-amber-600',   glow: 'shadow-amber-500/20', accent: 'from-amber-500/10', hover: 'hover:border-amber-500/30 hover:shadow-amber-500/5', pulse: false },
            { icon: CheckCircle2, value: stats.ended,    label: 'Completed',          gradient: 'from-sky-500 to-sky-600',       glow: 'shadow-sky-500/20',   accent: 'from-sky-500/10',   hover: 'hover:border-sky-500/30 hover:shadow-sky-500/5',   pulse: false },
            { icon: Users,        value: stats.total,    label: 'Total Participants', gradient: 'from-violet-500 to-violet-600', glow: 'shadow-violet-500/20', accent: 'from-violet-500/10', hover: 'hover:border-violet-500/30 hover:shadow-violet-500/5', pulse: false },
          ].map(({ icon: Icon, value, label, gradient, glow, accent, hover, pulse }) => (
            <div key={label} className={`group relative overflow-hidden bg-white dark:bg-white/[0.04] p-5 backdrop-blur-sm transition-all hover:shadow-lg ${hover}`}>
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${accent} to-transparent rounded-bl-full`} />
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${glow}`}>
                  <Icon size={18} className="text-white" />
                </div>
                {pulse && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── FILTERS ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between  px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-slate-400" />
            {FILTERS.map(f => (
              <select key={f.key} value={filters[f.key]} onChange={e => setFilter(f.key, e.target.value)} className={FILTER_CLS}>
                <option value="all">{f.label}</option>
                {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ))}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search sessions…" value={search} onChange={e => setSearch(e.target.value)}
              className={`w-full sm:w-52 pl-9 pr-3 ${FILTER_CLS}`} />
          </div>
        </div>

        {/* ── SESSIONS TABLE ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-[13px] text-slate-500 dark:text-slate-400">Loading sessions…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center mb-4">
              <Radio className="w-7 h-7 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-[14px] font-medium text-slate-600 dark:text-slate-400">No sessions found</p>
            <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-1">Create your first live training session to get started</p>
            <Link
              href="/live-training/new"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-950 hover:bg-cyan-900 text-white text-[12px] font-semibold rounded-xl transition-colors"
            >
              <Plus size={14} />
              Create Session
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-white/[0.02]  dark:border-white/[0.08]  overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_140px] gap-4 px-5 py-3 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.06]">
              {TABLE_HEADERS.map((h, i) => <span key={h} className={`${TH_CLS}${i === TABLE_HEADERS.length - 1 ? ' text-right' : ''}`}>{h}</span>)}
            </div>

            {/* Table rows */}
            <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {filtered.map(session => {
                const catConf = CATEGORY_CONFIG[session.category] ?? CATEGORY_CONFIG.other
                const CatIcon = catConf.icon
                const statusConf = STATUS_CONFIG[session.status]
                const levelConf = LEVEL_BADGE[session.level] ?? LEVEL_BADGE.beginner

                return (
                  <div key={session.id} className="group grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_140px] gap-2 md:gap-4 items-center px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    {/* Class Name + Status */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${catConf.gradient} flex items-center justify-center shadow-lg ${catConf.glow} flex-shrink-0`}>
                        <CatIcon size={18} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">
                            {session.title}
                          </p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusConf.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                            {statusConf.label}
                          </span>
                        </div>
                        {session.description && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{session.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Category */}
                    <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300 capitalize hidden md:block">
                      {session.category}
                    </span>

                    {/* Level */}
                    <div className="hidden md:block">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${levelConf}`}>
                        {session.level}
                      </span>
                    </div>

                    {/* Duration */}
                    <div className="hidden md:flex items-center gap-1.5 text-[12px] text-slate-600 dark:text-slate-400">
                      <Timer size={13} className="text-slate-400 dark:text-slate-500" />
                      {session.duration_min} min
                    </div>

                    {/* Time */}
                    <span className="text-[12px] text-slate-600 dark:text-slate-400 hidden md:block">
                      {getScheduleLabel(session)}
                    </span>

                    {/* Participants */}
                    <div className="hidden md:flex items-center gap-1.5">
                      <Users size={13} className="text-slate-100 dark:text-slate-500" />
                      <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300">
                        {session.participant_count}
                        <span className="text-slate-400 dark:text-slate-500">/{session.max_participants}</span>
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2">
                      {session.status === 'upcoming' && (
                        <button
                          onClick={() => goLive.mutate(session.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-cyan-950 pointer-cursor text-white text-[11px] font-semibold rounded-lg shadow-sm shadow-green-500/20 hover:shadow-md hover:shadow-cyan-500/30 transition-all"
                        >
                          <Play size={11} />
                           Live
                        </button>
                      )}
                      {session.status === 'live' && (
                        <button
                          onClick={() => endSession.mutate(session.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[11px] font-semibold rounded-lg shadow-sm shadow-red-500/20 hover:shadow-md hover:shadow-red-500/30 transition-all"
                        >
                          End
                        </button>
                      )}
                      <Link
                        href={`/live-training/${session.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 text-[11px] font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-colors"
                      >
                        View
                        <ArrowUpRight size={11} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
