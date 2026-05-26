'use client'

import { useState, useEffect } from 'react'

export interface WeatherData {
  temp: number
  condition: string
  icon: string
  city: string
  humidity?: number
  windSpeed?: number
  forecast?: Array<{
    day: string
    temp: number
    icon: string
    condition: string
  }>
}

function decodeWMO(code: number): { condition: string; icon: string } {
  if (code === 0)  return { condition: 'Clear',         icon: 'sun'            }
  if (code <= 2)   return { condition: 'Partly Cloudy', icon: 'cloud-sun'      }
  if (code === 3)  return { condition: 'Overcast',      icon: 'cloud'          }
  if (code <= 49)  return { condition: 'Foggy',         icon: 'cloud-fog'      }
  if (code <= 69)  return { condition: 'Rain',          icon: 'cloud-rain'     }
  if (code <= 79)  return { condition: 'Snow',          icon: 'cloud-snow'     }
  if (code <= 82)  return { condition: 'Showers',       icon: 'cloud-drizzle'  }
  if (code <= 99)  return { condition: 'Thunderstorm',  icon: 'cloud-lightning'}
  return { condition: 'Unknown', icon: 'cloud' }
}

function getDayName(dateStr: string): string {
  const date = new Date(dateStr)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[date.getUTCDay()]
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const abortCtrl = new AbortController()

    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (!mounted) return
        try {
          const { latitude, longitude } = pos.coords

          // Reverse geocode via Nominatim (free, no key)
          const geoRes  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' }, signal: abortCtrl.signal }
          )
          const geoJson = await geoRes.json()
          const city    =
            geoJson.address?.city  ??
            geoJson.address?.town  ??
            geoJson.address?.village ??
            'Your location'

          // Weather via Open-Meteo (free, no key)
          const wtRes  = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`,
            { signal: abortCtrl.signal }
          )
          const wtJson = await wtRes.json()
          const cw     = wtJson.current_weather
          const { condition, icon } = decodeWMO(cw.weathercode)

          // Build forecast (next 5 days) — skip any day missing wmo or tempMax
          const forecast = wtJson.daily?.time?.slice(1, 6).flatMap((date: string, i: number) => {
            const wmo = wtJson.daily?.weather_code?.[i + 1]
            const tempMax = wtJson.daily?.temperature_2m_max?.[i + 1]
            if (wmo === undefined || wmo === null || tempMax === undefined || tempMax === null) return []
            const decoded = decodeWMO(wmo)
            return [{
              day: getDayName(date),
              temp: Math.round(tempMax),
              icon: decoded.icon,
              condition: decoded.condition,
            }]
          }) ?? []

          if (!mounted) return
          setWeather({
            temp: Math.round(cw.temperature),
            condition,
            icon,
            city,
            forecast,
          })
        } catch (e: any) {
          if (!mounted) return
          if (e.name !== 'AbortError') setError(e.message ?? 'Failed to load weather')
        } finally {
          if (mounted) setLoading(false)
        }
      },
      (err) => {
        if (!mounted) return
        // Fallback to Munich, Germany for demo/development
        setError('Using demo location (Munich)')
        fetchWeatherFallback(48.1351, 11.5820, 'Munich', abortCtrl.signal)
      },
      { timeout: 8000 }
    )

    return () => {
      mounted = false
      abortCtrl.abort()
    }
  }, [])

  async function fetchWeatherFallback(lat: number, lon: number, city: string, signal?: AbortSignal) {
    try {
      const wtRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`,
        { signal }
      )
      const wtJson = await wtRes.json()
      const cw = wtJson.current_weather
      const { condition, icon } = decodeWMO(cw.weathercode)

      // Skip any day missing wmo or tempMax
      const forecast = wtJson.daily?.time?.slice(1, 6).flatMap((date: string, i: number) => {
        const wmo = wtJson.daily?.weather_code?.[i + 1]
        const tempMax = wtJson.daily?.temperature_2m_max?.[i + 1]
        if (wmo === undefined || wmo === null || tempMax === undefined || tempMax === null) return []
        const decoded = decodeWMO(wmo)
        return [{
          day: getDayName(date),
          temp: Math.round(tempMax),
          icon: decoded.icon,
          condition: decoded.condition,
        }]
      }) ?? []

      setWeather({
        temp: Math.round(cw.temperature),
        condition,
        icon,
        city,
        forecast,
      })
    } catch (e: any) {
      if (e.name !== 'AbortError') setError('Failed to load weather data')
    } finally {
      setLoading(false)
    }
  }

  return { weather, loading, error }
}
