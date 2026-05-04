'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useCreateGroupWorkoutPlan, useClients } from '@/lib/hooks'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Plus, Trash2, Users, Check } from 'lucide-react'
import Link from 'next/link'
import { DAYS } from '@/lib/utils'
import type { Client } from '@/types'

const emptyExercise = { name: '', sets: 3, reps: '10', rest_seconds: 60, notes: '' }

export default function NewGroupWorkoutPlanPage() {
  const router      = useRouter()
  const createPlan  = useCreateGroupWorkoutPlan()
  const { data: clientsData } = useClients()
  const clients = clientsData?.data ?? []

  const [title, setTitle]           = useState('')
  const [groupName, setGroupName]   = useState('')
  const [weekStart, setWeekStart]   = useState('')
  const [status, setStatus]         = useState('active')
  const [notes, setNotes]           = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading]       = useState(false)
  const [days, setDays] = useState<{ day: string; exercises: typeof emptyExercise[] }[]>([
    { day: 'monday', exercises: [{ ...emptyExercise }] },
  ])

  const toggleClient = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const addDay = () => {
    const used = days.map(d => d.day)
    const next = DAYS.find(d => !used.includes(d))
    if (next) setDays([...days, { day: next, exercises: [{ ...emptyExercise }] }])
  }
  const removeDay       = (i: number) => setDays(days.filter((_, idx) => idx !== i))
  const addExercise     = (di: number) => setDays(days.map((d, i) => i === di ? { ...d, exercises: [...d.exercises, { ...emptyExercise }] } : d))
  const removeExercise  = (di: number, ei: number) => setDays(days.map((d, i) => i === di ? { ...d, exercises: d.exercises.filter((_, j) => j !== ei) } : d))
  const updateDay       = (di: number, field: string, value: string) => setDays(days.map((d, i) => i === di ? { ...d, [field]: value } : d))
  const updateExercise  = (di: number, ei: number, field: string, value: any) =>
    setDays(days.map((d, i) => i === di ? { ...d, exercises: d.exercises.map((e, j) => j === ei ? { ...e, [field]: value } : e) } : d))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createPlan.mutateAsync({
        plan_type: 'group',
        title,
        group_name: groupName || undefined,
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
      <div className="max-w-4xl">
        <Link href="/workout-plans" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-white mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Plans
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">New Group Workout Plan</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Create a shared plan — assign to multiple clients at once</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Plan details */}
          <div className="card grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Plan Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="e.g. Morning Strength · Week 1" required />
            </div>
            <div>
              <label className="label">Group Name <span className="text-slate-400 text-xs">(optional)</span></label>
              <input value={groupName} onChange={e => setGroupName(e.target.value)} className="input" placeholder="e.g. Morning Group, Team Alpha" />
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
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input h-20 resize-none" placeholder="Plan notes…" />
            </div>
          </div>

          {/* Client assignment */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">Assign to Clients</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select one or more clients — or leave empty to save as a template
                </p>
              </div>
              {selectedIds.length > 0 && (
                <span className="badge badge-blue">{selectedIds.length} selected</span>
              )}
            </div>

            {clients.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No clients yet. <Link href="/clients/new" className="text-blue-600 hover:underline">Add one first.</Link></p>
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
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500/60'
                          : 'border-slate-200 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.12]'
                      }`}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {client.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{client.name}</p>
                        <p className="text-xs text-slate-400 truncate">{client.email || 'No email'}</p>
                      </div>
                      <div className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selected ? 'border-blue-500 bg-blue-500' : 'border-slate-200 dark:border-white/20'
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
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating…' : `Create Group Plan${selectedIds.length > 0 ? ` & Assign to ${selectedIds.length} Client${selectedIds.length > 1 ? 's' : ''}` : ''}`}
            </button>
            <Link href="/workout-plans" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
