'use client'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useWorkoutPlan, useClients, useAssignWorkoutPlan } from '@/lib/hooks'
import Link from 'next/link'
import { useState } from 'react'
import {
  ChevronRight, ArrowLeft, Users, Check, Dumbbell, Calendar,
  Loader2, Search, X, UserPlus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AssignWorkoutPlanPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: plan, isLoading: planLoading } = useWorkoutPlan(id)
  const { data: clientsData } = useClients()
  const assignMutation = useAssignWorkoutPlan(id)

  const clients = clientsData?.data ?? []
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const isLoading = planLoading

  const filteredClients = clients.filter(client => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return client.name?.toLowerCase().includes(q) ||
           client.email?.toLowerCase().includes(q)
  })

  const toggleClient = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    )
  }

  const handleAssign = async () => {
    if (selectedClients.length === 0) return
    await assignMutation.mutateAsync(selectedClients)
    router.push(`/workout-plans/${id}`)
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl space-y-4">
          <div className="h-8 w-48 bg-slate-100 dark:bg-white/[0.04] animate-pulse" />
          <div className="bg-slate-50 dark:bg-white/[0.03] p-6 space-y-3 animate-pulse">
            <div className="h-6 w-64 bg-slate-200 dark:bg-white/[0.06]" />
            <div className="h-4 w-32 bg-slate-100 dark:bg-white/[0.04]" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!plan) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Workout plan not found</p>
          <Link href="/workout-plans" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Plans
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400 mb-3 uppercase tracking-tighter">
              <Link href="/workout-plans" className="hover:text-brand-600 dark:hover:text-brand-300 transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/workout-plans" className="hover:text-brand-600 dark:hover:text-brand-300 transition-colors">
                Workout Plans
              </Link>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/workout-plans/${id}`} className="hover:text-brand-600 dark:hover:text-brand-300 transition-colors truncate max-w-[150px]">
                {plan.title}
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-brand-600 dark:text-brand-300">Assign</span>
            </nav>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Assign Workout Plan
            </h1>
            <p className="text-slate-500 dark:text-neutral-400 mt-2 max-w-lg text-sm">
              Select clients to assign this workout plan to
            </p>
          </div>
        </div>

        {/* ── PLAN INFO CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-card)] border border-slate-200/80 dark:border-white/[0.08] p-5 "
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{plan.title}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  Week of {plan.week_start}
                </span>
                <span className="flex items-center gap-1">
                  <Dumbbell size={14} />
                  {plan.days?.length || 0} workout days
                </span>
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {plan.plan_type}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── TWO COLUMN LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── CLIENTS LIST ── */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[var(--bg-card)] border border-slate-200/80 dark:border-white/[0.08] overflow-hidden "
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Select Clients</h3>
                  </div>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search clients..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-48 pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-brand-600/20 dark:focus:ring-brand-400/20"
                    />
                  </div>
                </div>
              </div>

              {/* Clients Grid */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                {filteredClients.map((client) => {
                  const isSelected = selectedClients.includes(client.id)
                  return (
                    <motion.button
                      key={client.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleClient(client.id)}
                      className={`relative p-4 border text-left transition-all ${
                        isSelected
                          ? 'bg-brand-600/5 dark:bg-brand-600/20 border-brand-500/50 -500/10'
                          : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                          {client.name?.[0]?.toUpperCase() ?? 'C'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {client.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {client.email}
                          </div>
                        </div>
                        <div className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected
                            ? 'bg-brand-500 border-brand-500'
                            : 'border-slate-300 dark:border-white/[0.2]'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
                {filteredClients.length === 0 && (
                  <div className="col-span-full py-8 text-center text-slate-500 dark:text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No clients found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ── SELECTION SUMMARY ── */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[var(--bg-card)] border border-slate-200/80 dark:border-white/[0.08] p-5 sticky top-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Selection Summary</h3>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{selectedClients.length}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">clients selected</div>
              </div>

              {/* Selected clients list */}
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                <AnimatePresence>
                  {selectedClients.map(clientId => {
                    const client = clients.find(c => c.id === clientId)
                    if (!client) return null
                    return (
                      <motion.div
                        key={clientId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-white/[0.04] "
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                            {client.name?.[0]?.toUpperCase() ?? 'C'}
                          </div>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                            {client.name}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleClient(clientId)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors"
                        >
                          <X size={12} className="text-slate-400" />
                        </button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
                {selectedClients.length === 0 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                    No clients selected yet
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleAssign}
                  disabled={selectedClients.length === 0 || assignMutation.isPending}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 dark:disabled:bg-white/[0.1] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                >
                  {assignMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Assign to {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
                <Link
                  href={`/workout-plans/${id}`}
                  className="block w-full py-2.5 text-center text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
