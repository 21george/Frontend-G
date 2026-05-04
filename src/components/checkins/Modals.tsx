'use client'

import { useState } from 'react'
import { X, Calendar, Clock, Video, Phone, MessageCircle, User } from 'lucide-react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import type { CheckinMeeting, Client } from '@/types'
import { formatDate } from '@/lib/utils'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EVENT_TYPES, STATUS, BRAND } from '@/lib/constants'

interface EventDetailModalProps {
  selected: CheckinMeeting | null
  clientMap: Map<string, Client>
  onClose: () => void
  onReschedule: (meeting: CheckinMeeting) => void
  onCancel: () => void
  isDeleting: boolean
}

export function EventDetailModal({ selected, clientMap, onClose, onReschedule, onCancel, isDeleting }: EventDetailModalProps) {
  if (!selected) return null

  const selectedClient = clientMap.get(selected.client_id)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white dark:bg-surface-card-dark overflow-hidden border border-slate-200 dark:border-white/[0.08] rounded-xl shadow-elevated dark:shadow-dark-elevated"
          onClick={e => e.stopPropagation()}
        >
          {/* Accent top bar */}
          <div className="h-1.5 w-full" style={{ backgroundColor: BRAND.DEFAULT }} />

          <div className="p-7">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 flex items-center justify-center bg-slate-100 dark:bg-white/[0.06] ">
                  <User size={26} className="text-slate-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {selectedClient?.name ?? 'Client'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded ${
                      EVENT_TYPES[selected.type as keyof typeof EVENT_TYPES]?.bg ?? 'bg-slate-100'
                    } ${EVENT_TYPES[selected.type as keyof typeof EVENT_TYPES]?.text ?? 'text-slate-700'}`}>
                      {selected.type === 'video' && <Video size={11} />}
                      {selected.type === 'call' && <Phone size={11} />}
                      {selected.type === 'chat' && <MessageCircle size={11} />}
                      {selected.type}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded ${
                      selected.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : selected.status === 'cancelled' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                    }`}>
                      {selected.status}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[#F4F0EA] dark:hover:bg-white/[0.06] transition-colors">
                <X size={18} className="text-[#A89B8C]" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm p-3.5 bg-slate-50 dark:bg-surface-subtle-dark border border-slate-200 dark:border-white/[0.06] rounded-lg">
                <Calendar size={16} className="text-slate-500" />
                <span className="text-slate-900 dark:text-slate-100">
                  {formatDate(selected.scheduled_at, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm p-3.5 bg-slate-50 dark:bg-surface-subtle-dark border border-slate-200 dark:border-white/[0.06] rounded-lg">
                <Clock size={16} className="text-slate-500" />
                <span className="text-slate-900 dark:text-slate-100">
                  {formatDate(selected.scheduled_at, 'h:mm a')}
                </span>
              </div>
              {selected.meeting_link && (
                <div className="flex items-center gap-3 text-sm p-3.5 bg-slate-50 dark:bg-surface-subtle-dark border border-slate-200 dark:border-white/[0.06] rounded-lg">
                  <Video size={16} className="text-slate-500" />
                  <a href={selected.meeting_link} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 hover:underline font-medium">
                    Join meeting
                  </a>
                </div>
              )}
              {selected.notes && (
                <div className="pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Notes</p>
                  <p className="text-sm text-slate-900 dark:text-slate-100 p-3.5 bg-slate-50 dark:bg-surface-subtle-dark border border-slate-200 dark:border-white/[0.06] rounded-lg">{selected.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-7 pt-5 border-t border-slate-200 dark:border-white/[0.08]">
              <button
                onClick={() => onReschedule(selected)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white transition-colors rounded-lg hover:bg-brand-700"
                style={{ backgroundColor: BRAND.DEFAULT }}
              >
                Reschedule
              </button>
              <button
                onClick={onCancel}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-white/[0.06] text-slate-900 dark:text-slate-100 text-sm font-semibold transition-colors hover:bg-slate-200 dark:hover:bg-white/[0.1] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Cancelling…' : 'Cancel'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date
  clients: Client[]
  onSubmit: (data: {
    client_id: string
    scheduled_at: string
    type: 'video' | 'call' | 'chat'
    meeting_link: string
    notes: string
  }) => Promise<void>
  isLoading: boolean
}

export function CreateEventModal({ isOpen, onClose, selectedDate, clients, onSubmit, isLoading }: CreateEventModalProps) {
  const [formClient, setFormClient] = useState('')
  const [formDate, setFormDate] = useState(format(selectedDate, 'yyyy-MM-dd'))
  const [formTime, setFormTime] = useState('09:00')
  const [formType, setFormType] = useState<'video' | 'call' | 'chat'>('video')
  const [formLink, setFormLink] = useState('')
  const [formNotes, setFormNotes] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      client_id: formClient,
      scheduled_at: `${formDate}T${formTime}`,
      type: formType,
      meeting_link: formLink,
      notes: formNotes,
    })
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-white/[0.08] rounded-xl shadow-elevated"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-1.5 w-full" style={{ backgroundColor: BRAND.DEFAULT }} />

            <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">New Event</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Schedule a session</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors rounded-lg">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="px-7 py-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Client</label>
                <select
                  value={formClient}
                  onChange={e => setFormClient(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors rounded-lg"
                >
                  <option value="">Select a client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Time</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Type</label>
                <select
                  value={formType}
                  onChange={e => setFormType(e.target.value as 'video' | 'call' | 'chat')}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors rounded-lg"
                >
                  <option value="video">Video Call</option>
                  <option value="call">Phone Call</option>
                  <option value="chat">Chat</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Meeting Link</label>
                <input
                  type="url"
                  value={formLink}
                  onChange={e => setFormLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Notes</label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  rows={3}
                  placeholder="Agenda, topics to discuss..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors resize-none rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06] transition-colors rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 text-sm font-semibold text-white transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700"
                  style={{ backgroundColor: BRAND.DEFAULT }}
                >
                  {isLoading ? 'Saving...' : 'Save Event'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface RescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  selected: CheckinMeeting | null
  onUpdate: (id: string, scheduled_at: string) => Promise<void>
  isLoading: boolean
}

export function RescheduleModal({ isOpen, onClose, selected, onUpdate, isLoading }: RescheduleModalProps) {
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduleError, setRescheduleError] = useState<string | null>(null)

  if (!selected) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected.id || !rescheduleDate || !rescheduleTime) return

    setRescheduleError(null)
    const newDateTime = new Date(`${rescheduleDate}T${rescheduleTime}:00`)

    try {
      await onUpdate(selected.id, newDateTime.toISOString())
      onClose()
    } catch {
      setRescheduleError('Failed to reschedule. Please try again.')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-white/[0.08] rounded-xl shadow-elevated"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-1.5 w-full" style={{ backgroundColor: BRAND.DEFAULT }} />

            <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Reschedule</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Choose a new time</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors rounded-lg">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-7 py-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={e => setRescheduleDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Time</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={e => setRescheduleTime(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors rounded-lg"
                />
              </div>

              {rescheduleError && (
                <p className="text-sm text-red-600 dark:text-red-400">{rescheduleError}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06] transition-colors rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 text-sm font-semibold text-white transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700"
                  style={{ backgroundColor: BRAND.DEFAULT }}
                >
                  {isLoading ? 'Rescheduling...' : 'Reschedule'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
