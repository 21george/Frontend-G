'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useCreateCheckin, useClients } from '@/lib/hooks'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { FormField, TextInput, TextArea, SelectInput } from '@/components/ui/FormField'

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
      <div className="">
        <Link href="/checkins" className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white mb-6">
          <ArrowLeft className="w-3 h-3" /> Back to Schedule
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Schedule Event</h1>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Client" required>
              <SelectInput
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                required
                options={clients.map(c => ({ value: c.id, label: c.name }))}
                placeholder="Select client…"
              />
            </FormField>
            <FormField label="Date & Time" required>
              <TextInput type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)} required />
            </FormField>
            <FormField label="Meeting Type" required>
              <SelectInput
                value={type}
                onChange={e => setType(e.target.value as any)}
                options={[
                  { value: 'video', label: 'Video Call' },
                  { value: 'call', label: 'Phone Call' },
                  { value: 'chat', label: 'Chat' },
                ]}
              />
            </FormField>
            <FormField label="Meeting Link (Zoom / Google Meet)">
              <TextInput value={link} onChange={e => setLink(e.target.value)} placeholder="https://meet.google.com/…" />
            </FormField>
            <FormField label="Notes">
              <TextArea value={notes} onChange={e => setNotes(e.target.value)} className="h-24" placeholder="Agenda, topics to discuss…" />
            </FormField>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Scheduling…' : 'Schedule Meeting'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
