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
  return days[date.getDay()]
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords

          // Reverse geocode via Nominatim (free, no key)
          const geoRes  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const geoJson = await geoRes.json()
          const city    =
            geoJson.address?.city  ??
            geoJson.address?.town  ??
            geoJson.address?.village ??
            'Your location'

          // Weather via Open-Meteo (free, no key)
          const wtRes  = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
          )
          const wtJson = await wtRes.json()
          const cw     = wtJson.current_weather
          const { condition, icon } = decodeWMO(cw.weathercode)

          // Build forecast (next 5 days)
          const forecast = wtJson.daily?.time?.slice(1, 6).map((date: string, i: number) => {
            const wmo = wtJson.daily.weather_code[i + 1]
            const decoded = decodeWMO(wmo)
            return {
              day: getDayName(date),
              temp: Math.round(wtJson.daily.temperature_2m_max[i + 1]),
              icon: decoded.icon,
              condition: decoded.condition,
            }
          }) ?? []

          setWeather({
            temp: Math.round(cw.temperature),
            condition,
            icon,
            city,
            forecast,
          })
        } catch (e: any) {
          setError(e.message ?? 'Failed to load weather')
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        // Fallback to Munich, Germany for demo/development
        setError('Using demo location (Munich)')
        fetchWeatherFallback(48.1351, 11.5820, 'Munich')
      },
      { timeout: 8000 }
    )
  }, [])

  async function fetchWeatherFallback(lat: number, lon: number, city: string) {
    try {
      const wtRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
      )
      const wtJson = await wtRes.json()
      const cw = wtJson.current_weather
      const { condition, icon } = decodeWMO(cw.weathercode)

      const forecast = wtJson.daily?.time?.slice(1, 6).map((date: string, i: number) => {
        const wmo = wtJson.daily.weather_code[i + 1]
        const decoded = decodeWMO(wmo)
        return {
          day: getDayName(date),
          temp: Math.round(wtJson.daily.temperature_2m_max[i + 1]),
          icon: decoded.icon,
          condition: decoded.condition,
        }
      }) ?? []

      setWeather({
        temp: Math.round(cw.temperature),
        condition,
        icon,
        city,
        forecast,
      })
    } catch (e: any) {
      setError('Failed to load weather data')
    } finally {
      setLoading(false)
    }
  }

  return { weather, loading, error }
}
