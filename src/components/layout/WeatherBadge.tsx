'use client'

import {
  Sun, Cloud, CloudSun, CloudFog, CloudRain, CloudSnow,
  CloudDrizzle, CloudLightning,
} from 'lucide-react'
import { useWeather } from '@/hooks/useWeather'

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

export function WeatherBadge() {
  const { weather, loading } = useWeather()

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] animate-pulse">
        <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-white/20" />
        <div className="w-12 h-3 rounded bg-slate-300 dark:bg-white/20" />
      </div>
    )
  }

  if (!weather) return null

  const Icon = ICON_MAP[weather.icon] ?? Cloud

  return (
    <div
      title={`${weather.condition} in ${weather.city}`}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 dark:bg-sky-900/20 border border-sky-200/60 dark:border-sky-700/30 text-sky-700 dark:text-sky-300 text-xs font-medium select-none"
    >
      <Icon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
      <span className="font-semibold">{weather.temp}°C</span>
      <span className="text-slate-400 dark:text-slate-500">·</span>
      <span className="max-w-[90px] truncate text-slate-500 dark:text-slate-400">{weather.city}</span>
    </div>
  )
}
