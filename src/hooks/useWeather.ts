'use client'

import { useState, useEffect } from 'react'

export interface WeatherData {
  temp: number
  condition: string
  icon: string      // Lucide-compatible key
  city: string
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
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          )
          const wtJson = await wtRes.json()
          const cw     = wtJson.current_weather
          const { condition, icon } = decodeWMO(cw.weathercode)

          setWeather({ temp: Math.round(cw.temperature), condition, icon, city })
        } catch (e: any) {
          setError(e.message ?? 'Failed to load weather')
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
      { timeout: 8000 }
    )
  }, [])

  return { weather, loading, error }
}
