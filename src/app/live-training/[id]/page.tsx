'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useParams, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Signal, Play, Square, Users, MessageCircle, Send, Clock, CalendarDays, ExternalLink, ShieldCheck,CheckCircle2, XCircle,User,Video, } from 'lucide-react'
import {
  useLiveTrainingSession,
  useGoLive,
  useEndSession,
  useLiveTrainingRequests,
  useHandleJoinRequest,
  useLiveTrainingParticipants,
  useLiveTrainingChat,
  useSendLiveTrainingChat,
} from '@/lib/hooks'

const STATUS = {
  upcoming: { label: 'Upcoming', dot: 'bg-amber-400',                 badge: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  live:     { label: 'Live Now', dot: 'bg-emerald-400 animate-pulse', badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  ended:    { label: 'Ended',    dot: 'bg-slate-400',                 badge: 'bg-slate-400/10 text-slate-400 border-slate-400/20' },
}

const CAT_GRADIENT: Record<string, string> = {
  strength: 'from-orange-500 to-red-500',   cardio:     'from-rose-500 to-pink-500',
  hiit:     'from-amber-500 to-orange-500',  yoga:       'from-emerald-500 to-teal-500',
  pilates:  'from-sky-500 to-blue-500',      stretching: 'from-violet-500 to-purple-500',
  functional: 'from-cyan-500 to-blue-500',   other:      'from-slate-500 to-slate-600',
}

type Tab = 'chat' | 'participants' | 'requests'

const REQ_BADGE: Record<string, string> = {
  pending:  'bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400',
  approved: 'bg-green-100 dark:bg-green-400/10 text-green-600 dark:text-green-400',
  rejected: 'bg-red-100 dark:bg-red-400/10 text-red-500 dark:text-red-400',
}

const PANEL = 'bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08]'
const EMPTY = 'text-center text-[12px] text-slate-400 dark:text-slate-500 mt-10'

/* ── Shared Components ── */

function Avatar({ src, name }: { src?: string; name?: string }) {
  if (src) return <img src={src} alt={name} className="w-8 h-8 rounded-full object-cover" />
  return (
    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/[0.1] flex items-center justify-center">
      <User size={14} className="text-slate-400" />
    </div>
  )
}

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]">
      <Icon size={14} className="text-slate-400 dark:text-slate-500 mb-1.5" />
      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{value}</p>
    </div>
  )
}

/* ── Main Page ── */

export default function LiveTrainingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const { data: session, isLoading } = useLiveTrainingSession(id)

  const goLive     = useGoLive()
  const endSession = useEndSession()

  const handleReq  = useHandleJoinRequest(id)
  const { data: requests = [] }     = useLiveTrainingRequests(id)
  const { data: participants = [] } = useLiveTrainingParticipants(id)
  const { data: messages = [] }     = useLiveTrainingChat(id, session?.status === 'live')
  const sendChat                    = useSendLiveTrainingChat(id)

  const pendingCount = requests.filter((r: any) => r.status === 'pending').length

  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const [msg, setMsg]             = useState('')
  const chatEndRef                = useRef<HTMLDivElement>(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send  = () => { if (!msg.trim()) return; sendChat.mutate(msg.trim()); setMsg('') }
  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-slate-500 dark:text-slate-400 text-[13px]">Session not found.</div>
      </DashboardLayout>
    )
  }

  const st         = STATUS[session.status as keyof typeof STATUS]
  const isLive     = session.status === 'live'
  const isUpcoming = session.status === 'upcoming'

  const infoCards = [
    { icon: CalendarDays, label: 'Scheduled', value: session.scheduled_at ? new Date(session.scheduled_at).toLocaleDateString() : '—' },
    { icon: Clock,        label: 'Duration',  value: `${session.duration_min} min` },
    { icon: Users,        label: 'Participants', value: `${session.participant_count}${session.max_participants ? `/${session.max_participants}` : ''}` },
    { icon: ShieldCheck,  label: 'Approval',  value: session.requires_approval ? 'Required' : 'Open' },
  ]

  const tabs: { key: Tab; icon: any; label: string }[] = [
    { key: 'chat',         icon: MessageCircle, label: 'Chat' },
    { key: 'participants', icon: Users,         label: `People (${participants.length})` },
    { key: 'requests',     icon: ShieldCheck,   label: `Requests${pendingCount ? ` (${pendingCount})` : ''}` },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/live-training" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">
              <ArrowLeft size={18} className="text-slate-500 dark:text-slate-400" />
            </Link>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${CAT_GRADIENT[session.category] ?? CAT_GRADIENT.other} flex items-center justify-center`}>
              <Signal size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{session.title}</h1>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.badge}`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${st.dot}`} />
                  {st.label}
                </span>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
                {session.category} · {session.level} · {session.duration_min} min
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {session.meeting_link && (
              <a href={session.meeting_link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold rounded-xl border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors">
                <ExternalLink size={13} /> Meeting Link
              </a>
            )}
            {isUpcoming && (
              <button onClick={() => goLive.mutateAsync(id).then(() => router.refresh())} disabled={goLive.isPending}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-cyan-950 hover:from-cyan-400 hover:to-cyan-500 text-white text-[12px] font-semibold rounded-sm transition-all">
                <Play size={13} /> Go Live
              </button>
            )}
            {isLive && (
              <button onClick={() => endSession.mutateAsync(id).then(() => router.refresh())} disabled={endSession.isPending}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white text-[12px] font-semibold rounded-xl shadow-lg shadow-red-600/25 transition-all">
                <Square size={13} /> End Session
              </button>
            )}
          </div>
        </div>

        {/* Main Grid: Video + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video / Main Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative overflow-hidden aspect-video flex items-center justify-center bg-[#171717]">
              <div className="absolute inset-0 bg-[#171717]" />
              <div className="relative text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center">
                  <Video size={28} className="text-slate-400" />
                </div>
                {isLive && session.meeting_link ? (
                  <a href={session.meeting_link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-950 text-white text-[13px] font-semibold rounded-xl shadow-lg">
                    <ExternalLink size={14} /> Open Meeting
                  </a>
                ) : (
                  <p className={`text-[13px] ${isUpcoming || isLive ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isUpcoming ? 'Session starts when you go live' : isLive ? 'Live session in progress' : 'Session has ended'}
                  </p>
                )}
              </div>
              {isLive && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/90 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-[11px] font-semibold text-white">LIVE</span>
                </div>
              )}
            </div>

            <div className={`${PANEL} rounded-2xl p-5`}>
              <h3 className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-3">Session Info</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {infoCards.map(c => <InfoCard key={c.label} {...c} />)}
              </div>
              {session.description && (
                <p className="mt-4 text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">{session.description}</p>
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-0">
            <div className={`flex ${PANEL} overflow-hidden`}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-semibold transition-colors ${
                    activeTab === t.key
                      ? 'text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-600 dark:border-cyan-400'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}>
                  <t.icon size={13} /> {t.label}
                </button>
              ))}
            </div>

            <div className={`${PANEL} border-t-0 min-h-[400px] flex flex-col`}>

              {/* Chat */}
              {activeTab === 'chat' && (
                <div className="flex flex-col flex-1">
                  <div className="flex-1 overflow-y-auto max-h-[420px] p-4 space-y-3">
                    {messages.length === 0 && <p className={EMPTY}>No messages yet</p>}
                    {messages.map((m: any) => (
                      <div key={m.id} className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-600 to-cyan-950 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-semibold text-white">{m.sender_name?.[0] ?? '?'}</span>
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{m.sender_name}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {m.sent_at ? new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            {m.sender_role === 'coach' && (
                              <span className="text-[9px] bg-cyan-950/10 dark:bg-cyan-400/10 text-cyan-700 dark:text-cyan-400 px-1.5 py-0.5 rounded font-semibold">Coach</span>
                            )}
                          </div>
                          <p className="text-[12px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{m.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {isLive && (
                    <div className="p-3 border-t border-slate-200 dark:border-white/[0.08]">
                      <div className="flex gap-2">
                        <input type="text" value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={onKey} placeholder="Type a message…"
                          className="flex-1 px-3 py-2 text-[12px] rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20" />
                        <button onClick={send} disabled={!msg.trim() || sendChat.isPending}
                          className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-950 text-white shadow disabled:opacity-40 transition-opacity">
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Participants */}
              {activeTab === 'participants' && (
                <div className="p-4 space-y-2 overflow-y-auto max-h-[460px]">
                  {participants.length === 0 && <p className={EMPTY}>No participants yet</p>}
                  {participants.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                      <Avatar src={p.photo} name={p.name} />
                      <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">{p.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Requests */}
              {activeTab === 'requests' && (
                <div className="p-4 space-y-2 overflow-y-auto max-h-[460px]">
                  {requests.length === 0 && <p className={EMPTY}>No join requests</p>}
                  {requests.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={r.client_photo} name={r.client_name} />
                        <div>
                          <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">{r.client_name}</span>
                          <span className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded ${REQ_BADGE[r.status] ?? ''}`}>{r.status}</span>
                        </div>
                      </div>
                      {r.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleReq.mutate({ requestId: r.id, action: 'approved' })}
                            className="p-1.5 rounded-lg bg-green-100 dark:bg-green-400/10 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-400/20 transition-colors"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                          <button
                            onClick={() => handleReq.mutate({ requestId: r.id, action: 'rejected' })}
                            className="p-1.5 rounded-lg bg-red-100 dark:bg-red-400/10 text-red-500 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-400/20 transition-colors"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
