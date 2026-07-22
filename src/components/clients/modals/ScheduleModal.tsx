'use client'

import { useState } from 'react'
import { X, Video, PhoneCall, MessageCircle, Calendar, Clock, Link, FileText, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCreateCheckin } from '@/lib/hooks'

type MeetingType = 'video' | 'call' | 'chat'

interface Props {
  open: boolean
  onClose: () => void
  clientId: string
}

const TYPE_META: Record<MeetingType, { icon: React.ElementType; label: string; color: string }> = {
  video:   { icon: Video,      label: 'Video Call',  color: 'border-blue-500/30 text-blue-400 bg-blue-500/10' },
  call:    { icon: PhoneCall,  label: 'Phone Call',  color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' },
  chat:    { icon: MessageCircle, label: 'Chat Session', color: 'border-purple-500/30 text-purple-400 bg-purple-500/10' },
}

export function ScheduleModal({ open, onClose, clientId }: Props) {
  const createCheckin = useCreateCheckin()

  const [type, setType] = useState<MeetingType>('video')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isLoading = createCheckin.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!date || !time) {
      setError('Please select both date and time.')
      return
    }

    const scheduledAt = new Date(`${date}T${time}:00`).toISOString()

    try {
      await createCheckin.mutateAsync({
        client_id: clientId,
        scheduled_at: scheduledAt,
        type,
        meeting_link: meetingLink || undefined,
        notes: notes || undefined,
      })
      // Reset form
      setType('video')
      setDate('')
      setTime('')
      setMeetingLink('')
      setNotes('')
      onClose()
    } catch {
      setError('Failed to schedule appointment. Please try again.')
    }
  }

  const inputCls =
    'w-full border border-white/[0.08] dark:border-white/[0.08] rounded-lg px-3 py-[10px] text-[13px] ' +
    'bg-white/[0.03] dark:bg-white/[0.03] text-[var(--text-primary)] dark:text-white ' +
    'placeholder:text-white/20 dark:placeholder:text-white/20 ' +
    'focus:outline-none focus:ring-1 focus:ring-[#a3e635]/40 focus:border-[#a3e635]/40 ' +
    'disabled:opacity-40 transition-all duration-200'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#0a1114]/95 backdrop-blur-xl border border-white/[0.06] overflow-hidden rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Top sheen */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#a3e635]/30 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div>
                <h2 className="text-[17px] font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  Create Appointment
                </h2>
                <p className="text-[12px] text-white/40 mt-0.5">
                  Schedule a new session with your client
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.10] transition-colors"
              >
                <X size={14} className="text-white/60" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
              {/* Type selector */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-2">
                  Session Type
                </p>
                <div className="flex gap-2">
                  {(Object.keys(TYPE_META) as MeetingType[]).map((t) => {
                    const { icon: Icon, label, color } = TYPE_META[t]
                    const active = type === t
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg border text-[11px] font-medium transition-all ${
                          active
                            ? `${color} ring-1 ring-[#a3e635]/30`
                            : 'border-white/[0.06] text-white/40 hover:text-white/60 hover:bg-white/[0.02]'
                        }`}
                      >
                        <Icon size={16} />
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1.5">
                    <Calendar size={10} /> Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className={inputCls}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1.5">
                    <Clock size={10} /> Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    required
                    className={inputCls}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              {/* Meeting Link (optional) */}
              <div>
                <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1.5">
                  <Link size={10} /> Meeting Link <span className="text-white/20 normal-case">(optional)</span>
                </label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={e => setMeetingLink(e.target.value)}
                  placeholder="https://meet.jit.si/..."
                  className={inputCls}
                />
              </div>

              {/* Notes (optional) */}
              <div>
                <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1.5">
                  <FileText size={10} /> Notes <span className="text-white/20 normal-case">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add session notes..."
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-[12px] text-red-400 text-center"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-[11px] text-[13px] font-semibold text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors rounded-lg"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-[11px] text-[13px] font-bold text-[#0a1114] bg-[#a3e635] hover:bg-[#bef264] active:bg-[#8bc52f] transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
                >
                  {isLoading && <Loader2 size={14} className="animate-spin" />}
                  SCHEDULE
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
