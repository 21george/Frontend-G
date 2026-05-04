'use client'

import { Sun, Cloud, CloudFog, CloudRain, CloudSnow, CloudLightning, CloudDrizzle } from 'lucide-react'
import { useWeather } from '@/hooks/useWeather'

const weatherIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'sun': Sun,
  'cloud-sun': Cloud,
  'cloud': Cloud,
  'cloud-fog': CloudFog,
  'cloud-rain': CloudRain,
  'cloud-snow': CloudSnow,
  'cloud-lightning': CloudLightning,
  'cloud-drizzle': CloudDrizzle,
}

export default function WeatherForecast() {
  const { weather, loading, error } = useWeather()

  if (loading || error || !weather) return null

  const Icon = weatherIconMap[weather.icon] ?? Cloud

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
      <div className="text-blue-600 dark:text-blue-400">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">{weather.temp}°C</span>
        <span className="text-xs text-[var(--text-tertiary)] hidden sm:inline">{weather.condition}</span>
        <span className="text-xs text-slate-400 dark:text-slate-500 hidden md:inline">| {weather.city}</span>
      </div>
    </div>
  )
}
