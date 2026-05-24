'use client'

import { useRef } from 'react'
import {
  Plus, Video, PhoneCall, Hash, ChevronDown, RefreshCw,
  MessageCircle, Wifi, WifiOff, Send,
} from 'lucide-react'
import type { CheckinMeeting, Client } from '@/types'
import { formatDate, timeAgo } from '@/lib/utils'

export type ScheduleFilter = 'Upcoming' | 'Ongoing' | 'Rescheduled' | 'Cancelled'
const FILTER_TABS: ScheduleFilter[] = ['Upcoming', 'Ongoing', 'Rescheduled', 'Cancelled']

function getStatusFilter(f: ScheduleFilter) {
  if (f === 'Upcoming')    return (c: CheckinMeeting) => c.status === 'scheduled' && c.client_response !== 'reschedule_requested'
  if (f === 'Ongoing')     return (c: CheckinMeeting) => c.status === 'completed'
  if (f === 'Rescheduled') return (c: CheckinMeeting) => c.client_response === 'reschedule_requested'
  return (c: CheckinMeeting) => c.status === 'cancelled'
}

interface Props {
  client: Client
  checkins: CheckinMeeting[] | undefined
  scheduleFilter: ScheduleFilter
  setScheduleFilter: (f: ScheduleFilter) => void
  activeChatId: string | null
  setActiveChatId: (id: string | null) => void
  allMessages: any[]
  msg: string
  setMsg: (v: string) => void
  onSend: () => void
  chatEndRef: React.RefObject<HTMLDivElement>
  socketConnected: boolean
  isDeleteCheckinPending: boolean
  onOpenScheduleModal: (date: Date) => void
  onReschedule: (meeting: CheckinMeeting) => void
  onCancel: (meeting: CheckinMeeting) => void
}

function getVideoRoom(c: CheckinMeeting) {
  return c.meeting_link || `https://meet.jit.si/CoachPro-${c.id.replace(/-/g, '')}`
}

export function ClientScheduleTab({
  client, checkins, scheduleFilter, setScheduleFilter,
  activeChatId, setActiveChatId,
  allMessages, msg, setMsg, onSend, chatEndRef,
  socketConnected, isDeleteCheckinPending,
  onOpenScheduleModal, onReschedule, onCancel,
}: Props) {
  const allCheckins = checkins ?? []
  const filtered = allCheckins.filter(getStatusFilter(scheduleFilter))

  const grouped = filtered.reduce<Record<string, CheckinMeeting[]>>((acc, c) => {
    const d = new Date(c.scheduled_at)
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    const key = isToday
      ? `Today, ${d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`
      : d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  const sortedGroups = Object.entries(grouped).sort(([, a], [, b]) =>
    new Date(a[0].scheduled_at).getTime() - new Date(b[0].scheduled_at).getTime()
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">Schedule</h3>
          <p className="text-[12px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)] mt-0.5">Manage all sessions and meetings for this client</p>
        </div>
        <button onClick={() => onOpenScheduleModal(new Date())}
          className="flex items-center gap-1.5 px-4 py-2 rounded-s-xl text-[12px] font-semibold bg-brand-600 cursor-pointer hover:bg-brand-700 text-white transition-colors self-start sm:self-auto">
          <Plus size={14} /> Create Appointment
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-0.5 overflow-x-auto pb-1 sm:pb-0">
          {FILTER_TABS.map(f => (
            <button key={f} onClick={() => setScheduleFilter(f)}
              className={`px-3 py-1.5 text-[12px] rounded-s-xl font-medium whitespace-nowrap transition-colors ${
                scheduleFilter === f
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-semibold'
                  : 'text-[var(--text-secondary)] dark:text-[var(--text-secondary)] hover:text-[var(--text-secondary)] dark:hover:text-slate-200 hover:bg-[#13131314] dark:hover:bg-white/[0.04]'
              }`}>{f}</button>
          ))}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
          {socketConnected
            ? <><Wifi size={10} className="text-emerald-400" /><span className="text-emerald-400">Live</span></>
            : <><WifiOff size={10} className="text-[var(--text-tertiary)]" /><span>Offline</span></>}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="mt-[12rem] p-12 text-center">
          <p className="text-[14px] font-medium text-[var(--text-secondary)] dark:text-[var(--text-secondary)] mb-1">No {scheduleFilter.toLowerCase()} meetings</p>
          <p className="text-[12px] text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)] mb-5">Schedule a new meeting to get started</p>
          <button onClick={() => onOpenScheduleModal(new Date())}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-[12px] rounded-s-xl font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors">
            <Plus size={14} /> Schedule First Meeting
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedGroups.map(([dateLabel, events]) => (
            <div key={dateLabel}>
              <p className="text-[13px] font-semibold text-[var(--text-secondary)] dark:text-[var(--text-secondary)] mb-3 pl-1">{dateLabel}</p>
              <div className="space-y-3">
                {events.map(c => {
                  const isExpanded = activeChatId === c.id
                  const chatOpen = activeChatId === `chat-${c.id}`
                  const statusColor = c.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400'
                    : c.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/25 text-red-700 dark:text-red-400'
                    : c.client_response === 'reschedule_requested' ? 'bg-amber-100 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400'
                    : 'bg-blue-100 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400'
                  const statusLabel = c.status === 'completed' ? 'Completed'
                    : c.status === 'cancelled' ? 'Cancelled'
                    : c.client_response === 'reschedule_requested' ? 'Rescheduled'
                    : c.client_response === 'accepted' ? 'Confirmed'
                    : c.client_response === 'declined' ? 'Declined'
                    : 'Upcoming'
                  const typeLabel = c.type === 'video' ? 'Video Call' : c.type === 'call' ? 'Phone Call' : 'Chat Session'
                  const endTime = new Date(new Date(c.scheduled_at).getTime() + 60 * 60 * 1000)

                  return (
                    <div key={c.id} className={`transition-all overflow-hidden ${isExpanded ? 'bg-[var(--bg-card)]' : 'border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)]'}`}>
                      {/* Card header */}
                      <div className="flex flex-col gap-3 p-4 sm:p-5 bg-[var(--bg-card)]">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${
                            c.type === 'video' ? 'bg-blue-100 dark:bg-blue-900/25' : c.type === 'call' ? 'bg-emerald-100 dark:bg-emerald-900/25' : 'bg-purple-100 dark:bg-purple-900/25'
                          }`}>
                            {c.type === 'video' ? <Video size={16} className="text-blue-600 dark:text-blue-400" />
                              : c.type === 'call' ? <PhoneCall size={16} className="text-emerald-600 dark:text-emerald-400" />
                              : <Hash size={16} className="text-purple-600 dark:text-purple-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)] leading-snug">{typeLabel}</p>
                            <p className="text-[12px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                              {c.notes || `Session with ${client?.name ?? 'client'}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold ${statusColor}`}>
                              <span className={`w-1.5 h-1.5 ${c.status === 'completed' ? 'bg-emerald-500' : c.status === 'cancelled' ? 'bg-red-500' : c.client_response === 'reschedule_requested' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                              {statusLabel}
                            </span>
                            <button onClick={() => setActiveChatId(isExpanded ? null : c.id)}
                              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-s-xl border border-[var(--border)] dark:border-white/[0.08] bg-[var(--bg-card)] dark:bg-white/[0.03] text-[11px] font-semibold text-[var(--text-secondary)] dark:text-slate-300 hover:bg-[#13131314] dark:hover:bg-white/[0.06] transition-colors">
                              View Details
                              <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        </div>
                        <button onClick={() => setActiveChatId(isExpanded ? null : c.id)}
                          className="sm:hidden flex items-center justify-center gap-1 px-3 py-1.5 border border-[var(--border)] dark:border-white/[0.08] bg-[var(--bg-card)] dark:bg-white/[0.03] text-[11px] font-semibold text-[var(--text-secondary)] dark:text-slate-300">
                          {isExpanded ? 'Hide Details' : 'View Details'}
                          <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="border-t border-[var(--border)] dark:border-white/[0.06]">
                          <div className="grid bg-[var(--bg-card)] grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-5">
                            <div className="space-y-3">
                              <div className="flex gap-6">
                                <div>
                                  <p className="text-[11px] font-semibold text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)] uppercase tracking-wider">Start</p>
                                  <p className="text-[13px] font-medium text-[var(--text-primary)] dark:text-white mt-0.5">{formatDate(c.scheduled_at, 'h:mm a')}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-semibold text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)] uppercase tracking-wider">End</p>
                                  <p className="text-[13px] font-medium text-[var(--text-primary)] dark:text-white mt-0.5">{formatDate(endTime.toISOString(), 'h:mm a')}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-[11px] text-[var(--text-tertiary)]">Scheduled at</p>
                                <p className="text-[12px] text-[var(--text-secondary)] dark:text-slate-300">{formatDate(c.scheduled_at, 'EEE, MMM d yyyy')}</p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <p className="text-[11px] font-semibold text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)] uppercase tracking-wider">Meeting Link</p>
                                <a href={getVideoRoom(c)} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 mt-0.5 transition-colors">
                                  <Video size={12} />
                                  {c.type === 'video' ? 'Connect Meeting' : 'Join Session'}
                                </a>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)] uppercase tracking-wider">Email</p>
                                <p className="text-[12px] text-[var(--text-secondary)] dark:text-slate-300 mt-0.5">{client?.email ?? '—'}</p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <p className="text-[11px] font-semibold text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)] uppercase tracking-wider">Client Response</p>
                                <span className={`inline-flex items-center mt-1 px-2 py-0.5 text-[11px] font-semibold capitalize ${
                                  c.client_response === 'accepted' ? 'bg-emerald-100 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400'
                                  : c.client_response === 'declined' ? 'bg-red-100 dark:bg-red-900/25 text-red-700 dark:text-red-400'
                                  : c.client_response === 'reschedule_requested' ? 'bg-amber-100 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400'
                                  : 'bg-[var(--bg-subtle)] dark:bg-white/[0.06] text-[var(--text-tertiary)]'
                                }`}>{c.client_response.replace('_', ' ')}</span>
                              </div>
                              {c.proposed_scheduled_at && (
                                <div>
                                  <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">Proposed Time</p>
                                  <p className="text-[12px] text-amber-600 dark:text-amber-400 mt-0.5">{formatDate(c.proposed_scheduled_at, 'EEE, MMM d · h:mm a')}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {(c.notes || c.client_response_note) && (
                            <div className="px-4 sm:px-5 pb-4">
                              <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">Meeting Notes</p>
                              <p className="text-[12px] text-[var(--text-secondary)] dark:text-[var(--text-tertiary)] leading-relaxed bg-[var(--bg-subtle)] dark:bg-white/[0.02] p-3 border border-[var(--border)] dark:border-white/[0.04]">
                                {c.notes}
                                {c.client_response_note && <span className="block mt-2 text-[var(--text-tertiary)] italic">Client: {c.client_response_note}</span>}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-2 px-4 sm:px-5 pb-4 flex-wrap bg-[var(--bg-card)]">
                            {c.status === 'scheduled' && (
                              <>
                                {c.type === 'video' && (
                                  <a href={getVideoRoom(c)} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors">
                                    <Video size={13} /> Join Call
                                  </a>
                                )}
                                {c.type === 'call' && client?.phone && (
                                  <a href={`tel:${client.phone}`}
                                    className="flex items-center gap-1.5 rounded-s-xl px-4 py-2 text-[12px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
                                    <PhoneCall size={13} /> Call Now
                                  </a>
                                )}
                                <button onClick={() => onReschedule(c)}
                                  className="flex items-center gap-1.5 px-4 rounded-s-xl py-2 text-[12px] font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors">
                                  <RefreshCw size={13} /> Reschedule
                                </button>
                                <button onClick={() => onCancel(c)} disabled={isDeleteCheckinPending}
                                  className="flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-s-xl font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/15 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/30 disabled:opacity-50">
                                  {isDeleteCheckinPending ? 'Cancelling…' : 'Cancel'}
                                </button>
                              </>
                            )}
                            <button onClick={() => setActiveChatId(chatOpen ? null : `chat-${c.id}`)}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-s-xl text-[12px] font-medium transition-colors ml-auto ${
                                chatOpen ? 'bg-purple-600 text-white' : 'text-[var(--text-secondary)] dark:text-[var(--text-secondary)] border border-[var(--border)] dark:border-white/[0.08] hover:bg-[#13131314] dark:hover:bg-white/[0.04]'
                              }`}>
                              <MessageCircle size={13} />
                              {chatOpen ? 'Close Chat' : 'Open Chat'}
                            </button>
                          </div>

                          {/* Inline chat */}
                          {chatOpen && (
                            <div className="border-t border-[var(--border)] dark:border-white/[0.06] flex flex-col" style={{ height: 300 }}>
                              <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-page)] dark:bg-[var(--bg-page)] border-b border-[var(--border)] dark:border-white/[0.05]">
                                {socketConnected
                                  ? <><Wifi size={10} className="text-emerald-400" /><span className="text-[10px] text-emerald-400">Connected · live chat</span></>
                                  : <><WifiOff size={10} className="text-[var(--text-tertiary)]" /><span className="text-[10px] text-[var(--text-tertiary)]">Offline — messages saved via REST</span></>}
                              </div>
                              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[var(--bg-page)] dark:bg-[var(--bg-page)]">
                                {allMessages
                                  .filter((m: any) => Math.abs(new Date(c.scheduled_at).getTime() - new Date(m.sent_at).getTime()) < 2 * 60 * 60 * 1000)
                                  .concat(allMessages.slice(-5))
                                  .filter((m: any, i: number, arr: any[]) => arr.findIndex(x => x.id === m.id) === i)
                                  .sort((a: any, b: any) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
                                  .map((m: any) => (
                                    <div key={m.id} className={`flex ${m.sender_role === 'coach' ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-[80%] px-3 py-2 text-[12px] ${m.sender_role === 'coach' ? 'bg-brand-600 text-white' : 'bg-[var(--bg-subtle)] border border-[var(--border)] dark:border-white/[0.07] text-[var(--text-secondary)] dark:text-slate-300'}`}>
                                        <p>{m.content}</p>
                                        <p className={`text-[10px] mt-0.5 ${m.sender_role === 'coach' ? 'text-blue-200' : 'text-[var(--text-tertiary)]'}`}>{timeAgo(m.sent_at)}</p>
                                      </div>
                                    </div>
                                  ))}
                                {allMessages.length === 0 && <p className="text-center text-[12px] text-[var(--text-tertiary)] py-6">No messages yet — say hello!</p>}
                                <div ref={chatEndRef} />
                              </div>
                              <div className="p-3 border-t border-[var(--border)] dark:border-white/[0.05] bg-[var(--bg-card)] flex gap-2">
                                <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSend()}
                                  placeholder="Send a message…"
                                  className="flex-1 bg-[var(--bg-page)] dark:bg-[var(--bg-page)] border border-[var(--border)] dark:border-white/[0.07] px-3 py-2 text-[12px] text-[var(--text-primary)] dark:text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] dark:placeholder:text-[var(--text-secondary)] outline-none focus:border-blue-400 dark:focus:border-white/[0.18]" />
                                <button onClick={onSend} disabled={!msg.trim()} className="px-3 py-2 bg-brand-600 hover:bg-brand-700 rounded-s-xl text-white transition-colors disabled:opacity-40">
                                  <Send size={13} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
