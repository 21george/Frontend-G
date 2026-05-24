'use client'

import { ImageIcon } from 'lucide-react'
import type { AnalyticsData } from '@/types'

interface Props {
  analytics: AnalyticsData | undefined
}

function StatCard({ label, value, unit, color }: { label: string; value: number; unit?: string; color: string }) {
  return (
    <div className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-4">
      <p className="text-[10px] font-semibold text-[var(--text-tertiary)] dark:text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-semibold" style={{ color }}>
        {value}
        {unit && <span className="text-[12px] font-normal text-[var(--text-tertiary)] ml-1">{unit}</span>}
      </p>
    </div>
  )
}

export function ClientAnalyticsTab({ analytics }: Props) {
  const completionRates = Array.isArray(analytics?.completion_rate) ? analytics.completion_rate : []
  const weeklyVolume = Array.isArray(analytics?.weekly_volume) ? analytics.weekly_volume : []
  const personalRecords = Array.isArray(analytics?.personal_records) ? analytics.personal_records : []
  const exerciseProgress = analytics?.exercise_progress ?? {}
  const measurements = Array.isArray(analytics?.measurements) ? analytics.measurements : []
  const photos = Array.isArray(analytics?.photos) ? analytics.photos : []

  return (
    <div className="space-y-5">
      <h3 className="text-[14px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">Real-Time Progress & Analytics</h3>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Streak"       value={analytics?.current_streak ?? 0} unit="days"  color="#f97316" />
        <StatCard label="Workouts"     value={analytics?.total_workouts ?? 0}              color="#3b82f6" />
        <StatCard label="Total Volume" value={Number(((analytics?.total_volume ?? 0) / 1000).toFixed(1))} unit="t" color="#8b5cf6" />
        <StatCard label="Total Sets"   value={analytics?.total_sets ?? 0}                 color="#10b981" />
      </div>

      {/* Weekly completion */}
      <div className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-5">
        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Weekly Completion Rate</p>
        {completionRates.length === 0 ? (
          <p className="text-[13px] text-[var(--text-tertiary)] py-4 text-center">No completion data yet</p>
        ) : (
          <div className="flex items-end gap-2 h-32">
            {completionRates.slice(-12).reverse().map((w: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">{w.rate}%</span>
                <div className="w-full transition-all" style={{
                  height: `${Math.max(w.rate, 4)}%`,
                  background: w.rate >= 80 ? '#10b981' : w.rate >= 50 ? '#f59e0b' : '#ef4444',
                }} />
                <span className="text-[9px] text-slate-400 truncate w-full text-center">{w.week?.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly volume */}
      {weeklyVolume.length > 0 && (
        <div className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-5">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Weekly Volume Trend</p>
          <div className="flex items-end gap-2 h-28">
            {weeklyVolume.map((w: any, i: number) => {
              const maxVol = Math.max(...weeklyVolume.map((v: any) => v.volume))
              const pct = maxVol > 0 ? (w.volume / maxVol) * 100 : 0
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-semibold text-[var(--text-tertiary)]">{(w.volume / 1000).toFixed(1)}t</span>
                  <div className="w-full bg-blue-500 transition-all" style={{ height: `${Math.max(pct, 4)}%` }} />
                  <span className="text-[9px] text-slate-400">{w.sessions}s</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Personal Records */}
      {personalRecords.length > 0 && (
        <div className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-5">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Personal Records</p>
          <div className="space-y-2">
            {personalRecords.map((pr: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-[var(--bg-subtle)] dark:bg-white/[0.02] border border-[var(--border)] dark:border-white/[0.04]">
                <div className="w-7 h-7 bg-amber-100 dark:bg-amber-900/25 flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-semibold text-amber-600">#{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-slate-800 dark:text-slate-200 truncate">{pr.exercise}</p>
                  {pr.date && <p className="text-[10px] text-slate-400">{pr.date}</p>}
                </div>
                <span className="text-[14px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                  {pr.max_kg} <span className="text-[10px] font-normal text-[var(--text-tertiary)]">kg</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercise Progress */}
      {Object.keys(exerciseProgress).length > 0 && (
        <div className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-5">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Exercise Progress (Max Weight Over Time)</p>
          <div className="space-y-4">
            {Object.entries(exerciseProgress).slice(0, 5).map(([name, data]: [string, any]) => {
              const points = Array.isArray(data) ? data : []
              const max = Math.max(...points.map((p: any) => p.max_kg))
              const min = Math.min(...points.map((p: any) => p.max_kg))
              return (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300">{name}</p>
                    <span className="text-[11px] text-[var(--text-tertiary)]">{min}–{max} kg</span>
                  </div>
                  <div className="flex items-end gap-0.5 h-10">
                    {points.slice(-20).map((p: any, i: number) => {
                      const range = max - min || 1
                      const pct = ((p.max_kg - min) / range) * 80 + 20
                      return <div key={i} className="flex-1 bg-blue-400 dark:bg-blue-500 transition-all" style={{ height: `${pct}%` }} title={`${p.date}: ${p.max_kg}kg`} />
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Body Measurements */}
      <div className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-5">
        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Body Measurements</p>
        {measurements.length === 0 ? (
          <p className="text-[13px] text-[var(--text-tertiary)] py-4 text-center">No measurements recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {['Date', 'Weight', 'Chest', 'Waist', 'Hips', 'Body Fat'].map(h => (
                    <th key={h} className="pb-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {measurements.slice(-10).reverse().map((m: any, i: number) => (
                  <tr key={i}>
                    <td className="py-2 pr-4 text-[var(--text-tertiary)]">{m.date ?? '—'}</td>
                    <td className="py-2 pr-4 font-medium text-slate-800 dark:text-slate-200">{m.weight_kg ? `${m.weight_kg} kg` : '—'}</td>
                    <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{m.chest_cm ? `${m.chest_cm} cm` : '—'}</td>
                    <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{m.waist_cm ? `${m.waist_cm} cm` : '—'}</td>
                    <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{m.hips_cm ? `${m.hips_cm} cm` : '—'}</td>
                    <td className="py-2 text-slate-600 dark:text-slate-300">{m.body_fat_pct ? `${m.body_fat_pct}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Progress Photos */}
      {photos.length > 0 && (
        <div className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-5">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Progress Photos</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {photos.map((p: any) => (
              <div key={p.id} className="aspect-square bg-[var(--bg-subtle)] dark:bg-[var(--bg-subtle)] border border-[var(--border)] dark:border-white/[0.06] overflow-hidden">
                {p.url ? <img src={p.url} alt="" className="w-full h-full object-cover" /> : (
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
