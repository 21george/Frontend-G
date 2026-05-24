'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useParams, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Play, Square, Users, Send, ExternalLink, ShieldCheck,
  CheckCircle2, XCircle, Video, VideoOff, Mic, MicOff, PhoneOff,
  Volume2, Maximize2, Settings, Sparkles, UserPlus, User,
} from 'lucide-react'
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

type Tab = 'Messages' | 'Participants' | 'Requests'

const REQ_BADGE: Record<string, string> = {
  pending:  'text-amber-600 dark:text-amber-400',
  approved: 'text-green-600 dark:text-green-400',
  rejected: 'text-red-500 dark:text-red-400',
}

const WAVE_HEIGHTS = [40, 70, 55, 90, 65, 45, 80, 60]

function useSessionTimer(active: boolean) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    if (!active) { setSecs(0); return }
    const t = setInterval(() => setSecs(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [active])
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return `${m}:${s}`
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

  const [activeTab, setActiveTab] = useState<Tab>('Messages')
  const [msg, setMsg]             = useState('')
  const [micOn, setMicOn]         = useState(true)
  const [camOn, setCamOn]         = useState(true)
  const chatEndRef                = useRef<HTMLDivElement>(null)

  const isLive     = session?.status === 'live'
  const isUpcoming = session?.status === 'upcoming'
  const timer      = useSessionTimer(!!isLive)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send  = () => { if (!msg.trim()) return; sendChat.mutate(msg.trim()); setMsg('') }
  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-[var(--text-secondary)] text-[13px]">Session not found.</div>
      </DashboardLayout>
    )
  }

  const invitedCount = session.participant_count ?? participants.length
  const absentCount  = session.max_participants ? Math.max(0, session.max_participants - participants.length) : 0
  const lastMsg      = messages[messages.length - 1]

  const tabs: Tab[] = ['Messages', 'Participants', 'Requests']

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 5rem)' }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/live-training"
              className="w-8 h-8 flex items-center justify-center rounded-full border border-[var(--border)] dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">
              <ArrowLeft size={15} className="text-[var(--text-secondary)]" />
            </Link>
            <h1 className="text-[15px] font-semibold text-[var(--text-primary)] truncate max-w-xs">{session.title}</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-white/[0.06] rounded-full text-[11px] font-semibold text-[var(--text-tertiary)] dark:text-slate-400">
              <Users size={11} /> Team
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 text-[12px] text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5">
                <Users size={13} className="text-slate-400" />
                Invited to the call: <strong className="text-[var(--text-primary)] ml-1">{invitedCount}</strong>
              </span>
              {session.max_participants && (
                <span className="flex items-center gap-1.5">
                  <User size={13} className="text-slate-400" />
                  Absent people: <strong className="text-[var(--text-primary)] ml-1">{absentCount}</strong>
                </span>
              )}
            </div>

            {session.meeting_link && (
              <a href={session.meeting_link} target="_blank" rel="noopener noreferrer"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold border border-slate-200 dark:border-white/[0.1] rounded-lg text-[var(--text-secondary)] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors">
                <ExternalLink size={13} /> Meeting Link
              </a>
            )}

            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-[12px] font-semibold rounded-lg transition-colors">
              <UserPlus size={13} /> Add user to the call
            </button>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex flex-1 gap-4 min-h-0">

          {/* ── Video Panel ── */}
          <div className="flex-1 flex flex-col rounded-2xl overflow-hidden bg-[#1c1f23] min-h-0 relative">

            {/* Speaker label top-left */}
            {participants.length > 0 && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-xl px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                  {(participants[0]?.name ?? 'C')[0]}
                </div>
                <div className="leading-none">
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Coach</p>
                  <p className="text-[12px] font-semibold text-white">{participants[0]?.name ?? 'Coach'}</p>
                </div>
              </div>
            )}

            {/* Timer top-right (before thumbnails) */}
            {isLive && (
              <div className="absolute top-4 z-10 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-xl px-3 py-2"
                style={{ right: participants.length > 1 ? '148px' : '16px' }}>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[13px] font-mono font-semibold text-white">{timer}</span>
              </div>
            )}

            {/* LIVE badge */}
            {isLive && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-red-500 rounded px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-bold text-white tracking-wider">LIVE</span>
              </div>
            )}

            {/* Main video fill */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#23272b] via-[#2a2d32] to-[#1c1f23]" />

              {!isLive && (
                <div className="relative z-10 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-white/[0.06] border border-white/[0.1] rounded-2xl flex items-center justify-center">
                    <Video size={28} className="text-[var(--text-tertiary)]" />
                  </div>
                  <p className="text-[13px] text-slate-400">
                    {isUpcoming ? 'Session starts when you go live' : 'Session has ended'}
                  </p>
                  {isUpcoming && (
                    <button onClick={() => goLive.mutateAsync(id).then(() => router.refresh())} disabled={goLive.isPending}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-[13px] font-semibold rounded-xl shadow-lg shadow-emerald-500/30 transition-all">
                      <Play size={14} /> Go Live
                    </button>
                  )}
                </div>
              )}

              {/* Participant thumbnails stacked on the right */}
              {participants.length > 1 && (
                <div className="absolute right-3 top-3 bottom-3 flex flex-col gap-2 z-10 justify-start">
                  {participants.slice(1, 5).map((p: any) => (
                    <div key={p.id}
                      className="w-[128px] h-[84px] rounded-xl overflow-hidden bg-[#2a2d32] border border-white/[0.1] flex items-center justify-center relative">
                      {p.photo
                        ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                        : (
                          <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                            <span className="text-[14px] font-semibold text-white">{p.name?.[0] ?? '?'}</span>
                          </div>
                        )
                      }
                      <div className="absolute inset-x-0 bottom-0 px-2 py-1 bg-gradient-to-t from-black/70 to-transparent">
                        <span className="text-[9px] text-white font-semibold">{p.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transcription bar */}
            {isLive && (
              <div className="flex items-center gap-3 px-5 py-2.5 bg-black/40 border-t border-white/[0.06] flex-shrink-0">
                <div className="flex items-end gap-[3px] h-4 shrink-0">
                  {WAVE_HEIGHTS.map((h, i) => (
                    <div key={i} className="w-[3px] rounded-full bg-brand-400 animate-pulse"
                      style={{ height: `${h}%`, animationDelay: `${i * 120}ms` }} />
                  ))}
                </div>
                <span className="text-[11px] text-slate-300 italic truncate">
                  {lastMsg?.content ?? 'Listening…'}
                </span>
              </div>
            )}

            {/* Call controls */}
            <div className="flex items-center justify-center gap-3 px-6 py-4 bg-[#1c1f23] flex-shrink-0">
              <CtrlBtn onClick={() => {}}><Volume2 size={16} /></CtrlBtn>
              <CtrlBtn onClick={() => {}}><Maximize2 size={16} /></CtrlBtn>

              <CtrlBtn onClick={() => setMicOn(v => !v)} active={!micOn} danger={!micOn}>
                {micOn ? <Mic size={16} /> : <MicOff size={16} />}
              </CtrlBtn>

              {/* Primary action — centre big button */}
              {isLive ? (
                <button onClick={() => endSession.mutateAsync(id).then(() => router.refresh())}
                  disabled={endSession.isPending}
                  className="w-14 h-14 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-400 text-white shadow-xl shadow-red-500/40 transition-all">
                  <PhoneOff size={20} />
                </button>
              ) : isUpcoming ? (
                <button onClick={() => goLive.mutateAsync(id).then(() => router.refresh())}
                  disabled={goLive.isPending}
                  className="w-14 h-14 rounded-full flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl shadow-emerald-500/40 transition-all">
                  <Play size={20} />
                </button>
              ) : (
                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white/[0.06] text-[var(--text-secondary)]">
                  <Square size={18} />
                </div>
              )}

              <CtrlBtn onClick={() => setCamOn(v => !v)} danger={!camOn}>
                {camOn ? <Video size={16} /> : <VideoOff size={16} />}
              </CtrlBtn>
              <CtrlBtn onClick={() => {}}><Sparkles size={16} /></CtrlBtn>
              <CtrlBtn onClick={() => {}}><Settings size={16} /></CtrlBtn>
            </div>
          </div>

          {/* ── Chat / Participants Panel ── */}
          <div className="w-[300px] xl:w-[320px] flex-shrink-0 flex flex-col bg-white dark:bg-white/[0.03] border border-[var(--border)] dark:border-white/[0.08] rounded-2xl overflow-hidden">

            {/* Panel header + tabs */}
            <div className="px-4 pt-4 flex-shrink-0">
              <h2 className="text-[14px] font-semibold text-[var(--text-primary)] mb-3">Group Chat</h2>
              <div className="flex border-b border-[var(--border)] dark:border-white/[0.08]">
                {tabs.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-3 pb-2 text-[11px] font-semibold transition-colors border-b-2 -mb-px ${
                      activeTab === tab
                        ? 'border-brand-600 dark:border-brand-400 text-brand-600 dark:text-brand-400'
                        : 'border-transparent text-slate-400 hover:text-[var(--text-secondary)] dark:hover:text-slate-300'
                    }`}>
                    {tab === 'Requests' && pendingCount > 0 ? `Requests (${pendingCount})` : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            {activeTab === 'Messages' && (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <p className="text-center text-[12px] text-slate-400 mt-10">No messages yet</p>
                  )}
                  {messages.map((m: any, i: number) => {
                    const isMe = m.sender_role === 'coach'
                    return (
                      <div key={m.id ?? i} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                          {m.sender_name?.[0] ?? '?'}
                        </div>
                        <div className={`flex flex-col max-w-[72%] ${isMe ? 'items-end' : 'items-start'}`}>
                          <span className="text-[10px] text-slate-400 mb-1">{isMe ? 'You' : m.sender_name}</span>
                          <div className={`px-3 py-2 rounded-2xl text-[12px] leading-relaxed ${
                            isMe
                              ? 'bg-brand-600 text-white rounded-tr-sm'
                              : 'bg-slate-100 dark:bg-white/[0.07] text-slate-700 dark:text-slate-300 rounded-tl-sm'
                          }`}>
                            {m.content}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Typing indicator — static, shows when session is live */}
                {isLive && (
                  <div className="px-4 py-1 flex items-center gap-2 flex-shrink-0">
                    <div className="flex gap-1">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                          style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 italic">is typing</span>
                  </div>
                )}

                {/* Input */}
                <div className="p-3 border-t border-[var(--border)] dark:border-white/[0.08] flex-shrink-0">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2">
                    <input
                      type="text" value={msg}
                      onChange={e => setMsg(e.target.value)} onKeyDown={onKey}
                      placeholder="Write your message…" disabled={!isLive}
                      className="flex-1 bg-transparent text-[12px] text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none disabled:opacity-40"
                    />
                    <button onClick={send} disabled={!msg.trim() || sendChat.isPending || !isLive}
                      className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white disabled:opacity-40 transition-opacity hover:bg-brand-500">
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Participants */}
            {activeTab === 'Participants' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {participants.length === 0 && (
                  <p className="text-center text-[12px] text-slate-400 mt-10">No participants yet</p>
                )}
                {participants.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-[#13131314] dark:hover:bg-white/[0.04] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-600/20 flex items-center justify-center text-[12px] font-semibold text-brand-700 dark:text-brand-300">
                      {p.name?.[0] ?? '?'}
                    </div>
                    <span className="text-[12px] font-medium text-[var(--text-primary)] flex-1">{p.name}</span>
                    {isLive && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                  </div>
                ))}
              </div>
            )}

            {/* Requests */}
            {activeTab === 'Requests' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {requests.length === 0 && (
                  <p className="text-center text-[12px] text-slate-400 mt-10">No join requests</p>
                )}
                {requests.map((r: any) => (
                  <div key={r.id} className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-[var(--border)] dark:border-white/[0.06]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-600/20 flex items-center justify-center text-[11px] font-semibold text-brand-700 dark:text-brand-300 shrink-0">
                          {r.client_name?.[0] ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">{r.client_name}</p>
                          <p className={`text-[10px] font-semibold capitalize ${REQ_BADGE[r.status] ?? 'text-slate-400'}`}>{r.status}</p>
                        </div>
                      </div>
                      {r.status === 'pending' && (
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => handleReq.mutate({ requestId: r.id, action: 'approved' })}
                            className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-400/10 text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-400/20 transition-colors">
                            <CheckCircle2 size={13} />
                          </button>
                          <button onClick={() => handleReq.mutate({ requestId: r.id, action: 'rejected' })}
                            className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-400/10 text-red-500 dark:text-red-400 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-400/20 transition-colors">
                            <XCircle size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

/* ── Small helper: control button ── */
function CtrlBtn({
  children, onClick, danger = false, active = false,
}: {
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
  active?: boolean
}) {
  return (
    <button onClick={onClick}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
        danger || active
          ? 'bg-red-500 text-white hover:bg-red-400'
          : 'bg-white/[0.08] text-white hover:bg-white/[0.16]'
      }`}>
      {children}
    </button>
  )
}
