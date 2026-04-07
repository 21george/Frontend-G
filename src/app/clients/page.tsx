'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useClients } from '@/lib/hooks'
import { useState } from 'react'
import Link from 'next/link'
import { Users, Plus, Search, Mail, Phone, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Client } from '@/types'

const ClientCard: React.FC<{ client: Client }> = ({ client }) => (
  <Link
    href={`/clients/${client.id}`}
    className="bg-white dark:bg-[#171717] border border-slate-200/80 dark:border-white/[0.07] p-3 hover:border-slate-300 dark:hover:border-white/20 transition-colors block"
  >
    {/* Header */}
    <div className="flex items-center gap-2 mb-2.5">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-800 to-cyan-950 flex items-center justify-center text-[12px] font-semibold text-white flex-shrink-0">
        {client.name[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-slate-900 dark:text-white truncate">{client.name}</div>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">
          <Mail size={10} className="text-slate-400 dark:text-slate-500" />
          <span className="truncate">{client.email || 'No email'}</span>
        </div>
      </div>
    </div>

    {/* Stats */}
    <div className="flex gap-3 py-1.5 border-t border-b border-slate-100 dark:border-white/[0.06] mb-2">
      <div className={`flex items-center gap-1 text-[11px] ${client.active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {client.active ? 'Active' : 'Inactive'}
      </div>
      {client.phone && (
        <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
          <Phone size={11} />
          {client.phone}
        </div>
      )}
    </div>

    {/* Language */}
    <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-600 mb-1.5">
      <span className="uppercase">{client.language}</span>
    </div>

    {/* Footer */}
    <div className="flex items-center justify-between mt-1">
      <span className="text-[10px] text-slate-400 dark:text-slate-600 flex items-center gap-1">
        <Calendar size={10} />
        {formatDate(client.created_at, 'MMM yyyy')}
      </span>
    </div>
  </Link>
);

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useClients(search)
  const clients             = data?.data ?? []

  return (
    <DashboardLayout>
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Clients</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{data?.pagination?.total ?? 0} total clients</p>
          </div>
          <Link href="/clients/new" className="btn-primary bg-cyan-950 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Client
          </Link>
        </div>

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
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-100 dark:bg-[#1e1e28] border border-slate-200/80 dark:border-white/[0.07]  p-3 animate-pulse">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-white/10" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-2/3" />
                    <div className="h-2 bg-slate-200/60 dark:bg-white/5 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-6 bg-slate-200/60 dark:bg-white/5 rounded my-2" />
                <div className="h-3 bg-slate-200/60 dark:bg-white/5 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-white dark:bg-[#171717] border border-slate-200/80 dark:border-white/[0.07] p-12 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
            <p className="font-medium text-slate-900 dark:text-white">No clients yet</p>
            <p className="text-sm mt-1 text-slate-500 dark:text-slate-500">Add your first client to get started</p>
            <Link href="/clients/new" className="btn-primary bg-cyan-950 mt-4 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Client
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {clients.map(client => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
