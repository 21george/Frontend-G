'use client'

import { AuthLayout } from '@/components/layout/AuthLayout'
import { Modal } from '@/components/ui/Modal'
import { Video, User, CalendarDays, Clock, AlertCircle, Sparkles } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useAllClients, useCreateCoachingSession } from '@/lib/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
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
      const id = res.data?.id
      setShowCreate(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['coaching-sessions'] })
      if (id) router.push(`/coaching-sessions/${id}`)
    } catch {
      setFormError('Failed to create session. Please try again.')
    }
  }

  const selectedClient = useMemo(
    () => clients.find((c: Client) => c.id === form.client_id),
    [clients, form.client_id]
  )

  const scheduledDate = useMemo(() => {
    if (!form.scheduled_at) return null
    try {
      const d = new Date(form.scheduled_at)
      return isNaN(d.getTime()) ? null : d
    } catch {
      return null
    }
  }, [form.scheduled_at])

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
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          {/* Live Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-800 to-brand-950 p-5 text-white shadow-lg"
          >
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-energy/20 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-brand-400/20 blur-xl" />
            <div className="relative">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                  <Sparkles className="h-5 w-5 text-energy" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                    Session Preview
                  </p>
                  <p className="text-lg font-semibold leading-tight truncate">
                    {form.title.trim() || 'Untitled Session'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedClient && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/90 backdrop-blur-sm ring-1 ring-white/10">
                    <User className="h-3 w-3" />
                    {selectedClient.name}
                  </span>
                )}
                {scheduledDate && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/90 backdrop-blur-sm ring-1 ring-white/10">
                    <CalendarDays className="h-3 w-3" />
                    {format(scheduledDate, 'MMM d, h:mm a')}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/90 backdrop-blur-sm ring-1 ring-white/10">
                  <Clock className="h-3 w-3" />
                  {form.duration_min} min
                </span>
              </div>
            </div>
          </motion.div>

          {/* Section: Session Details */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              <span className="h-px flex-1 bg-[var(--border)]" />
              Session Details
              <span className="h-px flex-1 bg-[var(--border)]" />
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client */}
              <div className="space-y-1.5">
                <label className="label">
                  <User className="h-3.5 w-3.5 inline mr-1.5 opacity-70" />
                  Client
                </label>
                <div className="relative">
                  <select
                    value={form.client_id}
                    onChange={(e) => setFormField('client_id', e.target.value)}
                    disabled={clientsLoading}
                    className="input w-full appearance-none rounded-xl pr-10"
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
                <label className="label">Session Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setFormField('title', e.target.value)}
                  placeholder="e.g. Monthly Progress Review"
                  className="input rounded-xl"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="label">
                Description{' '}
                <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setFormField('description', e.target.value)}
                placeholder="Brief overview of the session…"
                className="input rounded-xl resize-none"
              />
            </div>
          </div>

          {/* Section: Schedule */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              <span className="h-px flex-1 bg-[var(--border)]" />
              Schedule
              <span className="h-px flex-1 bg-[var(--border)]" />
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="label">
                  <CalendarDays className="h-3.5 w-3.5 inline mr-1.5 opacity-70" />
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setFormField('scheduled_at', e.target.value)}
                  className="input rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="label">
                  <Clock className="h-3.5 w-3.5 inline mr-1.5 opacity-70" />
                  Duration
                </label>
                <div className="relative">
                  <select
                    value={form.duration_min}
                    onChange={(e) => setFormField('duration_min', Number(e.target.value))}
                    className="input w-full appearance-none rounded-xl pr-10"
                  >
                    {[15, 30, 45, 60, 75, 90, 120].map((m) => (
                      <option key={m} value={m}>
                        {m} minutes
                      </option>
                    ))}
                  </select>
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
            </div>
          </div>

          {/* Agenda */}
          <div className="space-y-1.5">
            <label className="label">
              Agenda{' '}
              <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
            </label>
            <textarea
              rows={4}
              value={form.agenda}
              onChange={(e) => setFormField('agenda', e.target.value)}
              placeholder={"1. Warm-up review\n2. Progress assessment\n3. Nutrition check-in\n4. Set next week's goals"}
              className="input rounded-xl resize-none"
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {formError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-xl px-3 py-2.5 overflow-hidden"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {formError}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => { setShowCreate(false); resetForm(); }}
              className="btn-secondary flex-1 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSession.isPending}
              className="flex-1 py-2.5 rounded-xl bg-energy-500 hover:bg-energy-600 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-energy-glow hover:shadow-energy-glow active:scale-[0.98]"
            >
              {createSession.isPending ? 'Scheduling…' : 'Schedule Session'}
            </button>
          </div>
        </form>
      </Modal>
    </AuthLayout>
  )
}
