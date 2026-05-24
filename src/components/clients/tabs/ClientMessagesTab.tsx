'use client'

import { useRef } from 'react'
import { Send, Paperclip, FileText, Download, X, Wifi, WifiOff, Loader2 } from 'lucide-react'
import type { Client } from '@/types'
import { timeAgo } from '@/lib/utils'

interface PendingFile {
  media_url: string
  media_type: string
  media_filename: string
}

interface Props {
  client: Client
  allMessages: any[]
  msg: string
  setMsg: (v: string) => void
  onSend: () => void
  isSendPending: boolean
  isUploadPending: boolean
  pendingFile: PendingFile | null
  onClearPendingFile: () => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  socketConnected: boolean
  msgLoading: boolean
  messagesEndRef: React.RefObject<HTMLDivElement>
}

export function ClientMessagesTab({
  client, allMessages, msg, setMsg, onSend, isSendPending,
  isUploadPending, pendingFile, onClearPendingFile, onFileSelect,
  socketConnected, msgLoading, messagesEndRef,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-12rem)] sm:h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-2 sm:px-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--bg-subtle)] border border-[var(--border)] dark:border-white/[0.1] flex items-center justify-center overflow-hidden flex-shrink-0">
            {client.profile_photo_url
              ? <img src={client.profile_photo_url} alt="" className="w-full h-full object-cover" />
              : <span className="text-xs font-semibold text-[var(--text-primary)]">{client.name[0].toUpperCase()}</span>}
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">{client.name}</h3>
            <span className={`text-[11px] ${client.active ? 'text-emerald-400' : 'text-[var(--text-tertiary)]'}`}>
              {client.active ? 'Active' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          {socketConnected
            ? <><Wifi size={11} className="text-emerald-400" /><span className="text-emerald-400">Live</span></>
            : <><WifiOff size={11} className="text-[var(--text-secondary)]" /><span className="text-[var(--text-secondary)]">Polling</span></>}
        </div>
      </div>

      {/* Chat container */}
      <div className="flex-1 flex flex-col min-h-0 border border-[var(--border)] dark:border-white/[0.07] overflow-hidden">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[var(--bg-page)] dark:bg-[var(--bg-page)] min-h-0">
          {msgLoading && allMessages.length === 0 && (
            <p className="text-center text-[var(--text-secondary)] text-[13px] mt-8">Loading messages…</p>
          )}
          {allMessages.map((m: any) => (
            <div key={m.id} className={`flex ${m.sender_role === 'coach' ? 'justify-end' : 'justify-start'} gap-2`}>
              {m.sender_role === 'client' && (
                <div className="w-7 h-7 bg-[var(--bg-subtle)]  rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  {client.profile_photo_url
                    ? <img src={client.profile_photo_url} alt="" className="w-full rounded-full h-full object-cover" />
                    : <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 rounded-full">{client.name[0].toUpperCase()}</span>}
                </div>
              )}
              <div className={`max-w-[80%] rounded-8 sm:max-w-md px-3 sm:px-4 py-2 sm:py-2.5 text-[13px] break-words ${
                m.sender_role === 'coach' ? 'bg-brand-600 text-white' : 'bg-[var(--bg-subtle)] border border-[var(--border)] dark:border-white/[0.07] text-slate-700 dark:text-slate-300'
              }`}>
                {m.media_url && m.media_type === 'image' && (
                  <a href={m.media_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                    <img src={m.media_url} alt="" className="max-w-full max-h-48 object-cover rounded" />
                  </a>
                )}
                {m.media_url && m.media_type === 'file' && (
                  <a href={m.media_url} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-2 mb-2 px-3 py-2 ${m.sender_role === 'coach' ? 'bg-blue-700/40' : 'bg-[var(--bg-subtle)] dark:bg-white/[0.05]'}`}>
                    <FileText size={14} />
                    <span className="text-[12px] truncate flex-1">{m.media_filename || 'File'}</span>
                    <Download size={12} />
                  </a>
                )}
                {m.content && <p className="leading-relaxed">{m.content}</p>}
                <p className={`text-[11px] mt-1 ${m.sender_role === 'coach' ? 'text-blue-200' : 'text-[var(--text-secondary)]'}`}>{timeAgo(m.sent_at)}</p>
              </div>
            </div>
          ))}
          {!msgLoading && allMessages.length === 0 && (
            <p className="text-center text-[var(--text-secondary)] text-[13px] mt-8">No messages yet</p>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Pending file preview */}
        {pendingFile && (
          <div className="px-4 py-2 border-t border-[var(--border)] dark:border-white/[0.06] bg-[var(--bg-page)] flex items-center gap-2 flex-shrink-0">
            {pendingFile.media_type === 'image'
              ? <img src={pendingFile.media_url} alt="" className="w-10 h-10 object-cover" />
              : <FileText size={16} className="text-[var(--text-tertiary)]" />}
            <span className="text-[12px] text-[var(--text-secondary)] dark:text-slate-400 truncate flex-1">{pendingFile.media_filename}</span>
            <button onClick={onClearPendingFile} className="text-slate-400 hover:text-red-400">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="p-3 sm:p-4 border-t border-[var(--border)] dark:border-white/[0.06] bg-[var(--bg-card)] flex gap-2 flex-shrink-0">
          <input type="file" ref={fileInputRef} onChange={onFileSelect} className="hidden"
            accept="image/jpeg,image/png,image/gif,image/webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip" />
          <button onClick={() => fileInputRef.current?.click()} disabled={isUploadPending}
            className="px-2 sm:px-3 py-2 border border-[var(--border)] dark:border-white/[0.07] text-[var(--text-tertiary)] hover:text-slate-700 dark:hover:text-slate-300 hover:bg-[#13131314] dark:hover:bg-white/[0.05] transition-colors disabled:opacity-40 flex-shrink-0">
            {isUploadPending ? <Loader2 size={15} className="animate-spin" /> : <Paperclip size={15} />}
          </button>
          <input
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && onSend()}
            className="flex-1 bg-[var(--bg-page)] dark:bg-[var(--bg-page)] border border-[var(--border)] dark:border-white/[0.07] px-3 sm:px-4 py-2 text-[13px] text-[var(--text-primary)] dark:text-[var(--text-primary)] placeholder:text-slate-400 dark:placeholder:text-slate-700 outline-none focus:border-slate-300 dark:focus:border-white/[0.15] min-w-0"
            placeholder="Type a message…"
          />
          <button onClick={onSend} disabled={isSendPending || (!msg.trim() && !pendingFile)}
            className="px-3 sm:px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
