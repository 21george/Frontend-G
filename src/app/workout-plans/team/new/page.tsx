'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useCreateGroupWorkoutPlan, useClients } from '@/lib/hooks'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Plus, Trash2, Check, Shield } from 'lucide-react'
import Link from 'next/link'
import { DAYS } from '@/lib/utils'
import type { Client } from '@/types'

const emptyExercise = { name: '', sets: 3, reps: '10', rest_seconds: 60, notes: '' }

export default function NewTeamWorkoutPlanPage() {
  const router      = useRouter()
  const createPlan  = useCreateGroupWorkoutPlan()
  const { data: clientsData } = useClients()
  const clients = clientsData?.data ?? []

  const [title, setTitle]             = useState('')
  const [teamName, setTeamName]       = useState('')
  const [weekStart, setWeekStart]     = useState('')
  const [status, setStatus]           = useState('active')
  const [notes, setNotes]             = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading]         = useState(false)
  const [days, setDays] = useState<{ day: string; exercises: typeof emptyExercise[] }[]>([
    { day: 'monday', exercises: [{ ...emptyExercise }] },
  ])

  const toggleClient   = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const addDay         = () => {
    const used = days.map(d => d.day)
    const next = DAYS.find(d => !used.includes(d))
    if (next) setDays([...days, { day: next, exercises: [{ ...emptyExercise }] }])
  }
  const removeDay      = (i: number) => setDays(days.filter((_, idx) => idx !== i))
  const addExercise    = (di: number) => setDays(days.map((d, i) => i === di ? { ...d, exercises: [...d.exercises, { ...emptyExercise }] } : d))
  const removeExercise = (di: number, ei: number) => setDays(days.map((d, i) => i === di ? { ...d, exercises: d.exercises.filter((_, j) => j !== ei) } : d))
  const updateDay      = (di: number, field: string, value: string) => setDays(days.map((d, i) => i === di ? { ...d, [field]: value } : d))
  const updateExercise = (di: number, ei: number, field: string, value: any) =>
    setDays(days.map((d, i) => i === di ? { ...d, exercises: d.exercises.map((e, j) => j === ei ? { ...e, [field]: value } : e) } : d))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createPlan.mutateAsync({
        plan_type: 'team',
        title,
        group_name: teamName || undefined,
        client_ids: selectedIds.length > 0 ? selectedIds : undefined,
        week_start: weekStart,
        status: status as any,
        days,
        notes: notes || undefined,
      })
      router.push('/workout-plans')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div>
        <Link href="/workout-plans" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-white mb-6">
          <ArrowLeft className="w-3.5 h-3.5 text-gray-100 dark:text-neutral-200" /> Back to Plans
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand-600 dark:bg-emerald-900/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">New Team Workout Plan</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Create a plan for a named team — assign now or use as a template</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Plan details */}
          <div className="card grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Team Name *</label>
              <input value={teamName} onChange={e => setTeamName(e.target.value)} className="input" placeholder="e.g. Elite Squad, Team Phoenix" required />
            </div>
            <div>
              <label className="label">Plan Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="e.g. Power Block · Week 1" required />
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
              </select>
            </div>
            <div className="col-span-full">
              <label className="label">Notes <span className="text-slate-400 text-xs">(optional)</span></label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input h-20 resize-none" placeholder="Plan focus, intensity notes…" />
            </div>
          </div>

          {/* Client assignment */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">Team Members</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select clients for this team — or leave empty to save as a reusable template
                </p>
              </div>
              {selectedIds.length > 0 && (
                <span className="badge badge-green">{selectedIds.length} member{selectedIds.length > 1 ? 's' : ''}</span>
              )}
            </div>

            {clients.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                No clients yet. <Link href="/clients/new" className="text-blue-600 hover:underline">Add one first.</Link>
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {clients.map((client: Client) => {
                  const selected = selectedIds.includes(client.id)
                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => toggleClient(client.id)}
                      className={`flex items-center gap-3 p-3 border transition-all text-left ${
                        selected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-500/60'
                          : 'border-slate-200 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.12]'
                      }`}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {client.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{client.name}</p>
                        <p className="text-xs text-slate-400 truncate">{client.email || 'No email'}</p>
                      </div>
                      <div className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-200 dark:border-white/20'
                      }`}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Days / Exercises */}
          <div className="space-y-4">
            {days.map((day, di) => (
              <div key={di} className="card">
                <div className="flex items-center justify-between mb-4">
                  <select value={day.day} onChange={e => updateDay(di, 'day', e.target.value)} className="input w-36 capitalize">
                    {DAYS.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
                  </select>
                  <button type="button" onClick={() => removeDay(di)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {day.exercises.map((ex, ei) => (
                    <div key={ei} className="bg-slate-50 dark:bg-white/[0.03] p-3 grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-4">
                        <input value={ex.name} onChange={e => updateExercise(di, ei, 'name', e.target.value)}
                          className="input text-sm" placeholder="Exercise name" />
                      </div>
                      <div className="col-span-2">
                        <input type="number" value={ex.sets} onChange={e => updateExercise(di, ei, 'sets', +e.target.value)}
                          className="input text-sm" placeholder="Sets" min="1" />
                      </div>
                      <div className="col-span-2">
                        <input value={ex.reps} onChange={e => updateExercise(di, ei, 'reps', e.target.value)}
                          className="input text-sm" placeholder="Reps" />
                      </div>
                      <div className="col-span-2">
                        <input type="number" value={ex.rest_seconds} onChange={e => updateExercise(di, ei, 'rest_seconds', +e.target.value)}
                          className="input text-sm" placeholder="Rest (s)" min="0" />
                      </div>
                      <div className="col-span-1">
                        <input value={ex.notes} onChange={e => updateExercise(di, ei, 'notes', e.target.value)}
                          className="input text-sm" placeholder="Note" />
                      </div>
                      <div className="col-span-1 flex justify-end pt-1">
                        <button type="button" onClick={() => removeExercise(di, ei)} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => addExercise(di)}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1">
                    <Plus className="w-3.5 h-3.5" /> Add exercise
                  </button>
                </div>
              </div>
            ))}

            <button type="button" onClick={addDay}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Plus className="w-4 h-4" /> Add training day
            </button>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary bg-brand-600">
              {loading ? 'Creating…' : `Create Team Plan${selectedIds.length > 0 ? ` for ${selectedIds.length} Member${selectedIds.length > 1 ? 's' : ''}` : ''}`}
            </button>
            <Link href="/workout-plans" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
