'use client'

import { AuthLayout } from '@/components/layout/AuthLayout'
import { Modal } from '@/components/ui/Modal'
import { Calendar } from 'lucide-react'
import { useState } from 'react'
import { useClients, useCreateCheckin } from '@/lib/hooks'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [showCreate, setShowCreate] = useState(false)
  const [clientId, setClientId] = useState('')
  const [datetime, setDatetime] = useState('')
  const [type, setType] = useState<'call' | 'video' | 'chat'>('video')
  const [link, setLink] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: clientsData, isLoading: clientsLoading } = useClients()
  const clients = clientsData?.data ?? []
  const createCheckin = useCreateCheckin()
  const queryClient = useQueryClient()

  const resetForm = () => {
    setClientId('')
    setDatetime('')
    setType('video')
    setLink('')
    setNotes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createCheckin.mutateAsync({
        client_id: clientId,
        scheduled_at: datetime,
        type,
        meeting_link: link,
        notes,
      })
      toast.success('Check-in scheduled and client notified.')
      setShowCreate(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['checkins'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      label: 'Book a check-in',
      icon: Calendar,
      color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50',
      onClick: () => setShowCreate(true),
    },
  ]

  return (
    <AuthLayout showHeader={true} quickActions={quickActions}>
      {children}

      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); resetForm(); }}
        title="Book a Check-in"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={clientsLoading}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              <option value="">{clientsLoading ? 'Loading clients…' : 'Select a client…'}</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">Date & Time</label>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">Meeting Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              <option value="video">Video Call</option>
              <option value="call">Phone Call</option>
              <option value="chat">Chat</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">Meeting Link <span className="text-[var(--text-tertiary)] font-normal">(optional)</span></label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://meet.google.com/…"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">Notes <span className="text-[var(--text-tertiary)] font-normal">(optional)</span></label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agenda, topics to discuss…"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 resize-none"
            />
          </div>

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
              {loading ? 'Scheduling…' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </Modal>
    </AuthLayout>
  )
}
