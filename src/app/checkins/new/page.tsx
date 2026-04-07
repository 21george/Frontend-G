'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useCreateCheckin, useClients } from '@/lib/hooks'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewCheckinPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { data: clientsData } = useClients()
  const clients       = clientsData?.data ?? []
  const createCheckin = useCreateCheckin()

  const [clientId,    setClientId]    = useState(searchParams.get('client') ?? '')
  const [datetime,    setDatetime]    = useState('')
  const [type,        setType]        = useState<'call'|'video'|'chat'>('video')
  const [link,        setLink]        = useState('')
  const [notes,       setNotes]       = useState('')
  const [loading,     setLoading]     = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      await createCheckin.mutateAsync({
        client_id: clientId, scheduled_at: datetime, type, meeting_link: link, notes
      })
      router.push('/checkins')
    } finally { setLoading(false) }
  }

  return (
    <DashboardLayout>
      <div className="max-w-lg">
        <Link href="/checkins" className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white mb-6">
          <ArrowLeft className="w-3 h-3" /> Back to Schedule
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Schedule Event</h1>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Client *</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} className="input" required>
                <option value="">Select client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date & Time *</label>
              <input type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Meeting Type *</label>
              <select value={type} onChange={e => setType(e.target.value as any)} className="input">
                <option value="video">Video Call</option>
                <option value="call">Phone Call</option>
                <option value="chat">Chat</option>
              </select>
            </div>
            <div>
              <label className="label">Meeting Link (Zoom / Google Meet)</label>
              <input value={link} onChange={e => setLink(e.target.value)} className="input" placeholder="https://meet.google.com/…" />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input h-24 resize-none" placeholder="Agenda, topics to discuss…" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Scheduling…' : 'Schedule Meeting'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
