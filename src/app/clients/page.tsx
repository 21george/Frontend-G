'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { useClients, useWorkoutPlans } from '@/lib/hooks'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Users, Plus, Search, Filter, MessageSquare, MoreVertical,
  TrendingUp, ChevronLeft, ChevronRight, Activity, CheckCircle2, XCircle,
  UsersRound, Dumbbell, AlertCircle, Clock, Upload
} from 'lucide-react'
import { QueryWrapper } from '@/components/ui/QueryWrapper'
import { Button } from '@/components/ui/button'
import { ClientsProgressChart } from '@/components/clients/ClientsProgressChart'
import { SegmentedProgressBar } from '@/components/ui/SegmentedProgressBar'
import { motion } from 'framer-motion'

// Status badge configuration - using your app's color scheme
const statusConfig: Record<string, { label: string; lightClass: string; darkClass: string }> = {
  'blocked': {
    label: 'Blocked',
    lightClass: 'bg-orange-50 text-orange-700 border border-orange-200/60 rounded-2xl',
    darkClass: 'dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800 rounded-2xl'
  },
  'on-track': {
    label: 'On Track',
    lightClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-2xl',
    darkClass: 'dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 rounded-2xl'
  },
  'new-client': {
    label: 'New Client',
    lightClass: 'bg-blue-50 text-blue-700 border border-blue-200/60 rounded-2xl',
    darkClass: 'dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 rounded-2xl'
  }
  
  
  ,
  'attention': {
    label: 'Attention Required',
    lightClass: 'bg-red-50 text-red-700 border border-red-200/60 rounded-2xl',
    darkClass: 'dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 rounded-2xl'
  },
  'completed': {
    label: 'Completed',
    lightClass: 'bg-slate-100 text-slate-600 border border-slate-200 rounded-2xl',
    darkClass: 'dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-700 rounded-2xl'
  },
}

function getStatusForClient(client: any): string {
  if (client.is_blocked) return 'blocked'
  if (!client.active) return 'completed'
  const daysSinceCreated = (() => {
    if (!client.created_at) return 30
    const createdDate = new Date(client.created_at)
    if (isNaN(createdDate.getTime())) return 30
    return Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
  })()
  if (daysSinceCreated <= 14) return 'new-client'
  if (client.notes?.toLowerCase().includes('urgent') || client.notes?.toLowerCase().includes('attention'))
    return 'attention'
  return 'on-track'
}

function getClientStatus(client: any) {
  const statusKey = getStatusForClient(client)
  return statusConfig[statusKey] || statusConfig['on-track']
}

type FilterKey = 'all' | 'active' | 'new' | 'attention' | 'group' | 'needs-plan'

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const query = useClients(search, { refetchInterval: 10_000 })
  const clients = query.data?.data ?? []
  const total = query.data?.pagination?.total ?? clients.length

  // Fetch all workout plans to calculate real progress — polls every 10s
  const allPlansQuery = useWorkoutPlans(undefined, undefined, undefined, { refetchInterval: 10_000 })
  const allPlans = allPlansQuery.data?.data ?? []

  // Build client progress map from actual workout plans
  const clientProgressMap = useMemo(() => {
    const map = new Map<string, {
      hasActivePlan: boolean
      activePlanTitle?: string
      progressPct: number
      completedDays: number
      totalDays: number
      status: string
    }>()

    for (const plan of allPlans) {
      // Get all client IDs for this plan
      const planClientIds: string[] = []
      if (plan.client_id) planClientIds.push(plan.client_id)
      if (plan.client_ids) planClientIds.push(...plan.client_ids)

      for (const cid of planClientIds) {
        const existing = map.get(cid)
        
        // Only update if this plan is active and we don't have an active one yet
        if (plan.status === 'active') {
          const totalDays = plan.days?.length ?? 0
          // Calculate completed days from plan data if available
          const completedDays = plan.days?.filter((d: any) => d.is_completed).length ?? 0
          const progressPct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0
          
          map.set(cid, {
            hasActivePlan: true,
            activePlanTitle: plan.title,
            progressPct,
            completedDays,
            totalDays,
            status: plan.status
          })
        } else if (!existing?.hasActivePlan) {
          // Only set non-active plan if no active plan exists
          const totalDays = plan.days?.length ?? 0
          const completedDays = plan.days?.filter((d: any) => d.is_completed).length ?? 0
          const progressPct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0
          
          map.set(cid, {
            hasActivePlan: false,
            activePlanTitle: plan.title,
            progressPct,
            completedDays,
            totalDays,
            status: plan.status
          })
        }
      }
    }

    return map
  }, [allPlans])

  // Fetch group workout plans to determine which clients are in group programs
  const groupPlansQuery = useWorkoutPlans(undefined, undefined, 'group')
  const teamPlansQuery = useWorkoutPlans(undefined, undefined, 'team')
  const groupPlans = [...(groupPlansQuery.data?.data ?? []), ...(teamPlansQuery.data?.data ?? [])]

  // Build a set of client IDs that are in group programs
  const groupClientIds = useMemo(() => {
    const ids = new Set<string>()
    for (const plan of groupPlans) {
      if (plan.client_ids) {
        for (const cid of plan.client_ids) {
          ids.add(cid)
        }
      }
    }
    return ids
  }, [groupPlans])
  // Filtered clients based on active filter
  const filteredClients = useMemo(() => {
    if (filter === 'all') return clients
    if (filter === 'active') return clients.filter(c => c.active)
    if (filter === 'new') {
      return clients.filter(c => {
        if (!c.created_at) return false
        const createdDate = new Date(c.created_at)
        if (isNaN(createdDate.getTime())) return false
        const days = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
        return days <= 14
      })
    }
    if (filter === 'attention') {
      return clients.filter(c =>
        c.notes?.toLowerCase().includes('urgent') ||
        c.notes?.toLowerCase().includes('attention')
      )
    }
    if (filter === 'group') return clients.filter(c => groupClientIds.has(c.id))
    if (filter === 'needs-plan') {
      return clients.filter(c => {
        const progress = clientProgressMap.get(c.id)
        return !progress?.hasActivePlan
      })
    }
    return clients
  }, [clients, filter, groupClientIds, clientProgressMap])

  const quickActions = useMemo(() => ([
    {
      href: '/clients/new',
      label: 'Add Client',
      icon: Plus,
      color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50',
    },
    {
      href: '/import-excel',
      label: 'Import Clients',
      icon: Upload,
      color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50',
    },
  ]), [])

  // Calculate stats
  const stats = useMemo(() => {
    const activeClients = clients.filter(c => c.active)
    const newClients = clients.filter(c => {
      if (!c.created_at) return false
      const createdDate = new Date(c.created_at)
      if (isNaN(createdDate.getTime())) return false
      const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceCreated <= 14
    })
    const attentionNeeded = clients.filter(c =>
      c.notes?.toLowerCase().includes('urgent') ||
      c.notes?.toLowerCase().includes('attention')
    )

    const groupProgramCount = clients.filter(c => groupClientIds.has(c.id)).length
    const needsPlanCount = clients.filter(c => {
      const progress = clientProgressMap.get(c.id)
      return !progress?.hasActivePlan
    }).length

    return {
      total: total,
      active: activeClients.length,
      newClients: newClients.length,
      attention: attentionNeeded.length,
      groupProgram: groupProgramCount,
      needsPlan: needsPlanCount,
    }
  }, [clients, total, groupClientIds, clientProgressMap])

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        <DashboardHeader
          title="Clients"
          subtitle="Track progress, manage relationships, and stay on top of client activity."
          quickActions={quickActions}
        />

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients"
            className="w-full sm:w-[12rem] py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] rounded-4 placeholder-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-brand-700/30 focus:ring-2 focus:ring-brand-700/20 transition-colors"
          />
        </div>

        {/* Filter Pills — count display */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {([
            { key: 'all', label: 'All', count: stats.total },
            { key: 'active', label: 'Active', count: stats.active },
            { key: 'new', label: 'New', count: stats.newClients },
            { key: 'attention', label: 'Attention', count: stats.attention },
            { key: 'group', label: 'Group', count: stats.groupProgram },
            { key: 'needs-plan', label: 'Needs Plan', count: stats.needsPlan },
          ] as { key: FilterKey; label: string; count: number }[]).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                filter === f.key
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white dark:bg-neutral-900 text-[var(--text-secondary)] border-[var(--border)] hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400'
              }`}
            >
              {f.label}
              <span
                className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-bold ${
                  filter === f.key
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {f.count > 999 ? '999+' : f.count}
              </span>
            </button>
          ))}
        </div>

        

        

        {/* Clients Table — Card-based grid matching server-management style */}
        <QueryWrapper
          query={query}
          emptyIcon={Users}
          emptyTitle="Add your first client to get started."
          emptyDescription="Create client profiles to manage workouts, nutrition, and progress."
          emptyAction={
            <div className="flex items-center gap-3">
              <Link href="/clients/new">
                <Button className="bg-brand-600 text-white hover:bg-brand-700">
                  <Plus className="w-4 h-4" /> Add Client
                </Button>
              </Link>
              <Link href="/import-excel">
                <Button variant="secondary">
                  <Upload className="w-4 h-4" /> Import Clients
                </Button>
              </Link>
            </div>
          }
          isEmpty={() => filteredClients.length === 0}
        >
          {(data) => (
            <div className="relative  p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">{filter === 'all' ? 'All Clients' : 'Filtered Clients'}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-[var(--text-secondary)]">
                      {filteredClients.length} shown
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      Live
                    </span>
                  </div>
                </div>
              </div>

              {/* Column Headers */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                <div className="col-span-3 sm:col-span-3">Client</div>
                <div className="col-span-3 hidden sm:block">Progress</div>
                <div className="col-span-2 hidden md:block">Last Active</div>
                <div className="col-span-3 sm:col-span-2">Status</div>
                <div className="col-span-3 sm:col-span-2 text-right">Actions</div>
              </div>

              {/* Card Rows */}
              <motion.div
                className="space-y-2"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.06,
                      delayChildren: 0.05,
                    },
                  },
                }}
                initial="hidden"
                animate="visible"
              >
                {filteredClients.map((client: any) => {
                  const status = getClientStatus(client)
                  const progress = clientProgressMap.get(client.id)
                  const hasActivePlan = progress?.hasActivePlan ?? false
                  const progressPct = progress?.progressPct ?? 0
                  const isInGroupProgram = groupClientIds.has(client.id)
                  const needsNewPlan = !hasActivePlan

                  const statusGradient =
                    status.label === 'Blocked' || status.label === 'Attention Required'
                      ? 'from-red-500/10 to-transparent'
                      : status.label === 'New Client'
                        ? 'from-blue-500/10 to-transparent'
                        : status.label === 'Completed'
                          ? 'from-slate-500/10 to-transparent'
                          : 'from-emerald-500/10 to-transparent'

                  return (
                    <motion.div
                      key={client.id}
                      variants={{
                        hidden: {
                          opacity: 0,
                          x: -20,
                          scale: 0.97,
                        },
                        visible: {
                          opacity: 1,
                          x: 0,
                          scale: 1,
                          transition: {
                            type: 'spring',
                            stiffness: 400,
                            damping: 28,
                            mass: 0.6,
                          },
                        },
                      }}
                      whileHover={{
                        y: -1,
                        transition: { type: 'spring', stiffness: 400, damping: 25 },
                      }}
                      className="relative cursor-pointer"
                    >
                      <div className="relative bg-[#13131314] dark:bg-white/[0.03]   p-4 overflow-hidden transition-colors hover:border-[var(--border-hover)]">
                        {/* Status gradient overlay */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-l ${statusGradient} pointer-events-none`}
                          style={{
                            backgroundSize: '25% 100%',
                            backgroundPosition: 'right',
                            backgroundRepeat: 'no-repeat',
                          }}
                        />

                        <div className="relative grid grid-cols-12 gap-4 items-center">
                          {/* Client */}
                          <div className="col-span-12 sm:col-span-3">
                            <div className="flex items-center gap-3">
                              {client.profile_photo_url ? (
                                <img
                                  src={client.profile_photo_url}
                                  alt={client.name}
                                  className="h-10 w-10 object-cover rounded-full bg-slate-100 dark:bg-slate-800 flex-shrink-0"
                                />
                              ) : (
                                <div className="h-10 w-10 bg-gradient-to-br from-[#132e35] to-[#0b1e22] rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                  {client.name?.[0]?.toUpperCase() ?? 'C'}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{client.name}</span>
                                  {isInGroupProgram && (
                                    <Link
                                      href="/workout-plans/"
                                      onClick={(e) => e.stopPropagation()}
                                      title="View group program"
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-tight bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-lg dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                    >
                                      <UsersRound className="w-3 h-3" />
                                      Group
                                    </Link>
                                  )}
                                  {needsNewPlan && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-tight bg-red-50 text-red-700 border border-red-200/60 rounded-lg dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
                                      <AlertCircle className="w-3 h-3" />
                                      No Plan
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-[var(--text-secondary)]">
                                  {(() => {
                                    if (!client.created_at) return 'Recently added'
                                    const createdDate = new Date(client.created_at)
                                    if (isNaN(createdDate.getTime())) return 'Recently added'
                                    const days = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
                                    return `Joined ${days} ${days === 1 ? 'day' : 'days'} ago`
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Progress */}
                          <div className="col-span-6 sm:col-span-3 hidden sm:block">
                            <div className="w-full max-w-[220px]">
                              {hasActivePlan ? (
                                <div className="w-full max-w-[240px]">
                                  <div className="flex justify-between items-center mb-1.5 text-xs">
                                    <span className="text-[var(--text-primary)] font-semibold">{progressPct}%</span>
                                    <span className="text-[var(--text-secondary)]">{progress?.completedDays ?? 0}/{progress?.totalDays ?? 0} days</span>
                                  </div>
                                  <SegmentedProgressBar
                                    percentage={progressPct}
                                    segments={10}
                                    activeColor={
                                      progressPct >= 80 ? 'bg-emerald-500' :
                                      progressPct >= 50 ? 'bg-blue-500' :
                                      progressPct >= 25 ? 'bg-amber-500' : 'bg-slate-400'
                                    }
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-900">
                                  <AlertCircle className="w-4 h-4" />
                                  <span className="text-xs font-medium">No Plan</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Last Active */}
                          <div className="col-span-2 hidden md:block">
                            <div className="text-sm text-[var(--text-primary)]">
                              {(() => {
                                if (!client.created_at) return 'Recently'
                                const date = new Date(client.created_at)
                                if (isNaN(date.getTime())) return 'Recently'
                                const now = Date.now()
                                const diff = now - date.getTime()
                                if (diff < 1000 * 60 * 60 * 24) return 'Today'
                                if (diff < 1000 * 60 * 60 * 48) return 'Yesterday'
                                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              })()}
                            </div>
                            <div className="text-xs text-[var(--text-secondary)]">Program active</div>
                          </div>

                          {/* Status */}
                          <div className="col-span-3 sm:col-span-2">
                            <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight ${status.lightClass} ${status.darkClass}`}>
                              {status.label}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="col-span-3 sm:col-span-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                href={`/messages?client=${client.id}`}
                                className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-brand-600 dark:hover:text-brand-400 hover:bg-[var(--bg-subtle)] transition-colors"
                                title="Message client"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/clients/${client.id}`}
                                className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                                title="View client"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>

              {/* Pagination */}
              <div className="mt-4 px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">
                  Showing 1-{Math.min(10, filteredClients.length)} of {filteredClients.length} clients
                </span>
                <div className="flex gap-2">
                  <button className="p-1.5 border rounded-xl border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-50" disabled>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 border rounded-xl border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-50" disabled={filteredClients.length <= 10}>
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
