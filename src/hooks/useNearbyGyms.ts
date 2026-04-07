'use client'

import { useState, useEffect } from 'react'

export interface Gym {
  id: string
  name: string
  distance: number   // metres
  address: string
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R  = 6371000
  const dL = ((lat2 - lat1) * Math.PI) / 180
  const dG = ((lon2 - lon1) * Math.PI) / 180
  const a  =
    Math.sin(dL / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dG / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function queryOverpass(lat: number, lon: number, radius = 3000): Promise<Gym[]> {
  const query = `
    [out:json][timeout:10];
    (
      node["leisure"="fitness_centre"](around:${radius},${lat},${lon});
      node["amenity"="gym"](around:${radius},${lat},${lon});
      way["leisure"="fitness_centre"](around:${radius},${lat},${lon});
    );
    out center 8;
  `
  const res  = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  const json = await res.json()

  return (json.elements ?? [])
    .map((el: any) => {
      const elLat = el.lat ?? el.center?.lat ?? 0
      const elLon = el.lon ?? el.center?.lon ?? 0
      return {
        id:       String(el.id),
        name:     el.tags?.name ?? 'Fitness Studio',
        distance: Math.round(haversine(lat, lon, elLat, elLon)),
        address:  [el.tags?.['addr:street'], el.tags?.['addr:housenumber']]
                   .filter(Boolean).join(' ') || '',
      }
    })
    .sort((a: Gym, b: Gym) => a.distance - b.distance)
    .slice(0, 5)
}

export function useNearbyGyms() {
  const [gyms,    setGyms]    = useState<Gym[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  function load() {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }
    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const results = await queryOverpass(pos.coords.latitude, pos.coords.longitude)
          setGyms(results)
        } catch (e: any) {
          setError(e.message ?? 'Failed to load gyms')
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
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { gyms, loading, error, reload: load }
}
