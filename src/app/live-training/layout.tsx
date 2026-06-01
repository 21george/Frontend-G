'use client'

import { AuthLayout } from '@/components/layout/AuthLayout'
import { Modal } from '@/components/ui/Modal'
import { Video, Calendar, Clock, Users, Link2, FileText, Tag, Signal } from 'lucide-react'
import { useState } from 'react'
import { useCreateLiveTraining } from '@/lib/hooks'
import { useQueryClient } from '@tanstack/react-query'
import type { LiveTrainingCategory, LiveTrainingLevel } from '@/types'

const CATEGORIES: { value: LiveTrainingCategory; label: string }[] = [
  { value: 'strength', label: 'Strength' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'stretching', label: 'Stretching' },
  { value: 'functional', label: 'Functional' },
  { value: 'other', label: 'Other' },
]

const LEVELS: { value: LiveTrainingLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<LiveTrainingCategory>('strength')
  const [level, setLevel] = useState<LiveTrainingLevel>('beginner')
  const [durationMin, setDurationMin] = useState('60')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [maxParticipants, setMaxParticipants] = useState('20')
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [meetingLink, setMeetingLink] = useState('')
  const [loading, setLoading] = useState(false)

  const createMut = useCreateLiveTraining()
  const queryClient = useQueryClient()

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setCategory('strength')
    setLevel('beginner')
    setDurationMin('60')
    setDate('')
    setTime('09:00')
    setMaxParticipants('20')
    setRequiresApproval(false)
    setMeetingLink('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createMut.mutateAsync({
        title,
        description,
        category,
        level,
        duration_min: parseInt(durationMin, 10),
        scheduled_at: `${date}T${time}`,
        max_participants: parseInt(maxParticipants, 10),
        requires_approval: requiresApproval,
        meeting_link: meetingLink,
      })
      setShowCreate(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['live-training'] })
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30'
  const labelCls = 'block text-sm font-medium text-[var(--text-secondary)]'

  const quickActions = [
    {
      label: 'New Session',
      icon: Video,
      color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50',
      onClick: () => { resetForm(); setShowCreate(true); },
    },
  ]

  return (
    <AuthLayout showHeader={true} quickActions={quickActions}>
      {children}

      <Modal open={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} title="New Live Session" size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className={labelCls}>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Morning HIIT Blast"
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className={labelCls}>Description <span className="text-[var(--text-tertiary)] font-normal">(optional)</span></label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the session…"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Category + Level */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LiveTrainingCategory)}
                className={inputCls}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Level *</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as LiveTrainingLevel)}
                className={inputCls}
              >
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Time *</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required className={inputCls} />
            </div>
          </div>

          {/* Duration + Max Participants */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Duration (min) *</label>
              <input
                type="number"
                min="5"
                max="300"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Max Participants</label>
              <input
                type="number"
                min="1"
                max="500"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Meeting Link */}
          <div className="space-y-1.5">
            <label className={labelCls}>Meeting Link <span className="text-[var(--text-tertiary)] font-normal">(optional)</span></label>
            <input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://zoom.us/j/… or Google Meet link"
              className={inputCls}
            />
          </div>

          {/* Require Approval toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Require Approval</p>
              <p className="text-xs text-[var(--text-tertiary)]">Clients must request to join and you approve them</p>
            </div>
            <button
              type="button"
              onClick={() => setRequiresApproval((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                requiresApproval ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-white/[0.15]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  requiresApproval ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowCreate(false); resetForm(); }}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] text-sm font-medium text-[var(--text-secondary)] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-lg shadow-cyan-500/20"
            >
              {loading ? 'Creating…' : 'Create Session'}
            </button>
          </div>
        </form>
      </Modal>
    </AuthLayout>
  )
}
