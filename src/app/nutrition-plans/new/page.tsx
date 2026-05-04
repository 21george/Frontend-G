'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useCreateNutritionPlan, useClients } from '@/lib/hooks'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { DAYS } from '@/lib/utils'

const emptyFood = { name: '', quantity: '', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
const emptyMeal = { meal_name: 'Breakfast', time: '08:00', foods: [{ ...emptyFood }] }

export default function NewNutritionPlanPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { data: clientsData } = useClients()
  const clients = clientsData?.data ?? []
  const createPlan = useCreateNutritionPlan()

  const [clientId, setClientId] = useState(searchParams.get('client') ?? '')
  const [title, setTitle]       = useState('')
  const [weekStart, setWeekStart] = useState('')
  const [loading, setLoading]   = useState(false)
  const [days, setDays] = useState(DAYS.map(day => ({
    day, meals: [{ ...emptyMeal, foods: [{ ...emptyFood }] }]
  })))

  const addMeal = (di: number) => setDays(days.map((d, i) => i === di ? { ...d, meals: [...d.meals, { ...emptyMeal, foods: [{ ...emptyFood }] }] } : d))
  const addFood = (di: number, mi: number) => setDays(days.map((d, i) => i === di ? { ...d, meals: d.meals.map((m, j) => j === mi ? { ...m, foods: [...m.foods, { ...emptyFood }] } : m) } : d))

  const updateFood = (di: number, mi: number, fi: number, field: string, value: any) =>
    setDays(days.map((d, i) => i === di ? {
      ...d,
      meals: d.meals.map((m, j) => j === mi ? {
        ...m,
        foods: m.foods.map((f, k) => k === fi ? { ...f, [field]: value } : f)
      } : m)
    } : d))

  const totalMacros = () => {
    let cal = 0, pro = 0, carb = 0, fat = 0
    days.forEach(d => d.meals.forEach(m => m.foods.forEach(f => {
      cal += +f.calories; pro += +f.protein_g; carb += +f.carbs_g; fat += +f.fat_g
    })))
    return { calories: Math.round(cal / 7), protein_g: Math.round(pro / 7), carbs_g: Math.round(carb / 7), fat_g: Math.round(fat / 7) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      await createPlan.mutateAsync({ title, client_id: clientId, week_start: weekStart, days, daily_totals: totalMacros() } as any)
      router.push('/nutrition-plans')
    } finally { setLoading(false) }
  }

  return (
    <DashboardLayout>
      <div >
        <Link href="/nutrition-plans" className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-6">
          <ArrowLeft className="w-3 h-3" /> Back
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">New Nutrition Plan</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6 grid grid-cols-3 gap-4">
            <div><label className="label">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="Week 1 Nutrition" required />
            </div>
            <div><label className="label">Client *</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} className="input" required>
                <option value="">Select client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="label">Week Start *</label>
              <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} className="input" required />
            </div>
          </div>

          {days.slice(0, 1).map((day, di) => (
            <div key={di} className="card p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 capitalize">{day.day} (template for all days)</h3>
              {day.meals.map((meal, mi) => (
                <div key={mi} className="bg-slate-50 dark:bg-surface-page-dark p-3 mb-3">
                  <div className="flex gap-2 mb-2">
                    <input value={meal.meal_name} className="input text-sm w-32" placeholder="Meal" readOnly />
                    <input value={meal.time} className="input text-sm w-28" type="time" readOnly />
                  </div>
                  <div className="grid grid-cols-6 gap-2 mb-1 px-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-wide font-semibold col-span-2">Name</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-wide font-semibold">Qty</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-wide font-semibold">kcal</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-wide font-semibold">P (g)</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-wide font-semibold">C (g)</span>
                  </div>
                  {meal.foods.map((food, fi) => (
                    <div key={fi} className="grid grid-cols-6 gap-2 mb-2">
                      <input value={food.name} onChange={e => updateFood(di, mi, fi, 'name', e.target.value)} className="input text-sm col-span-2" placeholder="Food name" />
                      <input value={food.quantity} onChange={e => updateFood(di, mi, fi, 'quantity', e.target.value)} className="input text-sm" placeholder="Qty" />
                      <input type="number" value={food.calories} onChange={e => updateFood(di, mi, fi, 'calories', +e.target.value)} className="input text-sm" placeholder="kcal" />
                      <input type="number" value={food.protein_g} onChange={e => updateFood(di, mi, fi, 'protein_g', +e.target.value)} className="input text-sm" placeholder="P(g)" />
                      <input type="number" value={food.carbs_g} onChange={e => updateFood(di, mi, fi, 'carbs_g', +e.target.value)} className="input text-sm" placeholder="C(g)" />
                    </div>
                  ))}
                  <button type="button" onClick={() => addFood(di, mi)} className="text-xs text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add food
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addMeal(di)} className="text-sm text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 flex items-center gap-1 mt-2">
                <Plus className="w-3.5 h-3.5" /> Add meal
              </button>
            </div>
          ))}

          <button type="submit" disabled={loading} className="btn-primary py-3 w-59">
            {loading ? 'Saving…' : 'Save Nutrition Plan'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}
