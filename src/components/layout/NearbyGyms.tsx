'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Dumbbell, X, Loader2, RefreshCw, Navigation } from 'lucide-react'
import { useNearbyGyms, Gym } from '@/hooks/useNearbyGyms'
import { motion, AnimatePresence } from 'framer-motion'

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`
}

// Simple map component using OpenStreetMap tiles
function GymMap({ gyms, userLocation }: { gyms: Gym[]; userLocation: { lat: number; lon: number } | null }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (mapRef.current) {
      setMapSize({
        width: mapRef.current.offsetWidth,
        height: mapRef.current.offsetHeight,
      })
    }
  }, [])

  if (!userLocation) {
    return (
      <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">Location not available</p>
        </div>
      </div>
    )
  }

  // Calculate bounds from gyms + user location
  const allPoints = [
    { lat: userLocation.lat, lon: userLocation.lon },
    ...gyms.map((g) => g.location),
  ]

  const minLat = Math.min(...allPoints.map((p) => p.lat))
  const maxLat = Math.max(...allPoints.map((p) => p.lat))
  const minLon = Math.min(...allPoints.map((p) => p.lon))
  const maxLon = Math.max(...allPoints.map((p) => p.lon))

  const latRange = maxLat - minLat || 0.01
  const lonRange = maxLon - minLon || 0.01

  const padding = 0.2
  const adjustedMinLat = minLat - latRange * padding
  const adjustedMaxLat = maxLat + latRange * padding
  const adjustedMinLon = minLon - lonRange * padding
  const adjustedMaxLon = maxLon + lonRange * padding

  const adjustedLatRange = adjustedMaxLat - adjustedMinLat
  const adjustedLonRange = adjustedMaxLon - adjustedMinLon

  const projectToMap = (lat: number, lon: number) => {
    const x = ((lon - adjustedMinLon) / adjustedLonRange) * mapSize.width
    const y = ((adjustedMaxLat - lat) / adjustedLatRange) * mapSize.height
    return { x, y }
  }

  const center = projectToMap(userLocation.lat, userLocation.lon)

  return (
    <div ref={mapRef} className="absolute inset-0 bg-slate-100 dark:bg-slate-800 overflow-hidden">
      {/* OSM Tile Layer */}
      <div
        className="absolute inset-0 opacity-60 dark:opacity-40"
        style={{
          backgroundImage: `url('https://tile.openstreetmap.org/16/${Math.floor((userLocation.lon + 180) / 360 * Math.pow(2, 16))}/${Math.floor((1 - Math.log(Math.tan(userLocation.lat * Math.PI / 180) + 1 / Math.cos(userLocation.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, 16))}.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Grid overlay for style */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Gym markers */}
      <AnimatePresence>
        {gyms.map((gym, i) => {
          const pos = projectToMap(gym.location.lat, gym.location.lon)
          return (
            <motion.div
              key={gym.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 300 }}
              className="absolute"
              style={{ left: pos.x - 12, top: pos.y - 24 }}
            >
              <div className="relative group cursor-pointer">
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-slate-700">
                  <Dumbbell className="w-3 h-3 text-white" />
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded pointer-events-none z-10">
                  {gym.name}
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* User location marker */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
        className="absolute"
        style={{ left: center.x - 8, top: center.y - 8 }}
      >
        <div className="w-4 h-4 bg-blue-500 rounded-full ring-4 ring-blue-500/30 animate-pulse" />
      </motion.div>
    </div>
  )
}

export function NearbyGymsButton() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'list' | 'map'>('list')
  const { gyms, loading, error, reload, userLocation } = useNearbyGyms()

  // Reset view when opening
  useEffect(() => {
    if (open) {
      setView('list')
    }
  }, [open])

  return (
    <>
      {/* Trigger */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        title="Find fitness studios nearby"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-700/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-sm"
      >
        <MapPin className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Nearby Gyms</span>
        <span className="sm:hidden">Nearby</span>
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
        {!loading && gyms.length > 0 && (
          <span className="ml-0.5 text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {gyms.length}
          </span>
        )}
      </motion.button>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, type: 'spring' }}
              className="fixed inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-20 sm:w-[600px] z-50 bg-white dark:bg-[#1a1a1a] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.08] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Dumbbell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                      Fitness Studios Nearby
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      {gyms.length} {gyms.length === 1 ? 'studio' : 'studios'} found within 3km
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={reload}
                    title="Refresh"
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
                <div className="flex items-center bg-slate-100 dark:bg-white/[0.06] rounded-xl p-1">
                  <button
                    onClick={() => setView('list')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      view === 'list'
                        ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-neutral-400'
                    }`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setView('map')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      view === 'map'
                        ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-neutral-400'
                    }`}
                  >
                    Map
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden relative">
                {view === 'list' ? (
                  <div className="h-full overflow-y-auto">
                    {loading && (
                      <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p className="text-sm">Finding studios near you…</p>
                      </div>
                    )}

                    {error && !loading && (
                      <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 px-6 text-center">
                        <MapPin className="w-8 h-8" />
                        <p className="text-sm">{error}</p>
                      </div>
                    )}

                    {!loading && !error && gyms.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                        <Dumbbell className="w-8 h-8" />
                        <p className="text-sm text-center">No studios found within 3km</p>
                      </div>
                    )}

                    {!loading && gyms.length > 0 && (
                      <ul className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                        {gyms.map((gym, i) => (
                          <motion.li
                            key={gym.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 shadow-md">
                              <Dumbbell className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                                {gym.name}
                              </p>
                              {gym.address && (
                                <p className="text-xs text-slate-400 truncate mt-0.5">{gym.address}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full shrink-0">
                                {formatDistance(gym.distance)}
                              </span>
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${gym.location.lat},${gym.location.lon}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors opacity-0 group-hover:opacity-100"
                                title="Get directions"
                              >
                                <Navigation className="w-4 h-4" />
                              </a>
                            </div>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0">
                    <GymMap gyms={gyms} userLocation={userLocation} />
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
