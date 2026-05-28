'use client'

import { useState, useEffect, useRef } from 'react'

export type GymType = 'gym' | 'fitness_centre' | 'outdoor'

export interface Gym {
  id: string
  name: string
  type: GymType
  distance: number   // metres
  address: string
  location: { lat: number; lon: number }
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

async function queryOverpass(lat: number, lon: number, signal?: AbortSignal, radius = 3000): Promise<Gym[]> {
  const query = `
    [out:json][timeout:10];
    (
      node["leisure"="fitness_centre"](around:${radius},${lat},${lon});
      node["amenity"="gym"](around:${radius},${lat},${lon});
      way["leisure"="fitness_centre"](around:${radius},${lat},${lon});
      node["leisure"="outdoor_gym"](around:${radius},${lat},${lon});
    );
    out center 50;
  `
  const res  = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal,
  })
  const json = await res.json()

  return (json.elements ?? [])
    .map((el: any) => {
      const elLat = el.lat ?? el.center?.lat ?? 0
      const elLon = el.lon ?? el.center?.lon ?? 0
      const gymType: GymType =
        el.tags?.leisure === 'outdoor_gym' ? 'outdoor'
        : el.tags?.amenity === 'gym'       ? 'gym'
        : 'fitness_centre'
      return {
        id:       String(el.id),
        name:     el.tags?.name ?? 'Fitness Studio',
        type:     gymType,
        distance: Math.round(haversine(lat, lon, elLat, elLon)),
        address:  [el.tags?.['addr:street'], el.tags?.['addr:housenumber']]
                   .filter(Boolean).join(' ') || '',
        location: { lat: elLat, lon: elLon },
      }
    })
    .sort((a: Gym, b: Gym) => a.distance - b.distance)
}

export function useNearbyGyms(radius: number = 3000) {
  const [gyms,    setGyms]    = useState<Gym[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  function load(r: number) {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal
    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (signal.aborted) return
        try {
          const { latitude, longitude } = pos.coords
          setUserLocation({ lat: latitude, lon: longitude })
          const results = await queryOverpass(latitude, longitude, signal, r)
          if (!signal.aborted) setGyms(results)
        } catch (e: any) {
          if (!signal.aborted) setError(e.message ?? 'Failed to load gyms')
        } finally {
          if (!signal.aborted) setLoading(false)
        }
      },
      (err) => {
        if (!signal.aborted) {
          setError(err.message)
          setLoading(false)
        }
      },
      { timeout: 8000 }
    )
  }

  useEffect(() => {
    load(radius)
    return () => { abortRef.current?.abort() }
  }, [radius]) // eslint-disable-line react-hooks/exhaustive-deps

  return { gyms, loading, error, reload: () => load(radius), userLocation }
}
