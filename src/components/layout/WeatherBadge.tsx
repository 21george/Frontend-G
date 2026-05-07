'use client'

import {
  Sun, Cloud, CloudSun, CloudFog, CloudRain, CloudSnow,
  CloudDrizzle, CloudLightning, MapPin, Navigation,
} from 'lucide-react'
import { useWeather } from '@/hooks/useWeather'
import { useNearbyGyms } from '@/hooks/useNearbyGyms'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const ICON_MAP: Record<string, React.ElementType> = {
  'sun':              Sun,
  'cloud-sun':        CloudSun,
  'cloud':            Cloud,
  'cloud-fog':        CloudFog,
  'cloud-rain':       CloudRain,
  'cloud-snow':       CloudSnow,
  'cloud-drizzle':    CloudDrizzle,
  'cloud-lightning':  CloudLightning,
}

const weatherGradients: Record<string, string> = {
  'sun':             'from-amber-400 via-orange-300 to-yellow-200',
  'cloud-sun':       'from-blue-300 via-sky-200 to-amber-100',
  'cloud':           'from-slate-300 via-slate-200 to-gray-100',
  'cloud-fog':       'from-slate-400 via-slate-300 to-slate-200',
  'cloud-rain':      'from-blue-500 via-blue-400 to-sky-300',
  'cloud-snow':      'from-sky-200 via-blue-100 to-white',
  'cloud-drizzle':   'from-slate-400 via-slate-300 to-blue-200',
  'cloud-lightning': 'from-purple-500 via-indigo-400 to-yellow-200',
}

const weatherBgDark: Record<string, string> = {
  'sun':             'from-amber-500/15 via-orange-500/10 to-transparent',
  'cloud-sun':       'from-sky-500/15 via-blue-500/10 to-transparent',
  'cloud':           'from-slate-500/15 via-slate-400/10 to-transparent',
  'cloud-fog':       'from-slate-600/15 via-slate-500/10 to-transparent',
  'cloud-rain':      'from-blue-500/15 via-indigo-500/10 to-transparent',
  'cloud-snow':      'from-sky-300/15 via-blue-200/10 to-transparent',
  'cloud-drizzle':   'from-slate-500/15 via-blue-400/10 to-transparent',
  'cloud-lightning': 'from-purple-500/15 via-indigo-500/10 to-transparent',
}

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`
}

export function WeatherBadge() {
  const { weather, loading, error } = useWeather()
  const { gyms, loading: gymsLoading } = useNearbyGyms()
  const [showGyms, setShowGyms] = useState(false)

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden h-20 bg-slate-100 dark:bg-white/[0.06] animate-pulse flex items-center gap-3 px-4"
      >
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/[0.08]" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 bg-slate-200 dark:bg-white/[0.08]" />
          <div className="h-2 w-14 bg-slate-200 dark:bg-white/[0.08]" />
        </div>
      </motion.div>
    )
  }

  if (error || !weather) {
    return (
      <div className="flex items-center gap-3 px-4 h-20 bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 text-xs">
        <Cloud className="w-8 h-8 opacity-50" />
        <div>
          <p className="font-medium text-sm">Weather unavailable</p>
          <p className="text-[10px] opacity-70">{error || 'Check location services'}</p>
        </div>
      </div>
    )
  }

  const Icon = ICON_MAP[weather.icon] ?? Cloud
  const gradient = weatherGradients[weather.icon] ?? weatherGradients.cloud
  const bgDark = weatherBgDark[weather.icon] ?? weatherBgDark.cloud
  const hasGyms = !gymsLoading && gyms.length > 0

  return (
    <div className="flex flex-col gap-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden h-[5.5rem] group cursor-pointer"
        aria-label={`${weather.condition}, ${weather.temp} degrees in ${weather.city}`}
      >
        {/* Light-mode gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90 dark:opacity-0 transition-opacity`} />
        {/* Dark-mode subtle gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${bgDark} opacity-0 dark:opacity-100 transition-opacity`} />

        {/* Animated shine */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
        />

        {/* Content */}
        <div className="relative z-10 p-3 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
            >
              <Icon className="w-5 h-5 text-[#132E35] dark:text-[#2A96AD]" />
            </motion.div>
            <div>
              <p className="text-sm font-bold text-[#132E35] dark:text-[#FAFAFA]">
                {weather.temp}°C
              </p>
              <p className="text-[10px] text-[#132E35]/70 dark:text-[#FAFAFA]/60 truncate max-w-[120px]">
                {weather.city}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium text-[#132E35] dark:text-[#2A96AD]">
              {weather.condition}
            </p>
            {hasGyms && (
              <button
                onClick={() => setShowGyms(!showGyms)}
                className="text-[10px] text-[#132E35]/70 dark:text-[#2A96AD]/70 hover:text-[#132E35] dark:hover:text-[#2A96AD] underline underline-offset-2"
              >
                {gyms.length} gyms nearby
              </button>
            )}
          </div>
        </div>

        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
      </motion.div>

      {/* Nearby gyms mini-list */}
      <AnimatePresence>
        {showGyms && hasGyms && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white dark:bg-[#1A1A1A] border border-[#E2E8F0] dark:border-white/[0.06]"
          >
            <div className="p-2 space-y-1">
              {gyms.slice(0, 3).map((gym) => (
                <a
                  key={gym.id}
                  href={`https://www.google.com/maps/dir/?api=1&destination=${gym.location.lat},${gym.location.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-[#EAF4F1] dark:hover:bg-[#132E35]/30 transition-colors"
                >
                  <MapPin className="w-3 h-3 text-brand-600 dark:text-brand-400 shrink-0" />
                  <span className="flex-1 truncate">{gym.name}</span>
                  <span className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">
                    {formatDistance(gym.distance)}
                  </span>
                  <Navigation className="w-3 h-3 text-slate-400" />
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
