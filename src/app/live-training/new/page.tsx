'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Calendar, Clock, Users, Link2, FileText, Tag, Signal, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useCreateLiveTraining } from '@/lib/hooks'
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

export default function NewLiveTrainingPage() {
  const router       = useRouter()
  const createMut    = useCreateLiveTraining()

  const [title, setTitle]                 = useState('')
  const [description, setDescription]     = useState('')
  const [category, setCategory]           = useState<LiveTrainingCategory>('strength')
  const [level, setLevel]                 = useState<LiveTrainingLevel>('beginner')
  const [durationMin, setDurationMin]     = useState('60')
  const [date, setDate]                   = useState('')
  const [time, setTime]                   = useState('09:00')
  const [maxParticipants, setMaxParticipants] = useState('20')
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [meetingLink, setMeetingLink]     = useState('')
  const [loading, setLoading]             = useState(false)

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
      router.push('/live-training')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-[13px] text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20 transition-colors'
  const labelCls = 'block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2'

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <Link href="/live-training" className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to Live Training
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-950 flex items-center justify-center shadow-lg shadow-cyan-950/25">
            <Signal size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">New Live Session</h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">Set up a live training class for your clients</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Session Info Card */}
          <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Session Details</h2>
            </div>

            <div>
              <label className={labelCls}>Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                placeholder="e.g. Morning HIIT Blast"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe the session: what clients will do, what to bring…"
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Category *</label>
                <div className="relative">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as LiveTrainingCategory)}
                    className={`${inputCls} pl-9`}
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Level *</label>
                <select value={level} onChange={e => setLevel(e.target.value as LiveTrainingLevel)} className={inputCls}>
                  {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Schedule Card */}
          <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={14} className="text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Schedule</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Date *</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required className={`${inputCls} pl-9`} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Time *</label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} required className={`${inputCls} pl-9`} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Duration (minutes) *</label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={durationMin}
                    onChange={e => setDurationMin(e.target.value)}
                    required
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Max Participants</label>
                <div className="relative">
                  <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={maxParticipants}
                    onChange={e => setMaxParticipants(e.target.value)}
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Settings Card */}
          <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={14} className="text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Settings</h2>
            </div>

            <div>
              <label className={labelCls}>Meeting Link</label>
              <div className="relative">
                <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="url"
                  value={meetingLink}
                  onChange={e => setMeetingLink(e.target.value)}
                  placeholder="https://zoom.us/j/… or Google Meet link"
                  className={`${inputCls} pl-9`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
              <div>
                <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Require Approval</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Clients must request to join and you approve them</p>
              </div>
              <button
                type="button"
                onClick={() => setRequiresApproval(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  requiresApproval
                    ? 'bg-cyan-950'
                    : 'bg-slate-300 dark:bg-white/[0.15]'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  requiresApproval ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/live-training"
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-950 hover:from-cyan-500 hover:to-cyan-900 text-white text-[13px] font-semibold rounded-xl shadow-lg shadow-cyan-950/25 transition-all hover:shadow-xl disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
