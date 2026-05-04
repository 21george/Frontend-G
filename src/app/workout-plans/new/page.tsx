'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useCreateWorkoutPlan, useClients } from '@/lib/hooks'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { useState } from 'react'
import { ArrowLeft, Plus, Trash2, Save, Send } from 'lucide-react'
import Link from 'next/link'
import { DAYS } from '@/lib/utils'

const emptyExercise = { name: '', sets: 3, reps: '10', rest_seconds: 60, notes: '' }

export default function NewWorkoutPlanPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const defaultClient = searchParams.get('client') ?? ''
  const createPlan   = useCreateWorkoutPlan()
  const { data: clientsData } = useClients()
  const clients = clientsData?.data ?? []

  const [days, setDays] = useState<{ day: string; exercises: typeof emptyExercise[] }[]>([
    { day: 'monday', exercises: [{ ...emptyExercise }] }
  ])
  const [title, setTitle]         = useState('')
  const [clientId, setClientId]   = useState(defaultClient)
  const [weekStart, setWeekStart] = useState('')
  const [status, setStatus]       = useState('active')
  const [notes, setNotes]         = useState('')
  const [loading, setLoading]     = useState(false)

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

  const handleSubmit = async (e: React.FormEvent, saveMode: 'assign' | 'save') => {
    e.preventDefault()
    setLoading(true)
    try {
      const planStatus = saveMode === 'save' ? 'draft' : status
      const payload: any = {
        title,
        week_start: weekStart || undefined,
        status: planStatus,
        days,
        notes,
      }
      if (saveMode === 'assign' && clientId) {
        payload.client_id = clientId
      }
      await createPlan.mutateAsync(payload)
      router.push('/workout-plans')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div>
        <Link href="/workout-plans" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white mb-6">
          <ArrowLeft className="w-3 h-3 text-gray-100 dark:text-neutral-400" /> Back
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">New Workout Plan</h1>

        <form className="space-y-6">
          <div className="bg-[var(--bg-card)] p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Plan Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="Week 1 — Strength" required />
            </div>
            <div>
              <label className="label">Client <span className="text-slate-400 font-normal">(optional — leave empty to save as draft)</span></label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} className="input">
                <option value="">Save without assigning…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Week Start</label>
              <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="input">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input h-20 resize-none" placeholder="Plan notes…" />
            </div>
          </div>

          {/* Days */}
          <div className="space-y-4">
            {days.map((day, di) => (
              <div key={di} className="bg-[var(--bg-card)] p-3 sm:p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="label">Day</label>
                    <select value={day.day} onChange={e => updateDay(di, 'day', e.target.value)} className="input w-full sm:w-40 capitalize">
                      {DAYS.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={() => removeDay(di)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {day.exercises.map((ex, ei) => (
                    <div key={ei} className="bg-slate-50 dark:bg-gray-800 p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-12 gap-2 items-start">
                      <div className="col-span-2 sm:col-span-4">
                        <label className="label text-xs">Exercise Name</label>
                        <input value={ex.name} onChange={e => updateExercise(di, ei, 'name', e.target.value)}
                               className="input text-sm" placeholder="Exercise name" />
                      </div>
                      <div className="col-span-1 sm:col-span-1">
                        <label className="label text-xs">Sets</label>
                        <input type="number" value={ex.sets} onChange={e => updateExercise(di, ei, 'sets', +e.target.value)}
                               className="input text-sm" placeholder="Sets" min="1" />
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <label className="label text-xs">Reps</label>
                        <input value={ex.reps} onChange={e => updateExercise(di, ei, 'reps', e.target.value)}
                               className="input text-sm" placeholder="Reps" />
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <label className="label text-xs">Rest (s)</label>
                        <input type="number" value={ex.rest_seconds} onChange={e => updateExercise(di, ei, 'rest_seconds', +e.target.value)}
                               className="input text-sm" placeholder="Rest (s)" />
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <label className="label text-xs">Notes</label>
                        <input value={ex.notes} onChange={e => updateExercise(di, ei, 'notes', e.target.value)}
                               className="input text-sm" placeholder="Notes" />
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex sm:justify-end">
                        <button type="button" onClick={() => removeExercise(di, ei)} className="text-red-400 hover:text-red-600 sm:mt-7 text-xs sm:text-base flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> <span className="sm:hidden">Remove</span>
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

          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={addDay} className="btn-secondary flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Day
            </button>
            <button type="submit" onClick={(e) => handleSubmit(e, 'save')} disabled={loading || !title.trim()} className="btn-secondary flex-1 py-3 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              {loading ? 'Saving…' : 'Save as Draft'}
            </button>
            <button type="submit" onClick={(e) => handleSubmit(e, 'assign')} disabled={loading || !title.trim() || !clientId} className="btn-primary flex-1 py-3 bg-brand-600 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              {loading ? 'Saving…' : 'Assign to Client'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
