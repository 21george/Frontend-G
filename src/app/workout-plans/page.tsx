'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useWorkoutPlans } from '@/lib/hooks'
import Link from 'next/link'
import { Plus, Upload, Dumbbell, Users, Shield } from 'lucide-react'
import type { WorkoutPlanType } from '@/types'

const TYPE_CONFIG: Record<NonNullable<WorkoutPlanType>, { label: string; color: string }> = {
  individual: { label: 'Individual', color: 'badge-blue' },
  group:      { label: 'Group',      color: 'badge-amber' },
  team:       { label: 'Team',       color: 'badge-green' },
}

export default function WorkoutPlansPage() {
  const { data, isLoading } = useWorkoutPlans()
  const plans = data?.data ?? []

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Workout Plans</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{data?.pagination?.total ?? 0} plans total</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Link href="/workout-plans/import" className="btn-secondary flex items-center gap-2">
              <Upload className="w-4 h-4" /> Import Excel
            </Link>
            <Link href="/workout-plans/new" className="btn-secondary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Individual
            </Link>
            <Link href="/workout-plans/group/new" className="btn-secondary flex items-center gap-2">
              <Users className="w-4 h-4" /> Group Plan
            </Link>
            <Link href="/workout-plans/team/new" className="btn-primary flex items-center gap-2">
              <Shield className="w-4 h-4" /> Team Plan
            </Link>
          </div>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-white/[0.04] animate-pulse w-full" />
            ))
          ) : plans.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 dark:bg-white/[0.03] rounded-xl">
              <Dumbbell className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-white/20" />
              <p className="font-medium text-slate-600 dark:text-slate-300">No workout plans yet</p>
              <div className="flex gap-2 justify-center mt-4 flex-wrap">
                <Link href="/workout-plans/new" className="btn-secondary text-sm">Individual Plan</Link>
                <Link href="/workout-plans/group/new" className="btn-secondary text-sm">Group Plan</Link>
                <Link href="/workout-plans/team/new" className="btn-primary text-sm">Team Plan</Link>
                <Link href="/workout-plans/import" className="btn-secondary text-sm">Import Excel</Link>
              </div>
            </div>
          ) : (
            plans.map(plan => {
              const typeConf = TYPE_CONFIG[plan.plan_type ?? 'individual']
              return (
                <Link key={plan.id} href={`/workout-plans/${plan.id}`}
                  className="flex items-center justify-between px-5 py-4 rounded-xl bg-white dark:bg-[#171717] hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      plan.plan_type === 'team'  ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                      plan.plan_type === 'group' ? 'bg-amber-100 dark:bg-amber-900/30' :
                                                   'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      {plan.plan_type === 'team'  ? <Shield   className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> :
                       plan.plan_type === 'group' ? <Users    className="w-4 h-4 text-amber-600 dark:text-amber-400" /> :
                                                    <Dumbbell className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {plan.group_name ? `${plan.group_name} — ` : ''}{plan.title}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Week of {plan.week_start} · {plan.days?.length ?? 0} days
                        {(plan.client_ids?.length ?? 0) > 0 && ` · ${plan.client_ids!.length} clients`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className={`badge ${typeConf.color}`}>{typeConf.label}</span>
                    <span className={`badge ${plan.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{plan.status}</span>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
