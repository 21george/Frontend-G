'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useClients } from '@/lib/hooks'
import { useState } from 'react'
import api from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Image as ImageIcon, Video } from 'lucide-react'
import { PageHeader } from '@/components/ui/FormField'
import { FormField, SelectInput } from '@/components/ui/FormField'

export default function MediaPage() {
  const [selectedClient, setSelectedClient] = useState('')
  const { data: clientsData } = useClients()
  const clients = clientsData?.data ?? []

  const { data: media } = useQuery({
    queryKey: ['media', selectedClient],
    queryFn: () => api.get(`/coach/media/${selectedClient}`).then(r => r.data.data),
    enabled: !!selectedClient,
  })

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <PageHeader title="Client Media" />
        <div className="mb-6 max-w-xs">
          <FormField label="Client">
            <SelectInput
              value={selectedClient}
              onChange={e => setSelectedClient(e.target.value)}
              options={clients.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Select a client…"
            />
          </FormField>
        </div>

        {!selectedClient ? (
          <div className="card p-12 text-center text-gray-400">
            <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Select a client to view their media uploads</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {(media ?? []).map((m: any) => (
              <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer"
                 className="card aspect-square overflow-hidden flex items-center justify-center hover:opacity-90 transition-opacity group relative">
                {m.type === 'video' ? (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Video className="w-8 h-8" />
                    <span className="text-xs">Video</span>
                  </div>
                ) : (
                  <img src={m.url} alt="upload" className="w-full h-full object-cover" />
                )}
              </a>
            ))}
            {media && media.length === 0 && (
              <div className="col-span-full p-8 text-center text-gray-400 text-sm">No media uploads yet</div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
