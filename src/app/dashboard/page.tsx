'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useClients, useCheckins, useMessages, useSendMessage, useWorkoutPlans } from '@/lib/hooks'
import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Users, Calendar, TrendingUp, Star, Clock, Plus, ArrowRight,
  ArrowUpRight, MoreHorizontal, Dumbbell, ChevronRight,
  MessageSquare, ArrowLeft, Send,
} from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { formatDate, parseDateValue } from '@/lib/utils'
import type { Client, Message, WorkoutPlan } from '@/types'

const ClientAnalyticsChart = dynamic(() => import('@/components/charts/ClientAnalyticsChart'), { ssr: false })
const MiniCalendar         = dynamic(() => import('@/components/charts/MiniCalendar'), { ssr: false })

/* ── Stat Card ────────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, change, changeLabel, gradient }: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  change?: string
  changeLabel?: string
  gradient: string
}) {
  return (
    <div className="relative group overflow-hidden bg-white border border-slate-200/80 dark:bg-[#171717] dark:border-white/[0.08] p-5 transition-all duration-300 hover:border-slate-300 hover:shadow-lg dark:hover:border-white/[0.12] dark:hover:shadow-dark-glow">
      {/* Gradient accent line at top */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 flex items-center justify-center ${gradient} shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-400/10 px-2.5 py-1">
            <ArrowUpRight className="w-3 h-3" />
            {change}
          </span>
        )}
      </div>
      <p className="text-[28px] font-semibold text-slate-900 dark:text-white tracking-tight leading-none">{value}</p>
      <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1.5">{label}</p>
      {changeLabel && <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">{changeLabel}</p>}
    </div>
  )
}

/* ── Active Clients Cards ─────────────────────────────────────────────────── */
function ActiveClientsCards({ clients }: { clients: Client[] }) {
  const activeClients = clients.filter(c => c.active)

  return (
    <div className="bg-white border border-slate-200/80 dark:bg-[#171717] dark:border-white/[0.08] p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Active Clients
          {activeClients.length > 0 && (
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400 px-2 py-0.5">
              {activeClients.length}
            </span>
          )}
        </h2>
        <Link href="/clients" className="text-xs text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 flex items-center gap-1 transition-colors">
          See all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {activeClients.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
            <Users className="w-5 h-5 text-slate-500" />
          </div>
          <p className="text-sm text-slate-400 mb-1">No active clients</p>
          <Link href="/clients/new" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
            Add your first client →
          </Link>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {activeClients.slice(0, 8).map(client => (
            <div
              key={client.id}
              className="flex-shrink-0 w-[220px] bg-slate-50 border border-slate-200 hover:border-slate-300 dark:bg-[#171717] dark:border-white/[0.08] dark:hover:border-white/[0.14] transition-all duration-200 flex flex-col overflow-hidden group"
            >
              {/* Top: Avatar + Name + Badge */}
              <div className="p-4 pb-3 flex items-start gap-3">
                {client.profile_photo_url ? (
                  <img src={client.profile_photo_url} alt={client.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-200 dark:ring-white/[0.08] flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-base font-semibold flex-shrink-0 ring-2 ring-slate-200 dark:ring-white/[0.08]">
                    {client.name[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{client.name}</p>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400">
                    Active
                  </span>
                </div>
              </div>

              {/* Date row */}
              <div className="px-4 pb-2 flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-3 h-3" />
                <span className="text-[11px]">
                  {client.created_at ? formatDate(client.created_at, 'dd MMM, h:mma') : 'No date'}
                </span>
              </div>

              {/* Description / notes */}
              <div className="px-4 pb-3 flex-1">
                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                  {client.notes || client.email || 'No additional information available for this client.'}
                </p>
              </div>

              {/* Bottom actions */}
              <div className="px-4 pb-4 flex items-center gap-2">
                <Link
                  href={`/clients/${client.id}`}
                  className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 dark:text-emerald-400 text-xs font-semibold text-center transition-colors"
                >
                  View Profile
                </Link>
                <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-neutral-500 dark:hover:text-white dark:hover:bg-white/[0.08] transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Analytics Chart Section ──────────────────────────────────────────────── */
function AnalyticsSection({ workoutPlans }: { workoutPlans: WorkoutPlan[] }) {
  const [period, setPeriod] = useState<'week' | 'month'>('week')

  const chartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const now = new Date()
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
    startOfWeek.setHours(0, 0, 0, 0)

    return days.map((dayName, i) => {
      const dayDate = new Date(startOfWeek)
      dayDate.setDate(startOfWeek.getDate() + i)
      const dateStr = dayDate.toISOString().split('T')[0]

      let total = 0
      let completed = 0

      workoutPlans.forEach(plan => {
        plan.days?.forEach(d => {
          if (d.day?.toLowerCase() === dayName.toLowerCase() || d.day === dateStr) {
            total += d.exercises?.length ?? 0
          }
        })
        if (plan.status === 'completed') {
          plan.days?.forEach(d => {
            if (d.day?.toLowerCase() === dayName.toLowerCase() || d.day === dateStr) {
              completed += d.exercises?.length ?? 0
            }
          })
        }
      })

      return { day: dayName, completed, total }
    })
  }, [workoutPlans])

  return (
    <div className="bg-white border border-slate-200/80 dark:bg-[#171717] dark:border-white/[0.08] p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          Workout Completion
        </h2>
        <div className="flex items-center bg-slate-100 dark:bg-white/[0.06] p-0.5">
          {(['week', 'month'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-[11px] font-medium transition-all duration-200 capitalize ${
                period === p
                  ? 'bg-cyan-950 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <ClientAnalyticsChart data={chartData} />
    </div>
  )
}



/* ── Right Sidebar: Calendar ──────────────────────────────────────────────── */
function CalendarWidget() {
  return (
    <div className="bg-white border border-slate-200/80 dark:bg-[#171717] dark:border-white/[0.08] p-5">
      <MiniCalendar />
    </div>
  )
}

/* ── Right Sidebar: Messages ──────────────────────────────────────────────── */
function MessagesWidget({ clients }: { clients: Client[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedClient = clients.find((c: Client) => c.id === selectedId)
  const { data: threadData, isLoading: loadingMsgs } = useMessages(selectedId ?? '')
  const messages: Message[] = (threadData as any)?.data ?? []
  const { mutate: send, isPending } = useSendMessage()
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!draft.trim() || !selectedId) return
    send({ client_id: selectedId, content: draft.trim() })
    setDraft('')
  }

  return (
    <div className="bg-white border border-slate-200/80 dark:bg-[#171717] dark:border-white/[0.08] overflow-hidden flex flex-col h-[420px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between flex-shrink-0">
        {!selectedId ? (
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            Messages
            {clients.length > 0 && (
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 px-2 py-0.5">
                {clients.length}
              </span>
            )}
          </h2>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedId(null)}
              className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[9px] font-semibold flex-shrink-0">
              {selectedClient?.name[0]?.toUpperCase()}
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{selectedClient?.name}</p>
          </div>
        )}
        {selectedId && (
          <Link href={`/clients/${selectedId}`} className="text-[10px] text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex-shrink-0">
            Profile →
          </Link>
        )}
      </div>

      {/* Client list or thread */}
      {!selectedId ? (
        <div className="flex-1 overflow-y-auto">
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-500 py-8">
              <MessageSquare className="w-6 h-6 opacity-20" />
              <p className="text-xs">No conversations yet</p>
            </div>
          ) : clients.slice(0, 6).map((client: Client, i: number) => (
            <button
              key={client.id}
              onClick={() => setSelectedId(client.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors text-left ${
                i < Math.min(clients.length, 6) - 1 ? 'border-b border-slate-100 dark:border-white/[0.06]' : ''
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                {client.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{client.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{client.email || 'No email'}</p>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
            </button>
          ))}
          {clients.length > 6 && (
            <Link href="/messages" className="block text-center text-[10px] text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 py-2 border-t border-slate-100 dark:border-white/[0.06]">
              View all messages →
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Message thread */}
          <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2">
            {loadingMsgs ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                  <div className={`h-7 animate-pulse ${i % 2 ? 'w-28 bg-blue-100 dark:bg-blue-900/20' : 'w-32 bg-slate-100 dark:bg-white/[0.05]'}`} />
                </div>
              ))
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-500 py-6">
                <MessageSquare className="w-5 h-5 opacity-20" />
                <p className="text-[11px]">No messages yet</p>
                <p className="text-[10px] text-slate-500/60">Send the first message below</p>
              </div>
            ) : messages.slice(-15).map((msg: Message) => {
              const isCoach = msg.sender_role === 'coach'
              const time = msg.sent_at ? formatDate(msg.sent_at, 'h:mm a') : ''
              return (
                <div key={msg.id} className={`flex ${isCoach ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%]">
                    <div className={`px-3 py-1.5 text-[12px] leading-relaxed ${
                      isCoach
                        ? 'bg-cyan-950 text-white'
                        : 'bg-slate-100 text-slate-700 dark:bg-white/[0.08] dark:text-neutral-200'
                    }`}>
                      {msg.content}
                    </div>
                    <p className={`text-[9px] text-slate-500 mt-0.5 px-1 ${isCoach ? 'text-right' : ''}`}>{time}</p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Compose bar */}
          <div className="border-t border-slate-200 dark:border-white/[0.08] flex-shrink-0 px-3 py-2 flex gap-2">
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type a message…"
              className="flex-1 bg-slate-50 dark:bg-white/[0.06] px-3 py-1.5 text-[12px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-cyan-700/30 border border-slate-200 dark:border-white/[0.08]"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || isPending}
              className="w-8 h-8 bg-cyan-950 hover:bg-cyan-900 disabled:opacity-40 flex items-center justify-center text-white flex-shrink-0 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Quick Action Buttons ─────────────────────────────────────────────────── */
function QuickActions() {
  const actions = [
    { href: '/clients/new',             label: 'Add Client',    icon: Users,    color: 'from-blue-500 to-blue-600' },
    { href: '/workout-plans/group/new', label: 'Group Plan',    icon: Dumbbell, color: 'from-purple-500 to-purple-600' },
    { href: '/checkins/new',            label: 'Schedule',      icon: Calendar, color: 'from-emerald-500 to-emerald-600' },
  ]

  return (
    <div className="flex items-center gap-2">
      {actions.map(({ href, label, icon: Icon, color }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 dark:bg-white/[0.06] dark:border-white/[0.08] dark:hover:border-white/[0.14] dark:hover:bg-white/[0.08] text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all duration-200 group"
        >
          <div className={`w-5 h-5 bg-gradient-to-br ${color} flex items-center justify-center`}>
            <Icon className="w-3 h-3 text-white" />
          </div>
          {label}
        </Link>
      ))}
    </div>
  )
}

/* ── Main Dashboard Page ──────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { data: clientsData } = useClients()
  const { data: checkins }    = useCheckins()
  const { data: workoutData } = useWorkoutPlans()

  const clients      = clientsData?.data ?? []
  const totalClients = clientsData?.pagination?.total ?? 0
  const workoutPlans: WorkoutPlan[] = (workoutData as any)?.data ?? workoutData ?? []
  const now          = Date.now()
  const upcoming     = (checkins ?? []).filter(c => {
    const d = parseDateValue(c.scheduled_at)
    return d !== null && d.getTime() > now
  })

  return (
    <DashboardLayout>

      {/* Quick Actions Row */}
      <div className="flex items-center justify-between mb-6">
        <QuickActions />
        <Link
          href="/clients"
          className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors"
        >
          All Clients <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Users}
          label="Total Clients"
          value={totalClients}
          change="+12%"
          changeLabel="vs last month"
          gradient="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        <StatCard
          icon={Star}
          label="Coach Rating"
          value="4.8"
          change="+0.3"
          changeLabel="from reviews"
          gradient="bg-gradient-to-r from-amber-500 to-orange-500"
        />
        <StatCard
          icon={Clock}
          label="Avg Session"
          value="45m"
          changeLabel="per appointment"
          gradient="bg-gradient-to-r from-emerald-500 to-teal-500"
        />
        <StatCard
          icon={Calendar}
          label="Upcoming"
          value={upcoming.length}
          change={upcoming.length > 0 ? 'Next today' : undefined}
          changeLabel="scheduled events"
          gradient="bg-gradient-to-r from-purple-500 to-indigo-500"
        />
      </div>

      {/* Main Content Grid: Left (main) + Right (sidebar) */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Left / Main Area */}
        <div className="space-y-6">
          <ActiveClientsCards clients={clients} />
          <AnalyticsSection workoutPlans={workoutPlans} />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <CalendarWidget />
          <MessagesWidget clients={clients} />
        </div>
      </div>
    </DashboardLayout>
  )
}

