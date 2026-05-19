'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { useClients, useWorkoutPlans } from '@/lib/hooks'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Users, Plus, Search, Filter, MessageSquare, MoreVertical,
  TrendingUp, ChevronLeft, ChevronRight, Activity, CheckCircle2, XCircle,
  UsersRound, Dumbbell, AlertCircle, Clock
} from 'lucide-react'
import { QueryWrapper } from '@/components/ui/QueryWrapper'
import { Button } from '@/components/ui/button'
import { ClientsProgressChart } from '@/components/clients/ClientsProgressChart'
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
  },
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

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const query = useClients(search)
  const clients = query.data?.data ?? []
  const total = query.data?.pagination?.total ?? clients.length

  // Fetch all workout plans to calculate real progress
  const allPlansQuery = useWorkoutPlans()
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
  const quickActions = useMemo(() => ([
    {
      href: '/clients/new',
      label: 'Add Client',
      icon: Plus,
      color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50',
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
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients"
            className="w-[12rem]   py-3 pl-11 pr-4 text-sm text-[var(--text-primary)]  rounded-4 placeholder-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-brand-700/30 focus:ring-2 focus:ring-brand-700/20 transition-colors"
          />
        </div>

        

        

        {/* Clients Table */}
        <QueryWrapper
          query={query}
          emptyIcon={Users}
          emptyTitle="Add your first client to get started."
          emptyDescription="Create client profiles to manage workouts, nutrition, and progress."
          emptyAction={
            <Link href="/clients/new">
              <Button className="bg-brand-600 text-white hover:bg-brand-700">
                <Plus className="w-4 h-4" /> Add Client
              </Button>
            </Link>
          }
          isEmpty={(data) => (data?.data ?? []).length === 0}
        >
          {(data) => (
            <div className="rounded-xl border-slate-200/80 dark:border-white/[0.08] overflow-hidden ">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-white/[0.08]">
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
                      const progress = clientProgressMap.get(client.id)
                      const hasActivePlan = progress?.hasActivePlan ?? false
                      const progressPct = progress?.progressPct ?? 0
                      const isInGroupProgram = groupClientIds.has(client.id)
                      const needsNewPlan = !hasActivePlan

                      return (
                        <motion.tr
                          key={client.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="hover:bg-slate-50/50 dark:hover:bg-white/[0.03]  rounded-xl transition-colors group"
                        >
                          <td className="px-4 lg:px-6 py-4">
                            <div className="flex items-center gap-3">
                              {client.profile_photo_url ? (
                                <img
                                  src={client.profile_photo_url}
                                  alt={client.name}
                                  className="h-10 w-10 object-cover rounded-xl bg-slate-100 dark:bg-slate-800"
                                />
                              ) : (
                                <div className="h-10 w-10 bg-gradient-to-br from-[#132e35] to-[#0b1e22] rounded-xl flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                  {client.name?.[0]?.toUpperCase() ?? 'C'}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">{client.name}</div>
                                  {isInGroupProgram && (
                                    <Link 
                                      href={`/workout-plans/`}
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
                                      Needs Plan
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-neutral-400">
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
                          </td>

                          <td className="px-4 lg:px-6 py-4 hidden sm:table-cell">
                            <div className="w-full max-w-[200px]">
                              {hasActivePlan ? (
                                <>
                                  <div className="flex justify-between items-center mb-1.5 text-xs">
                                    <span className="text-[var(--text-primary)] dark:text-[var(--text-primary)] font-semibold">
                                      {progressPct}%
                                    </span>
                                    <span className="text-slate-500 dark:text-neutral-400">
                                      {progress?.completedDays ?? 0}/{progress?.totalDays ?? 0} days
                                    </span>
                                  </div>
                                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        progressPct >= 80 ? 'bg-emerald-500' : 
                                        progressPct >= 50 ? 'bg-blue-500' : 
                                        progressPct >= 25 ? 'bg-amber-500' : 'bg-slate-400'
                                      }`}
                                      style={{ width: `${Math.min(100, progressPct)}%` }}
                                    />
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                  <AlertCircle className="w-4 h-4" />
                                  <span className="text-xs font-medium">Needs Plan</span>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                            <div className="text-sm text-[var(--text-primary)] dark:text-[var(--text-primary)]">
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
                            <div className="text-xs text-slate-500 dark:text-neutral-400">Program active</div>
                          </td>

                          <td className="px-4 lg:px-6 py-4">
                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight ${status.lightClass} ${status.darkClass}`}>
                              {status.label}
                            </span>
                          </td>

                          <td className="px-4 lg:px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/messages?client=${client.id}`}
                                className="p-2 rounded-md text-[var(--text-tertiary)] hover:text-brand-600 dark:hover:text-brand-400 hover:bg-[var(--bg-subtle)] transition-colors"
                                title="Message client"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/clients/${client.id}`}
                                className="p-2 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                                title="View client"
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
                  <button className="p-1.5 border rounded-xl border-slate-200 dark:border-white/[0.1] text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors disabled:opacity-50" disabled>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 border rounded-xl border-slate-200 dark:border-white/[0.1] text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors disabled:opacity-50" disabled={total <= 10}>
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
