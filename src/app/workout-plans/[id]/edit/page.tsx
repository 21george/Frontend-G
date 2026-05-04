'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useWorkoutPlan, useUpdateWorkoutPlan, useClients } from '@/lib/hooks'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { DAYS } from '@/lib/utils'

const emptyExercise = { name: '', sets: 3, reps: '10', rest_seconds: 60, notes: '' }

export default function EditWorkoutPlanPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: plan, isLoading: planLoading } = useWorkoutPlan(id)
  const updatePlan = useUpdateWorkoutPlan(id)
  const { data: clientsData } = useClients()
  const clients = clientsData?.data ?? []

  const [days, setDays] = useState<{ day: string; exercises: typeof emptyExercise[] }[]>([])
  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState('')
  const [weekStart, setWeekStart] = useState('')
  const [status, setStatus] = useState('active')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (plan && !initialized) {
      setTitle(plan.title ?? '')
      setClientId(plan.client_id ?? '')
      setWeekStart(plan.week_start ?? '')
      setStatus(plan.status ?? 'active')
      setNotes(plan.notes ?? '')
      setDays(plan.days?.map(d => ({
        day: d.day,
        exercises: d.exercises?.map(e => ({
          name: e.name ?? '',
          sets: e.sets ?? 3,
          reps: e.reps ?? '10',
          rest_seconds: e.rest_seconds ?? 60,
          notes: e.notes ?? ''
        })) ?? [{ ...emptyExercise }]
      })) ?? [{ day: 'monday', exercises: [{ ...emptyExercise }] }])
      setInitialized(true)
    }
  }, [plan, initialized])

  const addDay = () => {
    const used = days.map(d => d.day)
    const next = DAYS.find(d => !used.includes(d))
    if (next) setDays([...days, { day: next, exercises: [{ ...emptyExercise }] }])
  }

  const removeDay = (i: number) => setDays(days.filter((_, idx) => idx !== i))
  const addExercise = (di: number) => setDays(days.map((d, i) => i === di ? { ...d, exercises: [...d.exercises, { ...emptyExercise }] } : d))
  const removeExercise = (di: number, ei: number) => setDays(days.map((d, i) => i === di ? { ...d, exercises: d.exercises.filter((_, j) => j !== ei) } : d))

  const updateDay = (di: number, field: string, value: string) =>
    setDays(days.map((d, i) => i === di ? { ...d, [field]: value } : d))

  const updateExercise = (di: number, ei: number, field: string, value: any) =>
    setDays(days.map((d, i) => i === di ? {
      ...d,
      exercises: d.exercises.map((e, j) => j === ei ? { ...e, [field]: value } : e)
    } : d))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updatePlan.mutateAsync({ title, client_id: clientId, week_start: weekStart, status, days, notes } as any)
      router.push(`/workout-plans/${id}`)
    } finally {
      setLoading(false)
    }
  }

  if (planLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 " />
          <div className="card p-6 h-64 bg-gray-100" />
        </div>
      </DashboardLayout>
    )
  }

  if (!plan) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl text-center py-12">
          <p className="text-gray-500">Workout plan not found</p>
          <Link href="/workout-plans" className="btn-primary mt-4 inline-block">Back to Plans</Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div>
        <Link href={`/workout-plans/${id}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-3 h-3" /> Back
        </Link>
        <h1 className="text-2xl font-semibold text-gray-50 mb-6">Edit Workout Plan</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6 grid grid-cols-2 gap-4">
            <div>
              <label className="label">Plan Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="Week 1 — Strength" required />
            </div>
            <div>
              <label className="label">Client *</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} className="input" required>
                <option value="">Select client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Week Start *</label>
              <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="input">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input h-20 resize-none" placeholder="Plan notes…" />
            </div>
          </div>

          {/* Days */}
          <div className="space-y-4">
            {days.map((day, di) => (
              <div key={di} className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <select value={day.day} onChange={e => updateDay(di, 'day', e.target.value)} className="input w-40 capitalize">
                    {DAYS.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
                  </select>
                  <button type="button" onClick={() => removeDay(di)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {day.exercises.map((ex, ei) => (
                    <div key={ei} className="p-3 grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-4">
                        <input value={ex.name} onChange={e => updateExercise(di, ei, 'name', e.target.value)}
                               className="input text-sm" placeholder="Exercise name" />
                      </div>
                      <div className="col-span-1">
                        <input type="number" value={ex.sets} onChange={e => updateExercise(di, ei, 'sets', +e.target.value)}
                               className="input text-sm" placeholder="Sets" min="1" />
                      </div>
                      <div className="col-span-2">
                        <input value={ex.reps} onChange={e => updateExercise(di, ei, 'reps', e.target.value)}
                               className="input text-sm" placeholder="Reps" />
                      </div>
                      <div className="col-span-2">
                        <input type="number" value={ex.rest_seconds} onChange={e => updateExercise(di, ei, 'rest_seconds', +e.target.value)}
                               className="input text-sm" placeholder="Rest (s)" />
                      </div>
                      <div className="col-span-2">
                        <input value={ex.notes || ''} onChange={e => updateExercise(di, ei, 'notes', e.target.value)}
                               className="input text-sm" placeholder="Notes" />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button type="button" onClick={() => removeExercise(di, ei)} className="text-red-400 hover:text-red-600 mt-2">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={() => addExercise(di)}
                        className="mt-3 flex items-center gap-1 text-sm text-brand hover:text-brand-dark">
                  <Plus className="w-3.5 h-3.5" /> Add Exercise
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={addDay} className="btn-secondary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Day
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
              {loading ? 'Saving…' : 'Update Workout Plan'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
