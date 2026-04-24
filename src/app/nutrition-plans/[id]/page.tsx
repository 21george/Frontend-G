'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useNutritionPlan, useUpdateNutritionPlan, useDeleteNutritionPlan, useClients } from '@/lib/hooks'
import { useParams, useRouter } from 'next/navigation'
import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, Save, ChevronDown, ChevronRight,
  Salad, Flame, Zap, Droplets, Edit3, Check, X, Clock,
  Users, Calendar, Star, AlertTriangle, UtensilsCrossed,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { DAYS } from '@/lib/utils'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { NutritionPlan, NutritionDay, Meal } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const emptyFood = () => ({ name: '', quantity: '', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 })
const emptyMeal = (): Meal => ({ meal_name: 'Meal', time: '08:00', foods: [emptyFood()] })

function dayTotals(day: NutritionDay) {
  let cal = 0, pro = 0, carb = 0, fat = 0
  day.meals.forEach(m => m.foods.forEach(f => {
    cal  += Number(f.calories)
    pro  += Number(f.protein_g)
    carb += Number(f.carbs_g)
    fat  += Number(f.fat_g)
  }))
  return { cal: Math.round(cal), pro: Math.round(pro), carb: Math.round(carb), fat: Math.round(fat) }
}

function healthScore(plan: NutritionPlan): number {
  const { calories = 0, protein_g = 0, carbs_g = 0, fat_g = 0 } = plan.daily_totals ?? {}
  if (calories === 0) return 0
  const pR = (protein_g * 4) / calories
  const cR = (carbs_g   * 4) / calories
  const fR = (fat_g     * 9) / calories
  const bal = 1 - Math.abs(pR - 0.30) - Math.abs(cR - 0.45) - Math.abs(fR - 0.25)
  return Math.min(10, Math.max(1, Math.round(bal * 12)))
}

function scoreColor(s: number) {
  return s >= 8 ? 'text-green-500' : s >= 6 ? 'text-amber-500' : 'text-red-500'
}

// ── Input style ───────────────────────────────────────────────────────────────

const inputCls = `
  bg-white dark:bg-[#141414]
  border border-slate-200 dark:border-white/[0.07]
  rounded-lg px-3 py-2 text-[13px]
  text-slate-900 dark:text-white
  placeholder:text-slate-400 dark:placeholder:text-slate-700
  outline-none focus:border-green-400 dark:focus:border-green-500/60
  transition-colors w-full
`

// ── Macro pill ────────────────────────────────────────────────────────────────

function MacroPill({
  icon, label, value, unit, iconCls, bg,
}: { icon: React.ReactNode; label: string; value: number; unit: string; iconCls: string; bg: string }) {
  return (
    <div className={`flex flex-col items-center py-3 px-4 rounded-2xl ${bg}`}>
      <span className={iconCls}>{icon}</span>
      <p className={`text-lg font-semibold mt-1 ${iconCls}`}>
        {value}<span className="text-xs font-normal ml-0.5">{unit}</span>
      </p>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wide">{label}</p>
    </div>
  )
}

// ── NutritionFact row ─────────────────────────────────────────────────────────

function NutrFact({ label, value, unit, bold }: { label: string; value: number; unit?: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-white/[0.04] last:border-0 ${bold ? 'font-semibold' : ''}`}>
      <span className={`text-sm ${bold ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-700 dark:text-slate-300'}`}>
        {value} {unit ?? 'g'}
      </span>
    </div>
  )
}

// ── Delete confirm modal ── replaced by ConfirmDialog component ───────────────

// ── Score dots ────────────────────────────────────────────────────────────────

function ScoreDots({ score }: { score: number }) {
  const col = score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-amber-500' : 'bg-red-400'
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className={`h-1.5 w-2.5 rounded-full ${i < score ? col : 'bg-slate-200 dark:bg-white/[0.1]'}`} />
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NutritionPlanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const { data: plan, isLoading } = useNutritionPlan(id)
  const updatePlan = useUpdateNutritionPlan(id)
  const deletePlan = useDeleteNutritionPlan()
  const { data: clientsData } = useClients()
  const clientMap = useMemo(
    () => Object.fromEntries((clientsData?.data ?? []).map(c => [c.id, c.name])),
    [clientsData],
  )

  const [title,       setTitle]       = useState('')
  const [titleEdit,   setTitleEdit]   = useState(false)
  const [days,        setDays]        = useState<NutritionDay[]>([])
  const [openDays,    setOpenDays]    = useState<Record<string, boolean>>({})
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [showDelete,  setShowDelete]  = useState(false)
  const [initialised, setInitialised] = useState(false)

  useMemo(() => {
    if (plan && !initialised) {
      setTitle(plan.title)
      const merged = DAYS.map(dayName => {
        const existing = plan.days?.find(d => d.day.toLowerCase() === dayName)
        return existing ?? { day: dayName, meals: [emptyMeal()] }
      })
      setDays(merged)
      setOpenDays({ [DAYS[0]]: true })
      setInitialised(true)
    }
  }, [plan, initialised])

  const weeklyAvg = useMemo(() => {
    let cal = 0, pro = 0, carb = 0, fat = 0
    days.forEach(d => { const t = dayTotals(d); cal += t.cal; pro += t.pro; carb += t.carb; fat += t.fat })
    const n = days.length || 1
    return { calories: Math.round(cal / n), protein_g: Math.round(pro / n), carbs_g: Math.round(carb / n), fat_g: Math.round(fat / n) }
  }, [days])

  const totalMeals = useMemo(() => days.reduce((s, d) => s + d.meals.length, 0), [days])
  const score = plan ? healthScore(plan) : 0

  const toggleDay = useCallback((day: string) => {
    setOpenDays(prev => ({ ...prev, [day]: !prev[day] }))
  }, [])

  const addMeal = (di: number) => setDays(d => d.map((day, i) => i === di ? { ...day, meals: [...day.meals, emptyMeal()] } : day))
  const removeMeal = (di: number, mi: number) => setDays(d => d.map((day, i) => i === di ? { ...day, meals: day.meals.filter((_, j) => j !== mi) } : day))
  const updateMeal = (di: number, mi: number, field: keyof Meal, value: string) =>
    setDays(d => d.map((day, i) => i !== di ? day : { ...day, meals: day.meals.map((m, j) => j !== mi ? m : { ...m, [field]: value }) }))
  const addFood = (di: number, mi: number) => setDays(d => d.map((day, i) => i !== di ? day : { ...day, meals: day.meals.map((m, j) => j !== mi ? m : { ...m, foods: [...m.foods, emptyFood()] }) }))
  const removeFood = (di: number, mi: number, fi: number) => setDays(d => d.map((day, i) => i !== di ? day : { ...day, meals: day.meals.map((m, j) => j !== mi ? m : { ...m, foods: m.foods.filter((_, k) => k !== fi) }) }))
  const updateFood = (di: number, mi: number, fi: number, field: string, value: string | number) =>
    setDays(d => d.map((day, i) => i !== di ? day : { ...day, meals: day.meals.map((m, j) => j !== mi ? m : { ...m, foods: m.foods.map((f, k) => k !== fi ? f : { ...f, [field]: value }) }) }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await updatePlan.mutateAsync({ title, days, daily_totals: weeklyAvg } as Partial<NutritionPlan>)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deletePlan.mutateAsync(id)
      router.push('/nutrition-plans')
    } finally { setDeleting(false); setShowDelete(false) }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <DashboardLayout>
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-white/[0.06] rounded-xl" />
        <div className="h-48 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />)}
        </div>
        <div className="h-40 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />
      </div>
    </DashboardLayout>
  )

  if (!plan) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-24">
        <Salad className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Nutrition plan not found.</p>
        <Link href="/nutrition-plans" className="text-sm text-green-600 dark:text-green-400 font-semibold hover:underline">← Back to plans</Link>
      </div>
    </DashboardLayout>
  )

  const clientName = clientMap[plan.client_id] ?? null

  return (
    <DashboardLayout>
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Plan"
        message={`Are you sure you want to delete "${title || plan.title}"? This cannot be undone.`}
        confirmLabel="Delete Plan"
        variant="danger"
        loading={deleting}
      />

      <div className="space-y-5">

        {/* ── Breadcrumb + actions ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/nutrition-plans" className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors font-medium">
              <ArrowLeft size={14} /> Back to Menu
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
              {titleEdit ? (
                <input
                  autoFocus
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onBlur={() => setTitleEdit(false)}
                  onKeyDown={e => e.key === 'Enter' && setTitleEdit(false)}
                  className="bg-transparent border-b border-green-500 text-slate-700 dark:text-slate-300 outline-none pb-0.5 min-w-[160px] text-sm"
                />
              ) : (
                <button onClick={() => setTitleEdit(true)} className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-white transition-colors group">
                  {title || plan.title}
                  <Edit3 size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm shadow-cyan-950/20"
            >
              {saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}</>}
            </button>
          </div>
        </div>

        {/* ── Hero card ── */}
        <div>
          <div className="flex flex-col sm:flex-row">
            {/* Gradient panel */}
            <div className="sm:w-56 flex-shrink-0 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 p-6 flex flex-col justify-between min-h-[180px]">
              <div className="flex gap-1.5 flex-wrap">
                <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">Nutrition Plan</span>
                {clientName && <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">{clientName}</span>}
              </div>
              <div>
                <Salad className="w-10 h-10 text-white/80 mb-2" />
                <p className="text-white/70 text-[11px] font-semibold mb-1">Health Score {score}/10</p>
                <ScoreDots score={score} />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 p-5 flex flex-col justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                  {titleEdit ? (
                    <input
                      autoFocus
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      onBlur={() => setTitleEdit(false)}
                      onKeyDown={e => e.key === 'Enter' && setTitleEdit(false)}
                      className="bg-transparent border-b-2 border-green-500 text-slate-900 dark:text-white outline-none w-full pb-0.5 text-xl font-semibold"
                    />
                  ) : (
                    <button onClick={() => setTitleEdit(true)} className="flex items-center gap-2 text-left group">
                      {title || plan.title}
                      <Edit3 size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                  )}
                </h1>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span className="flex items-center gap-1.5"><Calendar size={12} />Week of {formatDate(plan.week_start)}</span>
                  <span className="flex items-center gap-1.5"><Clock size={12} />{days.length} days</span>
                  <span className="flex items-center gap-1.5"><UtensilsCrossed size={12} />{totalMeals} total meals</span>
                  {clientName && <span className="flex items-center gap-1.5"><Users size={12} />{clientName}</span>}
                  <span className={`flex items-center gap-1.5 font-semibold ${scoreColor(score)}`}>
                    <Star size={12} />Health Score {score}/10
                  </span>
                </div>
              </div>

              {/* Macro row */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: <Flame size={15} />, label: 'Calories', value: weeklyAvg.calories, unit: 'kcal', iconCls: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                  { icon: <Zap size={15} />,   label: 'Carbs',    value: weeklyAvg.carbs_g,   unit: 'g',    iconCls: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20'  },
                  { icon: <Salad size={15} />, label: 'Protein',  value: weeklyAvg.protein_g, unit: 'g',    iconCls: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-900/20'  },
                  { icon: <Droplets size={15}/>,label: 'Fat',     value: weeklyAvg.fat_g,     unit: 'g',    iconCls: 'text-slate-500',  bg: 'bg-slate-100 dark:bg-slate-800/60' },
                ].map(m => (
                  <div key={m.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${m.bg}`}>
                    <span className={m.iconCls}>{m.icon}</span>
                    <div>
                      <p className="text-[10px] text-slate-200 dark:text-slate-400 leading-none">{m.label}</p>
                      <p className={`text-sm font-semibold ${m.iconCls}`}>{m.value}<span className="text-[10px] font-normal ml-0.5">{m.unit}</span></p>
                    </div>
                  </div>
                ))}
                {plan.client_id && (
                  <Link
                    href={`/clients/${plan.client_id}`}
                    className="ml-auto self-end text-xs text-green-600 dark:text-green-400 font-semibold hover:underline"
                  >
                    View client →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-column body ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-5 items-start">

          {/* ── Left: Days editor ── */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 px-1">Daily Meal Plan</h2>

            {days.map((day, di) => {
              const totals = dayTotals(day)
              const isOpen = !!openDays[day.day]
              return (
                <div key={day.day} className="border border-slate-200/80 dark:border-white/[0.07] overflow-hidden bg-white dark:bg-[#171717] shadow-sm">
                  {/* Day header */}
                  <button
                    onClick={() => toggleDay(day.day)}
                    className="w-full flex items-center justify-between px-5 py-3.5 bg-white dark:bg-[#171717] hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {isOpen
                        ? <ChevronDown size={15} className="text-green-500 dark:text-green-400" />
                        : <ChevronRight size={15} className="text-slate-400 dark:text-slate-600" />}
                      <span className="text-sm font-semibold text-slate-800 dark:text-white capitalize">{day.day}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-600">{day.meals.length} meal{day.meals.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-200 dark:text-slate-500">
                      <span><span className="font-semibold text-slate-700 dark:text-slate-200">{totals.cal}</span> kcal</span>
                      <span className="hidden sm:inline">P <span className="font-medium text-slate-700 dark:text-slate-200">{totals.pro}g</span></span>
                      <span className="hidden sm:inline">C <span className="font-medium text-slate-700 dark:text-slate-200">{totals.carb}g</span></span>
                      <span className="hidden sm:inline">F <span className="font-medium text-slate-700 dark:text-slate-200">{totals.fat}g</span></span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="p-4 space-y-2">
                      {day.meals.map((meal, mi) => (
                        <div key={mi}>
                          {/* Meal header */}
                          <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-[#171717] border-b border-slate-100 dark:border-white/[0.05]">
                            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                            <input
                              value={meal.meal_name}
                              onChange={e => updateMeal(di, mi, 'meal_name', e.target.value)}
                              className="bg-transparent text-sm font-semibold text-slate-800 dark:text-white outline-none border-b border-transparent focus:border-green-400 pb-0.5 w-36"
                              placeholder="Meal name"
                            />
                            <input
                              type="time"
                              value={meal.time}
                              onChange={e => updateMeal(di, mi, 'time', e.target.value)}
                              className="bg-transparent text-xs text-slate-400 outline-none border-b border-transparent focus:border-green-400 pb-0.5 w-24"
                            />
                            <div className="flex-1" />
                            {day.meals.length > 1 && (
                              <button onClick={() => removeMeal(di, mi)} className="text-slate-300 dark:text-slate-700 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>

                          {/* Foods */}
                          <div className="p-3 space-y-2">
                            {/* Column headers */}
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 px-1">
                              {['Food', 'Qty', 'kcal', 'P (g)', 'C (g)', 'F (g)', ''].map((h, i) => (
                                <span key={i} className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-wide font-semibold">{h}</span>
                              ))}
                            </div>

                            {meal.foods.map((food, fi) => (
                              <div key={fi} className="group grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center">
                                <input value={food.name}       onChange={e => updateFood(di, mi, fi, 'name',      e.target.value)} className={inputCls} placeholder="e.g. Chicken breast" />
                                <input value={food.quantity}   onChange={e => updateFood(di, mi, fi, 'quantity',  e.target.value)} className={inputCls} placeholder="200g" />
                                <input type="number" min="0" value={food.calories}  onChange={e => updateFood(di, mi, fi, 'calories',  +e.target.value)} className={inputCls} placeholder="0" />
                                <input type="number" min="0" value={food.protein_g} onChange={e => updateFood(di, mi, fi, 'protein_g', +e.target.value)} className={inputCls} placeholder="0" />
                                <input type="number" min="0" value={food.carbs_g}   onChange={e => updateFood(di, mi, fi, 'carbs_g',   +e.target.value)} className={inputCls} placeholder="0" />
                                <input type="number" min="0" value={food.fat_g}     onChange={e => updateFood(di, mi, fi, 'fat_g',     +e.target.value)} className={inputCls} placeholder="0" />
                                <button onClick={() => removeFood(di, mi, fi)} className="text-slate-200 dark:text-slate-800 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                                  <X size={13} />
                                </button>
                              </div>
                            ))}

                            <button
                              onClick={() => addFood(di, mi)}
                              className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors mt-1 font-medium"
                            >
                              <Plus size={12} /> Add food item
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => addMeal(di)}
                        className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors font-semibold"
                      >
                        <Plus size={14} /> Add meal
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Bottom save */}
            <div className="flex justify-end pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm shadow-cyan-950/20"
              >
                {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}</>}
              </button>
            </div>
          </div>

          {/* ── Right: info panels ── */}
          <div className="space-y-4">

            {/* Macro summary tiles */}
            <div className="p-4 ">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Daily Averages</h3>
              <div className="grid grid-cols-2 gap-2">
                <MacroPill icon={<Flame size={18} />}    label="Calories" value={weeklyAvg.calories}  unit="kcal" iconCls="text-orange-500" bg="bg-orange-50 dark:bg-orange-900/20" />
                <MacroPill icon={<Zap size={18} />}      label="Protein"  value={weeklyAvg.protein_g} unit="g"    iconCls="text-green-600"  bg="bg-green-50 dark:bg-green-900/20"  />
                <MacroPill icon={<Salad size={18} />}    label="Carbs"    value={weeklyAvg.carbs_g}   unit="g"    iconCls="text-amber-600"  bg="bg-amber-50 dark:bg-amber-900/20"  />
                <MacroPill icon={<Droplets size={18} />} label="Fat"      value={weeklyAvg.fat_g}     unit="g"    iconCls="text-slate-500"  bg="bg-slate-100 dark:bg-slate-800/50" />
              </div>
            </div>

            {/* Nutrition Facts */}
            <div className="p-4 ">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Nutrition Facts</h3>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Per Day (avg)</span>
              </div>
              <div className="space-y-0">
                <NutrFact label="Calories"      value={weeklyAvg.calories}  unit="kcal" bold />
                <NutrFact label="Carbohydrates" value={weeklyAvg.carbs_g}   />
                <NutrFact label="Protein"       value={weeklyAvg.protein_g} />
                <NutrFact label="Total Fat"     value={weeklyAvg.fat_g}     />
                {/* Estimated values based on macros */}
                <NutrFact label="Fiber"         value={Math.round(weeklyAvg.carbs_g * 0.08)} />
                <NutrFact label="Sodium"        value={Math.round(weeklyAvg.calories * 0.7)} unit="mg" />
              </div>
            </div>

            {/* Plan details */}
            <div className="p-4 ">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Plan Details</h3>
              <div className="space-y-2 text-sm">
                {[
                  { icon: <Calendar size={14} />, label: 'Week Start', value: formatDate(plan.week_start) },
                  { icon: <Clock size={14} />,    label: 'Duration',   value: `${days.length} days` },
                  { icon: <UtensilsCrossed size={14} />, label: 'Total Meals', value: `${totalMeals} meals` },
                  ...(clientName ? [{ icon: <Users size={14} />, label: 'Client', value: clientName }] : []),
                  { icon: <Star size={14} />,     label: 'Health Score', value: `${score}/10` },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-white/[0.04] last:border-0">
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">{icon}{label}</span>
                    <span className="font-semibold text-slate-800 dark:text-white text-xs">{value}</span>
                  </div>
                ))}
              </div>
              {plan.client_id && (
                <Link
                  href={`/clients/${plan.client_id}`}
                  className="block w-full text-center py-2 rounded-xl border border-green-200 dark:border-green-900/40 text-green-600 dark:text-green-400 text-sm font-semibold hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                >
                  View Client Profile →
                </Link>
              )}
            </div>

            {/* Notes */}
            {plan.notes && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#171717] p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Notes</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{plan.notes}</p>
              </div>
            )}

            {/* Danger zone */}
            <div className="rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 p-4">
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Danger Zone</h3>
              <p className="text-xs text-red-500 dark:text-red-400/80 mb-3">Permanently delete this nutrition plan. This cannot be undone.</p>
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors w-full justify-center"
              >
                <Trash2 size={14} /> Delete Plan
              </button>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
