'use client'

import { AuthLayout } from '@/components/layout/AuthLayout'
import { Modal } from '@/components/ui/Modal'
import { Video, User, CalendarDays, Clock } from 'lucide-react'
import { useState } from 'react'
import { useAllClients, useCreateCoachingSession } from '@/lib/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import type { Client } from '@/types'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [showCreate, setShowCreate] = useState(false)
  const { data: clients = [], isLoading: clientsLoading } = useAllClients()
  const createSession = useCreateCoachingSession()
  const queryClient = useQueryClient()
  const router = useRouter()

  const [form, setForm] = useState({
    client_id: '',
    title: '',
    description: '',
    agenda: '',
    duration_min: 60,
    scheduled_at: '',
  })
  const [formError, setFormError] = useState<string | null>(null)

  const setFormField = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const resetForm = () => {
    setForm({
      client_id: '',
      title: '',
      description: '',
      agenda: '',
      duration_min: 60,
      scheduled_at: '',
    })
    setFormError(null)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!form.client_id) return setFormError('Please select a client.')
    if (!form.title.trim()) return setFormError('Session title is required.')
    if (!form.scheduled_at) return setFormError('Scheduled date/time is required.')
    if (form.duration_min < 5) return setFormError('Duration must be at least 5 minutes.')

    try {
      const res = await createSession.mutateAsync({
        client_id: form.client_id,
        title: form.title.trim(),
        description: form.description.trim(),
        agenda: form.agenda.trim(),
        duration_min: Number(form.duration_min),
        scheduled_at: new Date(form.scheduled_at).toISOString(),
      })
      const id = (res as { data: { data: { id: string } } }).data?.data?.id
      setShowCreate(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['coaching-sessions'] })
      if (id) router.push(`/coaching-sessions/${id}`)
    } catch {
      setFormError('Failed to create session. Please try again.')
    }
  }

  const quickActions = [
    {
      label: 'New 1-on-1',
      icon: Video,
      color: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400 dark:hover:bg-cyan-900/50',
      onClick: () => { resetForm(); setShowCreate(true); },
    },
  ]

  return (
    <AuthLayout showHeader={true} showGreeting={false} quickActions={quickActions}>
      {children}

      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); resetForm(); }}
        title="New 1-on-1 Session"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          {/* Client */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              <User className="h-3.5 w-3.5 inline mr-1.5 opacity-70" />
              Client
            </label>
            <div className="relative">
              <select
                value={form.client_id}
                onChange={(e) => setFormField('client_id', e.target.value)}
                disabled={clientsLoading}
                className="w-full appearance-none px-3 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              >
                <option value="">
                  {clientsLoading ? 'Loading clients…' : 'Select a client…'}
                </option>
                {clients.map((c: Client) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {/* Custom chevron */}
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Session Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setFormField('title', e.target.value)}
              placeholder="e.g. Monthly Progress Review"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Description{' '}
              <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setFormField('description', e.target.value)}
              placeholder="Brief overview of the session…"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 resize-none"
            />
          </div>

          {/* Agenda */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Agenda{' '}
              <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
            </label>
            <textarea
              rows={4}
              value={form.agenda}
              onChange={(e) => setFormField('agenda', e.target.value)}
              placeholder={"1. Warm-up review\n2. Progress assessment\n3. Nutrition check-in\n4. Set next week's goals"}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 resize-none"
            />
          </div>

          {/* Date / Duration row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">
                <CalendarDays className="h-3.5 w-3.5 inline mr-1.5 opacity-70" />
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setFormField('scheduled_at', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">
                <Clock className="h-3.5 w-3.5 inline mr-1.5 opacity-70" />
                Duration (minutes)
              </label>
              <select
                value={form.duration_min}
                onChange={(e) => setFormField('duration_min', Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              >
                {[15, 30, 45, 60, 75, 90, 120].map((m) => (
                  <option key={m} value={m}>
                    {m} minutes
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {formError && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">
              {formError}
            </p>
          )}

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
              disabled={createSession.isPending}
              className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-lg shadow-cyan-500/20"
            >
              {createSession.isPending ? 'Scheduling…' : 'Schedule Session'}
            </button>
          </div>
        </form>
      </Modal>
    </AuthLayout>
  )
}
