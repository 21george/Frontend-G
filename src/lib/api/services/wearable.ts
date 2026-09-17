import api from '../client'
import type { ApiResponse, PaginatedResponse } from '@/types'

export interface WearableDailySummary {
  date: string
  source?: string
  steps?: number | null
  active_calories?: number | null
  distance_km?: number | null
  hydration_ml?: number | null
  resting_hr?: number | null
  sleep_minutes?: number | null
  sleep_score?: number | null
  recovery_score?: number | null
}

export interface WearableTrend {
  metric: string
  window_days: number
  points: { date: string; value: number }[]
  average: number
  total: number
  min: number
  max: number
}

export interface WearableSession {
  id: string
  provider: string
  type: string
  start_time: string
  end_time?: string | null
  duration_min: number
  calories: number
  avg_hr?: number | null
  max_hr?: number | null
  steps: number
  distance_km: number
}

export interface WearableSharingSettings {
  steps: boolean
  active_calories: boolean
  distance_km: boolean
  hydration_ml: boolean
  resting_hr: boolean
  sleep_minutes: boolean
  sleep_score: boolean
  hrv_ms: boolean
  active_minutes: boolean
  recovery_score: boolean
}

export const wearableApi = {
  getClientData: (clientId: string, from?: string, to?: string) =>
    api
      .get<ApiResponse<WearableDailySummary[]>>(`/coach/clients/${clientId}/wearable`, { params: { from, to } })
      .then((r) => r.data),

  getTrend: (clientId: string, metric: string, days: number) =>
    api
      .get<ApiResponse<WearableTrend>>(`/coach/clients/${clientId}/wearable/trend`, {
        params: { metric, days },
      })
      .then((r) => r.data),

  getSessions: (clientId: string, from?: string, to?: string) =>
    api
      .get<ApiResponse<WearableSession[]>>(`/coach/clients/${clientId}/wearable/sessions`, { params: { from, to } })
      .then((r) => r.data),
}
