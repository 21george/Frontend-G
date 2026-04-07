'use client'

import { useState, useMemo } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useNutritionPlans, useClients } from '@/lib/hooks'
import Link from 'next/link'
import {
  Plus, Search, SlidersHorizontal, Flame, Zap, Droplets,
  Salad, Clock, ChevronRight, Star, Users, MoreHorizontal,
  Apple, Coffee, UtensilsCrossed,
} from 'lucide-react'
import type { NutritionPlan } from '@/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const MEAL_TABS = ['All', 'Breakfast', 'Lunch', 'Snack', 'Dinner'] as const
type MealTab = typeof MEAL_TABS[number]

// ── Helpers ───────────────────────────────────────────────────────────────────

function healthScore(plan: NutritionPlan): number {
  const { calories = 0, protein_g = 0, carbs_g = 0, fat_g = 0 } = plan.daily_totals ?? {}
  if (calories === 0) return 0
  const proteinRatio = (protein_g * 4) / calories
  const carbRatio    = (carbs_g   * 4) / calories
  const fatRatio     = (fat_g     * 9) / calories
  const balance = 1 - Math.abs(proteinRatio - 0.30) - Math.abs(carbRatio - 0.45) - Math.abs(fatRatio - 0.25)
  return Math.min(10, Math.max(1, Math.round(balance * 12)))
}

function scoreColor(score: number) {
  return score >= 8 ? 'text-green-500' : score >= 6 ? 'text-amber-500' : 'text-red-500'
}

function getMealTypes(plan: NutritionPlan): MealTab[] {
  const types = new Set<MealTab>()
  plan.days?.forEach(day =>
    day.meals.forEach(meal => {
      const n = meal.meal_name.toLowerCase()
      if (n.includes('breakfast'))                      types.add('Breakfast')
      else if (n.includes('lunch'))                     types.add('Lunch')
      else if (n.includes('snack'))                     types.add('Snack')
      else if (n.includes('dinner') || n.includes('supper')) types.add('Dinner')
    })
  )
  return Array.from(types)
}

// ── Macro pill ────────────────────────────────────────────────────────────────

function MacroPill({
  icon, value, unit, color, bg,
}: { icon: React.ReactNode; value: number; unit: string; color: string; bg: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl ${bg}`}>
      <span className={color}>{icon}</span>
      <p className={`text-sm font-semibold ${color}`}>
        {value}<span className="text-xs font-normal ml-0.5">{unit}</span>
      </p>
    </div>
  )
}

// ── Meal type badge ───────────────────────────────────────────────────────────

function MealBadge({ type }: { type: string }) {
  const BADGE: Record<string, string> = {
    Breakfast: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    Lunch:     'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
    Dinner:    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    Snack:     'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    Other:     'bg-slate-100  text-slate-600  dark:bg-slate-800     dark:text-slate-400',
  }
  const key = type in BADGE ? type : 'Other'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${BADGE[key]}`}>
      {type}
    </span>
  )
}

// ── Score bar (like the orange segment bar in ref UI) ────────────────────────

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const filled = score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <div key={i} className={`h-1.5 w-3 rounded-full ${i < score ? filled : 'bg-slate-200 dark:bg-white/[0.08]'}`} />
      ))}
    </div>
  )
}

// ── Featured plan card ────────────────────────────────────────────────────────

function FeaturedPlanCard({ plan, clientName }: { plan: NutritionPlan; clientName?: string }) {
  const score = healthScore(plan)
  const { calories = 0, protein_g = 0, carbs_g = 0, fat_g = 0 } = plan.daily_totals ?? {}
  const types = getMealTypes(plan)
  const totalMeals = plan.days?.reduce((s, d) => s + d.meals.length, 0) ?? 0

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#171717] overflow-hidden shadow-sm">
      <div className="flex flex-col sm:flex-row">
        {/* Visual gradient panel */}
        <div className="sm:w-52 flex-shrink-0 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 p-6 flex flex-col justify-between min-h-[180px]">
          <div className="flex flex-wrap gap-1.5">
            {types.slice(0, 2).map(t => (
              <span key={t} className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">{t}</span>
            ))}
            {types.length === 0 && (
              <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">General</span>
            )}
          </div>
          <div>
            <Salad className="w-12 h-12 text-white/80 mb-2" />
            <p className="text-white/80 text-xs font-semibold">Health Score {score}/10</p>
            <ScoreBar score={score} />
          </div>
        </div>

        {/* Info side */}
        <div className="flex-1 p-5 flex flex-col justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              Featured Plan
            </p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-2">
              {plan.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><Clock size={11} />{plan.days?.length ?? 7} days</span>
              <span className="flex items-center gap-1.5"><UtensilsCrossed size={11} />{totalMeals} meals</span>
              {clientName && <span className="flex items-center gap-1.5"><Users size={11} />{clientName}</span>}
              <span className={`flex items-center gap-1.5 font-semibold ${scoreColor(score)}`}>
                <Star size={11} />{score}/10
              </span>
            </div>
          </div>

          {/* Macros + CTA */}
          <div className="flex flex-wrap items-center gap-2">
            <MacroPill icon={<Flame size={14} />}    value={calories}  unit="kcal" color="text-orange-500" bg="bg-orange-50 dark:bg-orange-900/20"  />
            <MacroPill icon={<Zap size={14} />}      value={carbs_g}   unit="g C"  color="text-amber-500"  bg="bg-amber-50 dark:bg-amber-900/20"   />
            <MacroPill icon={<Salad size={14} />}    value={protein_g} unit="g P"  color="text-green-600"  bg="bg-green-50 dark:bg-green-900/20"   />
            <MacroPill icon={<Droplets size={14} />} value={fat_g}     unit="g F"  color="text-slate-500"  bg="bg-slate-100 dark:bg-slate-800/60"  />
            <Link
              href={`/nutrition-plans/${plan.id}`}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-white text-sm font-semibold transition-colors shadow-sm shadow-cyan-950/25"
            >
              View Plan <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Plan list row ─────────────────────────────────────────────────────────────

function PlanRow({ plan, clientName }: { plan: NutritionPlan; clientName?: string }) {
  const score = healthScore(plan)
  const { calories = 0, protein_g = 0, carbs_g = 0, fat_g = 0 } = plan.daily_totals ?? {}
  const types = getMealTypes(plan)
  const primary = types[0]

  const iconBg: Record<string, string> = {
    Breakfast: 'bg-orange-100 dark:bg-orange-900/30',
    Lunch:     'bg-blue-100   dark:bg-blue-900/30',
    Dinner:    'bg-indigo-100 dark:bg-indigo-900/30',
    Snack:     'bg-purple-100 dark:bg-purple-900/30',
  }
  const iconColor: Record<string, string> = {
    Breakfast: 'text-orange-500',
    Lunch:     'text-blue-500',
    Dinner:    'text-indigo-500',
    Snack:     'text-purple-500',
  }

  const MealIcon = primary === 'Breakfast' ? Coffee
    : primary === 'Lunch'   ? UtensilsCrossed
    : primary === 'Snack'   ? Apple
    : Salad

  return (
    <Link
      href={`/nutrition-plans/${plan.id}`}
      className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors rounded-xl group"
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${primary ? iconBg[primary] : 'bg-green-100 dark:bg-green-900/30'}`}>
        <MealIcon size={18} className={primary ? iconColor[primary] : 'text-green-600'} />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{plan.title}</p>
          {types.slice(0, 2).map(t => <MealBadge key={t} type={t} />)}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
          {clientName && <span className="flex items-center gap-1"><Users size={10} />{clientName}</span>}
          <span>{calories} kcal/day</span>
          <span className="hidden sm:inline">P: {protein_g}g · C: {carbs_g}g · F: {fat_g}g</span>
        </div>
      </div>

      {/* Health score */}
      <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
        <span className={`text-xs font-semibold ${scoreColor(score)}`}>Health Score</span>
        <div className="flex items-center gap-1">
          <span className={`text-xs font-semibold ${scoreColor(score)}`}>{score}/10</span>
          <ScoreBar score={score} />
        </div>
      </div>

      <ChevronRight size={14} className="text-slate-300 dark:text-slate-700 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors flex-shrink-0" />
    </Link>
  )
}

// ── Right panel mini card ─────────────────────────────────────────────────────

function MiniPlanCard({ plan, rank }: { plan: NutritionPlan; rank?: number }) {
  const score = healthScore(plan)
  const { calories = 0 } = plan.daily_totals ?? {}
  const types = getMealTypes(plan)

  return (
    <Link
      href={`/nutrition-plans/${plan.id}`}
      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors group"
    >
      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
        types[0] === 'Breakfast' ? 'bg-orange-100 dark:bg-orange-900/30' :
        types[0] === 'Lunch'     ? 'bg-blue-100 dark:bg-blue-900/30'     :
        types[0] === 'Dinner'    ? 'bg-indigo-100 dark:bg-indigo-900/30' :
                                   'bg-green-100 dark:bg-green-900/30'
      }`}>
        <Salad size={16} className="text-green-600 dark:text-green-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
          {plan.title}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <Star size={10} className="text-amber-400 fill-amber-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400">{score}/10 · {calories} kcal</span>
        </div>
      </div>
      {rank !== undefined && rank < 3 && (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-lg flex-shrink-0 ${
          rank === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
          rank === 1 ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'   :
                       'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
        }`}>
          #{rank + 1}
        </span>
      )}
    </Link>
  )
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/[0.06] animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 bg-slate-200 dark:bg-white/[0.06] rounded animate-pulse" />
        <div className="h-3 w-32 bg-slate-100 dark:bg-white/[0.04] rounded animate-pulse" />
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NutritionPlansPage() {
  const { data: rawPlans = [], isLoading } = useNutritionPlans()
  const { data: clientsData }              = useClients()
  const clients                            = clientsData?.data ?? []

  const [activeTab, setActiveTab] = useState<MealTab>('All')
  const [search,    setSearch]    = useState('')
  const [sortBy,    setSortBy]    = useState<'calories' | 'score' | 'name'>('calories')

  const plans = rawPlans as NutritionPlan[]

  const clientMap = useMemo(
    () => Object.fromEntries(clients.map(c => [c.id, c.name])),
    [clients],
  )

  const filtered = useMemo(() => {
    let result = plans

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (clientMap[p.client_id] ?? '').toLowerCase().includes(q),
      )
    }

    if (activeTab !== 'All') {
      result = result.filter(p => getMealTypes(p).includes(activeTab))
    }

    if (sortBy === 'calories') result = [...result].sort((a, b) => (b.daily_totals?.calories ?? 0) - (a.daily_totals?.calories ?? 0))
    if (sortBy === 'score')    result = [...result].sort((a, b) => healthScore(b) - healthScore(a))
    if (sortBy === 'name')     result = [...result].sort((a, b) => a.title.localeCompare(b.title))

    return result
  }, [plans, search, activeTab, sortBy, clientMap])

  const featured    = plans[0]
  const popular     = useMemo(() => [...plans].sort((a, b) => healthScore(b) - healthScore(a)).slice(0, 4),          [plans])
  const recommended = useMemo(() => [...plans].filter(p => (p.daily_totals?.protein_g ?? 0) > 0).sort((a, b) => (b.daily_totals?.protein_g ?? 0) - (a.daily_totals?.protein_g ?? 0)).slice(0, 4), [plans])

  const avgCalories = plans.length ? Math.round(plans.reduce((s, p) => s + (p.daily_totals?.calories ?? 0), 0) / plans.length) : 0
  const avgProtein  = plans.length ? Math.round(plans.reduce((s, p) => s + (p.daily_totals?.protein_g ?? 0), 0) / plans.length) : 0
  const avgCarbs    = plans.length ? Math.round(plans.reduce((s, p) => s + (p.daily_totals?.carbs_g ?? 0), 0) / plans.length) : 0
  const avgFat      = plans.length ? Math.round(plans.reduce((s, p) => s + (p.daily_totals?.fat_g ?? 0), 0) / plans.length) : 0

  return (
    <DashboardLayout>
      <div>
        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Healthy Menu</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage &amp; assign nutrition plans to your clients
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search menu…"
                className="pl-9 pr-3 py-2 w-44 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#171717] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 focus:border-cyan-950 transition-colors"
              />
            </div>
            {/* Filter icon */}
            <button
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors bg-white dark:bg-[#171717]"
              title="Filter"
            >
              <SlidersHorizontal size={14} />
            </button>
            {/* Add Plan */}
            <Link
              href="/nutrition-plans/new"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-white text-sm font-semibold transition-colors shadow-sm shadow-cyan-950/20"
            >
              <Plus size={15} /> Add Menu
            </Link>
          </div>
        </div>

        {/* ── Two-column body ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_296px] xl:grid-cols-[1fr_320px] gap-6 items-start">

          {/* ── Left: featured + list ── */}
          <div className="space-y-5">

            {/* Featured plan */}
            {isLoading ? (
              <div className="h-48 rounded-2xl bg-slate-200 dark:bg-white/[0.04] animate-pulse" />
            ) : featured ? (
              <FeaturedPlanCard plan={featured} clientName={clientMap[featured.client_id]} />
            ) : null}

            {/* All plans card */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#171717] overflow-hidden shadow-sm">

              {/* Tabs + sort */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-slate-100 dark:border-white/[0.05]">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 mr-1">All Menu</span>
                  {MEAL_TABS.map(tab => {
                    const active = activeTab === tab
                    const activeCls =
                      tab === 'All'       ? 'bg-cyan-950 text-white shadow-sm shadow-green-500/20'   :
                      tab === 'Breakfast' ? 'bg-cyan-950 text-white shadow-sm shadow-orange-500/20' :
                      tab === 'Lunch'     ? 'bg-cyan-950 text-white shadow-sm shadow-blue-500/20'     :
                      tab === 'Snack'     ? 'bg-cyan-950 text-white shadow-sm shadow-purple-500/20' :
                                            'bg-cyan-950 text-white shadow-sm shadow-indigo-500/20'
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                          active
                            ? activeCls
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                        }`}
                      >
                        {tab}
                      </button>
                    )
                  })}
                </div>
                {/* Sort */}
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <span className="text-xs hidden sm:inline">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as typeof sortBy)}
                    className="text-xs border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] text-slate-600 dark:text-slate-400 rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
                  >
                    <option value="calories">Calories</option>
                    <option value="score">Health Score</option>
                    <option value="name">Name</option>
                  </select>
                </div>
              </div>

              {/* List */}
              <div className="p-2 min-h-[180px]">
                {isLoading ? (
                  [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Salad className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {search ? 'No plans match your search' : activeTab !== 'All' ? `No ${activeTab} plans yet` : 'No nutrition plans yet'}
                    </p>
                    <Link href="/nutrition-plans/new" className="mt-3 text-xs text-cyan-950 dark:text-cyan-400 font-semibold hover:underline">
                      Create your first plan →
                    </Link>
                  </div>
                ) : filtered.map(plan => (
                  <PlanRow key={plan.id} plan={plan} clientName={clientMap[plan.client_id]} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-5">

            {/* Popular */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#171717] p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Popular Menu</h3>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><MoreHorizontal size={16} /></button>
              </div>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="w-10 h-10 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-32 bg-slate-200 dark:bg-white/[0.06] rounded animate-pulse" />
                      <div className="h-3 w-20 bg-slate-100 dark:bg-white/[0.04] rounded animate-pulse" />
                    </div>
                  </div>
                ))
              ) : popular.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No plans yet</p>
              ) : popular.map((plan, i) => (
                <MiniPlanCard key={plan.id} plan={plan} rank={i} />
              ))}
            </div>

            {/* Recommended */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#171717] p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recommended Menu</h3>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><MoreHorizontal size={16} /></button>
              </div>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/[0.06] animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-32 bg-slate-200 dark:bg-white/[0.06] rounded animate-pulse" />
                      <div className="h-3 w-20 bg-slate-100 dark:bg-white/[0.04] rounded animate-pulse" />
                    </div>
                  </div>
                ))
              ) : recommended.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No high-protein plans yet</p>
              ) : recommended.map(plan => (
                <MiniPlanCard key={plan.id} plan={plan} />
              ))}
            </div>

            {/* Averages overview */}
            {!isLoading && plans.length > 0 && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#171717] p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Plan Overview</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: <Flame size={18} />, value: avgCalories, unit: 'kcal', label: 'Avg Calories', iconCls: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                    { icon: <Zap size={18} />,   value: avgProtein,  unit: 'g',    label: 'Avg Protein',  iconCls: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-900/20'  },
                    { icon: <Salad size={18} />, value: avgCarbs,    unit: 'g',    label: 'Avg Carbs',    iconCls: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-900/20'  },
                    { icon: <Droplets size={18}/>,value: avgFat,     unit: 'g',    label: 'Avg Fat',      iconCls: 'text-slate-500',  bg: 'bg-slate-100 dark:bg-slate-800/50' },
                  ].map(({ icon, value, unit, label, iconCls, bg }) => (
                    <div key={label} className={`flex flex-col items-center py-3 rounded-xl ${bg}`}>
                      <span className={iconCls}>{icon}</span>
                      <p className={`text-base font-semibold mt-1 ${iconCls}`}>{value}<span className="text-[10px] font-normal ml-0.5">{unit}</span></p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
