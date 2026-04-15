'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useClients } from '@/lib/hooks'
import { useState } from 'react'
import Link from 'next/link'
import { Users, Plus, Search } from 'lucide-react'
import { ClientCard } from '@/components/ui/ClientCard'
import { QueryWrapper } from '@/components/ui/QueryWrapper'
import { PageHeader } from '@/components/ui/FormField'
import { Button } from '@/components/ui/button'

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const query = useClients(search)
  const total = query.data?.pagination?.total ?? 0

  return (
    <DashboardLayout>
      <div className="w-full">
        <PageHeader
          title="Clients"
          subtitle={`${total} total clients`}
          actions={
            <Link href="/clients/new">
              <Button><Plus className="w-4 h-4" /> Add Client</Button>
            </Link>
          }
        />

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients by name or email…"
            className="input pl-9"
          />
        </div>

        {/* Grid */}
        <QueryWrapper
          query={query}
          emptyIcon={Users}
          emptyTitle="No clients yet"
          emptyDescription="Add your first client to get started"
          emptyAction={
            <Link href="/clients/new">
              <Button><Plus className="w-4 h-4" /> Add Client</Button>
            </Link>
          }
          isEmpty={(data) => (data?.data ?? []).length === 0}
        >
          {(data) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {(data.data ?? []).map(client => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          )}
        </QueryWrapper>
      </div>
    </DashboardLayout>
  )
}
