'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useClients } from '@/lib/hooks'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Users, Plus, Search, Filter, MessageSquare, MoreVertical,
  TrendingUp, ChevronLeft, ChevronRight, Activity, CheckCircle2, XCircle
} from 'lucide-react'
import { QueryWrapper } from '@/components/ui/QueryWrapper'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

// Status badge configuration - using your app's color scheme
const statusConfig: Record<string, { label: string; lightClass: string; darkClass: string }> = {
  'on-track': {
    label: 'On Track',
    lightClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    darkClass: 'dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
  },
  'new-client': {
    label: 'New Client',
    lightClass: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    darkClass: 'dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
  },
  'attention': {
    label: 'Attention Required',
    lightClass: 'bg-red-50 text-red-700 border border-red-200/60',
    darkClass: 'dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
  },
  'completed': {
    label: 'Completed',
    lightClass: 'bg-slate-100 text-slate-600 border border-slate-200',
    darkClass: 'dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-700'
  },
}

function getStatusForClient(client: any): string {
  if (!client.active) return 'completed'
  const daysSinceCreated = client.created_at
    ? Math.floor((Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 30
  if (daysSinceCreated <= 14) return 'new-client'
  if (client.notes?.toLowerCase().includes('urgent') || client.notes?.toLowerCase().includes('attention'))
    return 'attention'
  return 'on-track'
}

function getClientStatus(client: any) {
  const statusKey = getStatusForClient(client)
  return statusConfig[statusKey] || statusConfig['on-track']
}

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const query = useClients(search)
  const clients = query.data?.data ?? []
  const total = query.data?.pagination?.total ?? clients.length

  // Calculate stats
  const stats = useMemo(() => {
    const activeClients = clients.filter(c => c.active)
    const newClients = clients.filter(c => {
      const daysSinceCreated = c.created_at
        ? Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0
      return daysSinceCreated <= 14
    })
    const attentionNeeded = clients.filter(c =>
      c.notes?.toLowerCase().includes('urgent') ||
      c.notes?.toLowerCase().includes('attention')
    )

    return {
      total: total,
      active: activeClients.length,
      newClients: newClients.length,
      attention: attentionNeeded.length,
    }
  }, [clients, total])

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        {/* Header Section */}
        

        

          {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients"
            className="w-5/4 bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/[0.1] rounded-m py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-cyan-700/30 focus:ring-2 focus:ring-cyan-700/20 transition-colors"
          />
        </div>

         {/* Daily Protocol Adherence Chart */}
        <div className="mt-8 grid grid-cols-1 mb-5 lg:grid-cols-3 gap-6 bt-5">
          <div className='p-6'> 
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-950 dark:text-[#b3d2ef]" />
                Daily Protocol Adherence
              </h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-500 dark:text-neutral-400">Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                  <span className="text-slate-500 dark:text-neutral-400">Missed</span>
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="h-48 flex items-end justify-between gap-2">
              {[
                { day: 'M', completed: 75, total: 100 },
                { day: 'T', completed: 68, total: 100 },
                { day: 'W', completed: 82, total: 100 },
                { day: 'T', completed: 55, total: 100 },
                { day: 'F', completed: 70, total: 100 },
                { day: 'S', completed: 45, total: 100 },
                { day: 'S', completed: 30, total: 100 },
              ].map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-2 w-full">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg h-40 relative overflow-hidden">
                    <div
                      className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-600 to-emerald-400 opacity-80 rounded-t-lg transition-all duration-500"
                      style={{ height: `${(d.completed / d.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Protocol Insight Card */}
         
        </div>

        

        {/* Clients Table */}
        <QueryWrapper
          query={query}
          emptyIcon={Users}
          emptyTitle="No clients yet"
          emptyDescription="Add your first client to get started"
          emptyAction={
            <Link href="/clients/new">
              <Button className="bg-cyan-950 text-white hover:bg-cyan-900">
                <Plus className="w-4 h-4" /> Add Client
              </Button>
            </Link>
          }
          isEmpty={(data) => (data?.data ?? []).length === 0}
        >
          {(data) => (
            <div className="bg-white dark:bg-[#171717] rounded-xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-white/[0.04] border-b border-slate-200/80 dark:border-white/[0.08]">
                      <th className="px-4 lg:px-6 py-4 text-[10px] lg:text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Client</th>
                      <th className="px-4 lg:px-6 py-4 text-[10px] lg:text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider hidden sm:table-cell">Progress</th>
                      <th className="px-4 lg:px-6 py-4 text-[10px] lg:text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider hidden md:table-cell">Last Active</th>
                      <th className="px-4 lg:px-6 py-4 text-[10px] lg:text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 lg:px-6 py-4 text-[10px] lg:text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                    {(data.data ?? []).map((client: any, index) => {
                      const status = getClientStatus(client)
                      const daysSinceCreated = client.created_at
                        ? Math.floor((Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24))
                        : 30
                      const progress = Math.min(100, Math.max(5, 100 - (daysSinceCreated * 2)))

                      return (
                        <motion.tr
                          key={client.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="hover:bg-slate-50/50 dark:hover:bg-white/[0.03] transition-colors group"
                        >
                          <td className="px-4 lg:px-6 py-4">
                            <div className="flex items-center gap-3">
                              {client.profile_photo_url ? (
                                <img
                                  src={client.profile_photo_url}
                                  alt={client.name}
                                  className="h-10 w-10 rounded-xl object-cover bg-slate-100 dark:bg-slate-800"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                  {client.name?.[0]?.toUpperCase() ?? 'C'}
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-semibold text-slate-900 dark:text-white">{client.name}</div>
                                <div className="text-xs text-slate-500 dark:text-neutral-400">
                                  {client.created_at
                                    ? `Joined ${daysSinceCreated} ${daysSinceCreated === 1 ? 'day' : 'days'} ago`
                                    : 'Recently added'}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 lg:px-6 py-4 hidden sm:table-cell">
                            <div className="w-full max-w-[180px]">
                              <div className="flex justify-between items-center mb-1 text-xs">
                                <span className="text-slate-900 dark:text-white font-medium">{progress}%</span>
                                <span className="text-slate-500 dark:text-neutral-400">Week {Math.ceil(progress / 16)}/6</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    progress < 30 ? 'bg-red-500' : progress < 60 ? 'bg-blue-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                            <div className="text-sm text-slate-900 dark:text-white">
                              {client.created_at
                                ? (() => {
                                    const date = new Date(client.created_at)
                                    const now = Date.now()
                                    const diff = now - date.getTime()
                                    if (diff < 1000 * 60 * 60 * 24) return 'Today'
                                    if (diff < 1000 * 60 * 60 * 48) return 'Yesterday'
                                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                  })()
                                : 'Recently'}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-neutral-400">Program active</div>
                          </td>

                          <td className="px-4 lg:px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight ${status.lightClass} ${status.darkClass}`}>
                              {status.label}
                            </span>
                          </td>

                          <td className="px-4 lg:px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/clients/${client.id}`}
                                className="p-2 text-slate-400 hover:text-cyan-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors rounded-lg"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/clients/${client.id}`}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors rounded-lg"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Link>
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 lg:px-6 py-4 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-neutral-400">
                  Showing 1-{Math.min(10, total)} of {total} clients
                </span>
                <div className="flex gap-2">
                  <button className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors disabled:opacity-50" disabled>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors disabled:opacity-50" disabled={total <= 10}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </QueryWrapper>

       
      </div>
    </DashboardLayout>
  )
}
