'use client'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useWorkoutPlan, useClient } from '@/lib/hooks'
import Link from 'next/link'
import { ArrowLeft, Edit, Dumbbell, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function WorkoutPlanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: plan, isLoading, error } = useWorkoutPlan(id)
  const { data: client } = useClient(plan?.client_id ?? '')

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl space-y-4">
          <div className="h-8 w-48 rounded-xl bg-slate-100 dark:bg-white/[0.04] animate-pulse" />
          <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-6 space-y-3 animate-pulse">
            <div className="h-6 w-64 rounded bg-slate-200 dark:bg-white/[0.06]" />
            <div className="h-4 w-32 rounded bg-slate-100 dark:bg-white/[0.04]" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !plan) {
    return (
      <DashboardLayout>
        <div >
          <div className="card p-12 text-center">
            <Dumbbell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">Workout plan not found</p>
            <Link href="/workout-plans" className="btn-primary mt-4 inline-block">
              Back to Plans
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div>
        <Link href="/workout-plans" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-3 h-3" /> Back to Plans
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-sans font-semibold text-slate-900 dark:text-white">{plan.title}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Week of {plan.week_start}
              {client && <span> · {client.name}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`badge ${plan.status === 'active' ? 'bg-green-100 text-green-700' : plan.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{plan.status}</span>
            <Link href={`/workout-plans/${id}/edit`} className="btn-secondary flex items-center gap-2 transition-colors duration-200 ease-in-out">
              <Edit className="w-4 h-4" /> Edit
            </Link>
          </div>
        </div>

        {plan.notes && (
          <div className="rounded-xl p-4 mb-6 bg-amber-50 dark:bg-amber-900/10">
            <p className="text-sm text-amber-800 dark:text-amber-200">{plan.notes}</p>
          </div>
        )}

        <div className="space-y-4">
          {plan.days?.map((day, di) => (
            <div key={di} className="rounded-xl bg-white dark:bg-[#171717] overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-white/[0.03]">
                <h3 className="font-semibold text-slate-900 dark:text-white capitalize">{day.day}</h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {day.exercises?.map((ex, ei) => (
                  <div key={ei} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-sans font-medium text-slate-900 dark:text-white">{ex.name}</p>
                      {ex.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{ex.notes}</p>}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                      <span>{ex.sets} sets × {ex.reps}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {ex.rest_seconds}s
                      </span>
                    </div>
                  </div>
                ))}
                {(!day.exercises || day.exercises.length === 0) && (
                  <div className="px-4 py-6 text-center text-slate-400 dark:text-slate-500 text-sm">
                    No exercises for this day
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
          {(!plan.days || plan.days.length === 0) && (
            <div className="card p-12 text-center text-gray-400">
              <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No workout days configured</p>
            </div>
          )}
        </div>
    </DashboardLayout>
  )
}
