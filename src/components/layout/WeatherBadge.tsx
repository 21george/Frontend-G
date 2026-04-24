'use client'

import {
  Sun, Cloud, CloudSun, CloudFog, CloudRain, CloudSnow,
  CloudDrizzle, CloudLightning,
} from 'lucide-react'
import { useWeather } from '@/hooks/useWeather'
import { motion } from 'framer-motion'

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
  'sun': 'from-amber-400 via-orange-400 to-yellow-300',
  'cloud-sun': 'from-blue-400 via-sky-300 to-amber-200',
  'cloud': 'from-slate-400 via-slate-300 to-gray-200',
  'cloud-fog': 'from-slate-500 via-slate-400 to-slate-300',
  'cloud-rain': 'from-indigo-500 via-blue-400 to-sky-300',
  'cloud-snow': 'from-blue-200 via-sky-100 to-white',
  'cloud-drizzle': 'from-slate-400 via-slate-300 to-blue-200',
  'cloud-lightning': 'from-purple-500 via-indigo-400 to-yellow-300',
}

const weatherBgDark: Record<string, string> = {
  'sun': 'from-amber-500/20 via-orange-500/10 to-transparent',
  'cloud-sun': 'from-sky-500/20 via-blue-500/10 to-transparent',
  'cloud': 'from-slate-500/20 via-slate-400/10 to-transparent',
  'cloud-fog': 'from-slate-600/20 via-slate-500/10 to-transparent',
  'cloud-rain': 'from-blue-500/20 via-indigo-500/10 to-transparent',
  'cloud-snow': 'from-sky-300/20 via-blue-200/10 to-transparent',
  'cloud-drizzle': 'from-slate-500/20 via-blue-400/10 to-transparent',
  'cloud-lightning': 'from-purple-500/20 via-indigo-500/10 to-transparent',
}

export function WeatherBadge() {
  const { weather, loading } = useWeather()

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden w-32 h-20 rounded-2xl bg-slate-100 dark:bg-white/[0.06] animate-pulse"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200/50 to-slate-100 dark:from-white/[0.08] dark:to-transparent" />
      </motion.div>
    )
  }

  if (!weather) return null

  const Icon = ICON_MAP[weather.icon] ?? Cloud
  const gradient = weatherGradients[weather.icon] ?? weatherGradients.cloud
  const bgDark = weatherBgDark[weather.icon] ?? weatherBgDark.cloud

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden w-40 h-24 rounded-2xl cursor-pointer group"
    >
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90 dark:opacity-100 transition-opacity`} />
      <div className={`absolute inset-0 bg-gradient-to-br ${bgDark} dark:opacity-100 opacity-0`} />

      {/* Subtle animated shine */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
      />

      {/* Content */}
      <div className="relative z-10 p-3 h-full flex flex-col">
        {/* Top row: Icon + Temp */}
        <div className="flex items-start justify-between">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
          >
            <Icon className="w-6 h-6 text-white drop-shadow-lg" />
          </motion.div>
          <span className="text-2xl font-bold text-white drop-shadow-md">
            {weather.temp}°
          </span>
        </div>

        {/* Bottom row: City + Condition */}
        <div className="mt-auto">
          <p className="text-[10px] font-medium text-white/90 truncate drop-shadow">
            {weather.city}
          </p>
          <p className="text-[9px] text-white/70 truncate">
            {weather.condition}
          </p>
        </div>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
    </motion.div>
  )
}
