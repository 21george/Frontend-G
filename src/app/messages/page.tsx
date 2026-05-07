'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import {
  useMessages, useSendMessage, useUploadMessageMedia,
  useUnreadMessages, useMarkAllMessagesRead,
} from '@/hooks/useMessages'
import { useClients } from '@/lib/hooks'
import { useSocketChat } from '@/lib/useSocketChat'
import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Send, Paperclip, X, FileText, Download, Loader2,
  Wifi, WifiOff, MessageSquare, ChevronLeft, Search,
  Bell,
} from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

function formatWhen(sentAt: string): string {
  const now = new Date()
  const sent = new Date(sentAt)
  const diffMs = now.getTime() - sent.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return sent.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  profile_photo_url?: string
  active?: boolean
  language?: string
  created_at?: string
}

interface ChatMessage {
  id: string
  content: string
  sender_role: 'coach' | 'client'
  sent_at: string
  media_url?: string | null
  media_type?: string | null
  media_filename?: string | null
}

export default function MessagesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeClientId = searchParams.get('client') ?? ''

  const [msg, setMsg] = useState('')
  const [pendingFile, setPendingFile] = useState<{ media_url: string; media_type: string; media_filename: string } | null>(null)
  const [search, setSearch] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: unreadData } = useUnreadMessages()
  const unreadMessages = unreadData?.data?.messages ?? []
  const unreadCount = unreadData?.data?.count ?? 0

  const { data: clientsData } = useClients('')
  const allClients: Client[] = clientsData?.data ?? []

  const {
    data: messagesData,
    isLoading: msgLoading,
  } = useMessages(activeClientId)

  const sendMsg = useSendMessage()
  const uploadMedia = useUploadMessageMedia()
  const markAllRead = useMarkAllMessagesRead()

  const { connected: socketConnected, incomingMessages, relayViaSocket, clearIncoming } = useSocketChat(activeClientId)

  // Merge REST + socket messages
  const allMessages = useMemo(() => {
    const rest: ChatMessage[] = messagesData?.data ?? []
    const restIds = new Set(rest.map(m => m.id))
    const extra = incomingMessages
      .filter(sm => !restIds.has(sm.id))
      .map(sm => ({
        id: sm.id,
        content: sm.content,
        sender_role: sm.sender_role,
        sent_at: sm.sent_at,
        media_url: null,
        media_type: null,
        media_filename: null,
      }))
    return [...rest, ...extra].sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
  }, [messagesData, incomingMessages])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages])

  // Clear socket messages that are now in REST data
  useEffect(() => {
    const restIds = (messagesData?.data ?? []).map((m: ChatMessage) => m.id)
    clearIncoming(restIds)
  }, [messagesData, clearIncoming])

  const activeClient = useMemo(() => {
    return allClients.find(c => c.id === activeClientId)
  }, [allClients, activeClientId])

  // Build conversation list from unread + all clients
  const conversations = useMemo(() => {
    const convMap = new Map<string, { client: Client; lastMessage?: string; lastAt?: string; unread: number }>()

    // Seed with all clients
    allClients.forEach(c => {
      convMap.set(c.id, { client: c, unread: 0 })
    })

    // Overlay unread messages
    unreadMessages.forEach((um: any) => {
      const existing = convMap.get(um.client_id)
      if (existing) {
        existing.lastMessage = um.content
        existing.lastAt = um.sent_at
        existing.unread = (existing.unread || 0) + 1
      } else {
        convMap.set(um.client_id, {
          client: { id: um.client_id, name: um.client_name } as Client,
          lastMessage: um.content,
          lastAt: um.sent_at,
          unread: 1,
        })
      }
    })

    return Array.from(convMap.values())
      .filter(c => {
        if (!search) return true
        const q = search.toLowerCase()
        return c.client.name.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        // Sort by unread first, then by last message time
        if (a.unread && !b.unread) return -1
        if (!a.unread && b.unread) return 1
        const aTime = a.lastAt ? new Date(a.lastAt).getTime() : 0
        const bTime = b.lastAt ? new Date(b.lastAt).getTime() : 0
        return bTime - aTime
      })
  }, [allClients, unreadMessages, search])

  const handleSend = async () => {
    if (!msg.trim() && !pendingFile) return
    if (!activeClientId) return
    const content = msg.trim() || (pendingFile ? `📎 ${pendingFile.media_filename}` : '')
    const payload: Parameters<typeof sendMsg.mutateAsync>[0] = { client_id: activeClientId, content }
    if (pendingFile) {
      payload.media_url = pendingFile.media_url
      payload.media_type = pendingFile.media_type
      payload.media_filename = pendingFile.media_filename
    }
    try {
      await sendMsg.mutateAsync(payload)
      setMsg('')
      setPendingFile(null)
      relayViaSocket(content)
    } catch {
      // State remains intact so user can retry
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await uploadMedia.mutateAsync(file)
      setPendingFile(result)
    } catch {
      window.alert('Failed to upload file.')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined)
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-80px)] min-h-[600px] bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center gap-3">
            {activeClientId && (
              <button
                onClick={() => router.push('/messages')}
                className="lg:hidden p-1.5 rounded-md hover:bg-[var(--bg-subtle)] text-[var(--text-tertiary)]"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-[15px] font-semibold text-[var(--text-primary)]">Messages</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-danger text-white text-[11px] font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* ── Main split view ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* ── Sidebar: Conversation list ── */}
          <div className={`${activeClientId ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 flex-col border-r border-[var(--border)] bg-[var(--bg-page)]`}>
            {/* Search */}
            <div className="p-3 border-b border-[var(--border)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search clients…"
                  className="w-full pl-9 pr-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6 text-[var(--text-tertiary)]" />
                  </div>
                  <p className="text-[13px] text-[var(--text-secondary)]">No conversations yet</p>
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                    Messages from clients will appear here
                  </p>
                </div>
              ) : (
                conversations.map((conv, i) => (
                  <motion.div
                    key={conv.client.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link
                      href={`/messages?client=${conv.client.id}`}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition-colors ${
                        activeClientId === conv.client.id ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {conv.client.profile_photo_url ? (
                          <img
                            src={conv.client.profile_photo_url}
                            alt={conv.client.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center text-white text-[13px] font-semibold">
                            {conv.client.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                        )}
                        {conv.unread > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[9px] font-bold text-white flex items-center justify-center border-2 border-[var(--bg-page)]">
                            {conv.unread}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-[13px] truncate ${conv.unread > 0 ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                            {conv.client.name}
                          </p>
                          {conv.lastAt && (
                            <span className="text-[10px] text-[var(--text-tertiary)] flex-shrink-0">
                              {formatWhen(conv.lastAt)}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage ? (
                          <p className={`text-[12px] truncate mt-0.5 ${conv.unread > 0 ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-tertiary)]'}`}>
                            {conv.lastMessage}
                          </p>
                        ) : (
                          <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">No messages yet</p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* ── Chat panel ── */}
          <div className={`${activeClientId ? 'flex' : 'hidden lg:flex'} flex-1 flex-col min-w-0`}>
            {activeClient ? (
              <>
                {/* Chat header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] flex-shrink-0">
                  <div className="flex items-center gap-3">
                    {activeClient.profile_photo_url ? (
                      <img
                        src={activeClient.profile_photo_url}
                        alt={activeClient.name}
                        className="w-9 h-9 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center text-white text-[12px] font-semibold">
                        {activeClient.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <div>
                      <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{activeClient.name}</h3>
                      <span className={`text-[11px] ${activeClient.active ? 'text-accent-500' : 'text-[var(--text-tertiary)]'}`}>
                        {activeClient.active ? 'Active' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {socketConnected ? (
                      <>
                        <Wifi size={11} className="text-accent-500" />
                        <span className="text-accent-500">Live</span>
                      </>
                    ) : (
                      <>
                        <WifiOff size={11} className="text-[var(--text-tertiary)]" />
                        <span className="text-[var(--text-tertiary)]">Polling</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--bg-subtle)]">
                  {msgLoading && allMessages.length === 0 && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-[var(--text-tertiary)]" />
                    </div>
                  )}
                  {allMessages.map((m: ChatMessage) => (
                    <div key={m.id} className={`flex ${m.sender_role === 'coach' ? 'justify-end' : 'justify-start'}`}>
                      {m.sender_role === 'client' && (
                        <div className="w-7 h-7 rounded-md bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                          {activeClient.profile_photo_url ? (
                            <img src={activeClient.profile_photo_url} alt="" className="w-full h-full object-cover rounded-md" />
                          ) : (
                            <span className="text-[10px] font-semibold text-[var(--text-primary)]">
                              {activeClient.name?.[0]?.toUpperCase() ?? '?'}
                            </span>
                          )}
                        </div>
                      )}
                      <div className={`max-w-[85%] sm:max-w-sm px-4 py-2.5 text-[13px] rounded-xl ${
                        m.sender_role === 'coach'
                          ? 'bg-brand-600 text-white rounded-br-none'
                          : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-none'
                      }`}>
                        {/* Media attachment */}
                        {m.media_url && m.media_type === 'image' && (
                          <a href={m.media_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                            <img src={m.media_url} alt="" className="max-w-full max-h-48 object-cover rounded-lg" />
                          </a>
                        )}
                        {m.media_url && m.media_type === 'file' && (
                          <a href={m.media_url} target="_blank" rel="noopener noreferrer"
                            className={`flex items-center gap-2 mb-2 px-3 py-2 rounded-lg ${
                              m.sender_role === 'coach' ? 'bg-white/15' : 'bg-[var(--bg-subtle)]'
                            }`}>
                            <FileText size={14} />
                            <span className="text-[12px] truncate flex-1">{m.media_filename || 'File'}</span>
                            <Download size={12} />
                          </a>
                        )}
                        {m.content && <p>{m.content}</p>}
                        <p className={`text-[11px] mt-1 ${m.sender_role === 'coach' ? 'text-brand-200' : 'text-[var(--text-tertiary)]'}`}>
                          {timeAgo(m.sent_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!msgLoading && allMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-12 h-12 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center mb-3">
                        <MessageSquare className="w-6 h-6 text-[var(--text-tertiary)]" />
                      </div>
                      <p className="text-[13px] text-[var(--text-secondary)]">No messages yet</p>
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Start the conversation below</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Pending file preview */}
                <AnimatePresence>
                  {pendingFile && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="px-4 py-2 border-t border-[var(--border)] bg-[var(--bg-card)] flex items-center gap-2"
                    >
                      {pendingFile.media_type === 'image'
                        ? <img src={pendingFile.media_url} alt="" className="w-10 h-10 object-cover rounded-lg" />
                        : <FileText size={16} className="text-[var(--text-tertiary)]" />}
                      <span className="text-[12px] text-[var(--text-secondary)] truncate flex-1">{pendingFile.media_filename}</span>
                      <button onClick={() => setPendingFile(null)} className="p-1 rounded-md hover:bg-red-50 text-[var(--text-tertiary)] hover:text-danger transition-colors">
                        <X size={14} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input area */}
                <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-card)] flex gap-2 flex-shrink-0">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif,image/webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMedia.isPending}
                    className="px-3 py-2.5 border border-[var(--border)] rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-40"
                  >
                    {uploadMedia.isPending ? <Loader2 size={15} className="animate-spin" /> : <Paperclip size={15} />}
                  </button>
                  <input
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    placeholder="Type a message…"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sendMsg.isPending || (!msg.trim() && !pendingFile)}
                    className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </>
            ) : (
              /* Empty state when no client selected */
              <div className="flex flex-col items-center justify-center flex-1 p-8">
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-[var(--text-tertiary)]" />
                </div>
                <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-1">
                  {unreadCount > 0 ? `${unreadCount} unread message${unreadCount === 1 ? '' : 's'}` : 'Your inbox'}
                </h3>
                <p className="text-[13px] text-[var(--text-secondary)] text-center max-w-xs">
                  {unreadCount > 0
                    ? 'Select a conversation from the sidebar to read and reply.'
                    : 'Messages from your clients will appear here. Select a client to start chatting.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
