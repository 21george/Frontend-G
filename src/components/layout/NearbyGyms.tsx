'use client'

import { useState } from 'react'
import { MapPin, Dumbbell, X, Loader2, RefreshCw } from 'lucide-react'
import { useNearbyGyms } from '@/hooks/useNearbyGyms'

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`
}

export function NearbyGymsButton() {
  const [open, setOpen]              = useState(false)
  const { gyms, loading, error, reload } = useNearbyGyms()

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        title="Find fitness studios nearby"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-700/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
      >
        <MapPin className="w-3.5 h-3.5 shrink-0" />
        <span>Nearby</span>
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
      </button>

      {/* Panel overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div className="relative z-10 w-full sm:w-96 bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[70vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 dark:border-white/[0.07] shrink-0">
              <Dumbbell className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <h2 className="flex-1 text-sm font-semibold text-slate-800 dark:text-white">
                Fitness Studios Nearby
              </h2>
              <button onClick={reload} title="Refresh" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1">
              {loading && (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p className="text-xs">Finding studios near you…</p>
                </div>
              )}

              {error && !loading && (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                  <MapPin className="w-6 h-6" />
                  <p className="text-xs text-center px-4">{error}</p>
                </div>
              )}

              {!loading && !error && gyms.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                  <Dumbbell className="w-6 h-6" />
                  <p className="text-xs">No studios found within 3 km</p>
                </div>
              )}

              {!loading && gyms.length > 0 && (
                <ul className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                  {gyms.map((gym) => (
                    <li key={gym.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <Dumbbell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{gym.name}</p>
                        {gym.address && (
                          <p className="text-xs text-slate-400 truncate">{gym.address}</p>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                        {formatDistance(gym.distance)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
