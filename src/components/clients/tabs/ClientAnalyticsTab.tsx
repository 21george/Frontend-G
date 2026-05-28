'use client'

import { useMemo } from 'react'
import { ImageIcon, Flame, Dumbbell, TrendingUp, Trophy } from 'lucide-react'
import type { AnalyticsData } from '@/types'

interface Props {
  analytics: AnalyticsData | undefined
}

/* ─── Human body silhouette SVG ─────────────────────────────────────────── */
function BodySilhouette() {
  return (
    <svg
      viewBox="0 0 100 265"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="w-full h-full"
    >
      <g className="fill-slate-200 dark:fill-white/[0.1]">
        {/* Head */}
        <circle cx="50" cy="17" r="14" />
        {/* Neck */}
        <rect x="44" y="29" width="12" height="10" />
        {/* Torso */}
        <path d="M 22,38 Q 50,34 78,38 L 74,106 Q 50,112 26,106 Z" />
        {/* Left arm */}
        <path d="M 22,40 L 8,48 L 5,116 L 15,116 L 17,56 L 24,44 Z" />
        {/* Right arm */}
        <path d="M 78,40 L 92,48 L 95,116 L 85,116 L 83,56 L 76,44 Z" />
        {/* Left leg */}
        <path d="M 26,106 L 46,106 L 44,256 L 24,256 Z" />
        {/* Right leg */}
        <path d="M 54,106 L 74,106 L 76,256 L 56,256 Z" />
      </g>
      {/* Chest measurement line */}
      <line x1="10" y1="58" x2="90" y2="58" stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="3 2" strokeOpacity="0.7" />
      {/* Waist measurement line */}
      <line x1="16" y1="84" x2="84" y2="84" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 2" strokeOpacity="0.7" />
      {/* Hips measurement line */}
      <line x1="20" y1="106" x2="80" y2="106" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 2" strokeOpacity="0.7" />
    </svg>
  )
}

/* ─── Measurement badge ─────────────────────────────────────────────────── */
function MeasureBadge({
  label, value, prev, unit, dotColor,
}: {
  label: string
  value: number | null | undefined
  prev?: number | null
  unit: string
  dotColor: string
}) {
  const diff = value != null && prev != null ? +(value - prev).toFixed(1) : null
  return (
    <div className="p-3 border border-[var(--border)] dark:border-white/[0.06] bg-[var(--bg-subtle)] dark:bg-white/[0.02]">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
        <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[17px] font-bold text-[var(--text-primary)]">
        {value != null ? `${value} ${unit}` : <span className="text-slate-400">—</span>}
      </p>
      {diff != null && (
        <p className={`text-[10px] font-medium mt-0.5 ${diff < 0 ? 'text-emerald-500' : diff > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
          {diff > 0 ? '+' : ''}{diff} {unit} vs prev
        </p>
      )}
    </div>
  )
}

/* ─── KPI card ──────────────────────────────────────────────────────────── */
function KpiCard({
  Icon, label, value, unit, sub, accentColor,
}: {
  Icon: React.ElementType
  label: string
  value: string | number
  unit?: string
  sub?: string
  accentColor: string
}) {
  return (
    <div className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-4 flex items-start gap-3">
      <div
        className="w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-md"
        style={{ background: `${accentColor}1a` }}
      >
        <Icon size={17} style={{ color: accentColor }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-2xl font-bold leading-none" style={{ color: accentColor }}>
          {value}
          {unit && <span className="text-[11px] font-normal text-[var(--text-tertiary)] ml-1">{unit}</span>}
        </p>
        {sub && <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{sub}</p>}
      </div>
    </div>
  )
}

/* ─── Main component ────────────────────────────────────────────────────── */
export function ClientAnalyticsTab({ analytics }: Props) {
  const completionRates  = Array.isArray(analytics?.completion_rate)  ? analytics.completion_rate  : []
  const weeklyVolume     = Array.isArray(analytics?.weekly_volume)    ? analytics.weekly_volume    : []
  const personalRecords  = Array.isArray(analytics?.personal_records) ? analytics.personal_records : []
  const exerciseProgress = analytics?.exercise_progress ?? {}
  const measurements     = Array.isArray(analytics?.measurements)     ? analytics.measurements     : []

  const latestM = measurements.at(-1) ?? null
  const prevM   = measurements.at(-2) ?? null

  const avgCompletion = useMemo(() => {
    if (!completionRates.length) return 0
    return Math.round(completionRates.reduce((s, w) => s + w.rate, 0) / completionRates.length)
  }, [completionRates])

  const totalVolumeKg  = analytics?.total_volume ?? 0
  const volumeDisplay  = totalVolumeKg >= 1000
    ? (totalVolumeKg / 1000).toFixed(1)
    : String(totalVolumeKg)
  const volumeUnit     = totalVolumeKg >= 1000 ? 't' : 'kg'

  const maxBarVol = useMemo(
    () => Math.max(...weeklyVolume.map(w => w.volume), 1),
    [weeklyVolume],
  )

  return (
    <div className="space-y-5">
      <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Real-Time Progress &amp; Analytics</h3>

      {/* ── KPI summary ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard Icon={Flame}      label="Streak"          value={analytics?.current_streak ?? 0} unit="days"    accentColor="#f97316" />
        <KpiCard Icon={Dumbbell}   label="Workouts"        value={analytics?.total_workouts ?? 0}                accentColor="#3b82f6" />
        <KpiCard Icon={TrendingUp} label="Avg Completion"  value={avgCompletion}                  unit="%"       accentColor="#8b5cf6"
          sub={`over ${completionRates.length} week${completionRates.length !== 1 ? 's' : ''}`} />
        <KpiCard Icon={Trophy}     label="Volume Lifted"   value={volumeDisplay}                  unit={volumeUnit} accentColor="#10b981"
          sub={`${analytics?.total_sets ?? 0} sets · ${analytics?.total_reps ?? 0} reps`} />
      </div>

      {/* ── Body Composition ─────────────────────────────────────────────── */}
      <div className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-5">
        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Body Composition</p>
        {latestM == null ? (
          <p className="text-[13px] text-[var(--text-tertiary)] py-6 text-center">No measurements recorded yet</p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
            {/* Silhouette */}
            <div className="w-20 sm:w-24 flex-shrink-0">
              <BodySilhouette />
            </div>
            {/* Measurement grid */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full">
              <MeasureBadge label="Weight"   value={latestM.weight_kg}   prev={prevM?.weight_kg}   unit="kg" dotColor="#6366f1" />
              <MeasureBadge label="Chest"    value={latestM.chest_cm}    prev={prevM?.chest_cm}    unit="cm" dotColor="#3b82f6" />
              <MeasureBadge label="Waist"    value={latestM.waist_cm}    prev={prevM?.waist_cm}    unit="cm" dotColor="#10b981" />
              <MeasureBadge label="Hips"     value={latestM.hips_cm}     prev={prevM?.hips_cm}     unit="cm" dotColor="#f59e0b" />
              <MeasureBadge label="Body Fat" value={latestM.body_fat_pct} prev={prevM?.body_fat_pct} unit="%" dotColor="#8b5cf6" />
              {latestM.date && (
                <div className="p-3 border border-[var(--border)] dark:border-white/[0.06] bg-[var(--bg-subtle)] dark:bg-white/[0.02] flex flex-col justify-center">
                  <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Recorded</p>
                  <p className="text-[13px] font-medium text-[var(--text-primary)]">{latestM.date}</p>
                  {measurements.length > 1 && (
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{measurements.length} check-ins total</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Weekly Completion ─────────────────────────────────────────────── */}
      <div className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-5">
        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Weekly Completion Rate</p>
        {completionRates.length === 0 ? (
          <p className="text-[13px] text-[var(--text-tertiary)] py-4 text-center">No completion data yet</p>
        ) : (
          <>
            <div className="flex items-end gap-1 h-24">
              {completionRates.slice(-12).map((w, i) => (
                <div key={i} className="flex-1 relative h-full flex items-end group">
                  <div
                    className="w-full transition-all duration-300"
                    style={{
                      height: `${Math.max(w.rate, 3)}%`,
                      background: w.rate >= 80 ? '#10b981' : w.rate >= 50 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                    {w.rate}%
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-1 mt-1.5">
              {completionRates.slice(-12).map((w, i) => (
                <div key={i} className="flex-1 text-[9px] text-center text-slate-400 dark:text-slate-600 truncate">
                  {w.week?.slice(5)}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {([['#10b981', '≥80% on track'], ['#f59e0b', '50–79% improving'], ['#ef4444', '<50% needs attention']] as [string, string][]).map(([c, l]) => (
                <span key={l} className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c }} />{l}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Weekly Volume ─────────────────────────────────────────────────── */}
      {weeklyVolume.length > 0 && (
        <div className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-5">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Weekly Volume Trend</p>
          <div className="flex items-end gap-1 h-24">
            {weeklyVolume.map((w, i) => {
              const pct = (w.volume / maxBarVol) * 100
              return (
                <div key={i} className="flex-1 relative h-full flex items-end group">
                  <div
                    className="w-full bg-blue-500 dark:bg-blue-600 transition-all duration-300"
                    style={{ height: `${Math.max(pct, 3)}%` }}
                  />
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                    {(w.volume / 1000).toFixed(1)}t
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex gap-1 mt-1.5">
            {weeklyVolume.map((w, i) => (
              <div key={i} className="flex-1 text-[9px] text-center text-slate-400 dark:text-slate-600 truncate">
                {w.week?.slice(5)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Personal Records ─────────────────────────────────────────────── */}
      {personalRecords.length > 0 && (
        <div className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-5">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Personal Records</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {personalRecords.map((pr, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-[var(--bg-subtle)] dark:bg-white/[0.02] border border-[var(--border)] dark:border-white/[0.04]">
                <div className="w-7 h-7 bg-amber-100 dark:bg-amber-900/25 flex items-center justify-center flex-shrink-0 rounded">
                  <span className="text-[10px] font-bold text-amber-600">#{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-slate-800 dark:text-slate-200 truncate">{pr.exercise}</p>
                  {pr.date && <p className="text-[10px] text-slate-400">{pr.date}</p>}
                </div>
                <span className="text-[14px] font-bold text-[var(--text-primary)] whitespace-nowrap">
                  {pr.max_kg} <span className="text-[10px] font-normal text-[var(--text-tertiary)]">kg</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Exercise Progress ─────────────────────────────────────────────── */}
      {Object.keys(exerciseProgress).length > 0 && (
        <div className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-5">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Exercise Progress</p>
          <div className="space-y-4">
            {Object.entries(exerciseProgress).slice(0, 6).map(([name, data]) => {
              const points = Array.isArray(data) ? data : []
              if (!points.length) return null
              const max   = Math.max(...points.map(p => p.max_kg))
              const min   = Math.min(...points.map(p => p.max_kg))
              const range = max - min || 1
              const latest      = points.at(-1)
              const first       = points.at(0)
              const improvement = latest && first ? +(latest.max_kg - first.max_kg).toFixed(1) : 0
              return (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300 truncate mr-2">{name}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {improvement !== 0 && (
                        <span className={`text-[10px] font-semibold ${improvement > 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                          {improvement > 0 ? '+' : ''}{improvement} kg
                        </span>
                      )}
                      <span className="text-[11px] text-[var(--text-tertiary)]">{max} kg PR</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-0.5 h-10">
                    {points.slice(-24).map((p, i) => {
                      const pct = ((p.max_kg - min) / range) * 75 + 25
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-indigo-400 dark:bg-indigo-500 transition-all min-w-[2px]"
                          style={{ height: `${pct}%` }}
                          title={`${p.date}: ${p.max_kg} kg`}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Progress Photos ───────────────────────────────────────────────── */}
      {Array.isArray(analytics?.photos) && analytics.photos.length > 0 && (
        <div className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-5">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Progress Photos</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2">
            {analytics.photos.map((p) => (
              <div key={p.id} className="aspect-square border border-[var(--border)] dark:border-white/[0.06] overflow-hidden bg-[var(--bg-subtle)]">
                {p.url ? (
                  <img src={p.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={20} className="text-slate-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
