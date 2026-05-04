import api from '../client'
import type { WorkoutPlan, WorkoutPlanType, PaginatedResponse, ApiResponse } from '@/types'

/**
 * Allowed hostnames for Google Drive import URLs.
 * NOTE: The backend must also implement its own robust URL validation,
 * allowlisting, and request timeouts — client-side validation is not a
 * substitute for server-side checks.
 */
const ALLOWED_DRIVE_HOSTNAMES = new Set([
  'drive.google.com',
  'docs.google.com',
  'drive.googleusercontent.com',
])

/**
 * Validate a Google Drive import URL on the client side.
 * - Ensures the URL is well-formed and uses HTTPS
 * - Checks the hostname against an allowlist
 * - Rejects raw IP addresses and private/reserved ranges
 */
export function validateDriveUrl(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return 'Please enter a valid URL.'
  }

  if (parsed.protocol !== 'https:') {
    return 'Only HTTPS URLs are allowed.'
  }

  const hostname = parsed.hostname

  // Block raw IP addresses (e.g. https://127.0.0.1, https://10.0.0.1)
  const isDottedQuad = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
  if (isDottedQuad) {
    const octets = hostname.split('.').map(Number)
    const [a, b] = octets
    // Give a more specific message for private/reserved ranges
    if (
      a === 127 ||                // loopback
      a === 10 ||                 // 10.0.0.0/8
      (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
      (a === 192 && b === 168) || // 192.168.0.0/16
      (a === 169 && b === 254)    // 169.254.0.0/16 link-local
    ) {
      return 'Private network addresses are not allowed. Please use a valid Google Drive link.'
    }
    return 'IP addresses are not allowed. Please use a valid Google Drive link.'
  }

  if (!ALLOWED_DRIVE_HOSTNAMES.has(hostname)) {
    return 'Only Google Drive URLs are supported (drive.google.com, docs.google.com, drive.googleusercontent.com).'
  }

  return null // valid
}

export const workoutPlansApi = {
  list: (params?: { client_id?: string; status?: string; plan_type?: WorkoutPlanType }) =>
    api.get<PaginatedResponse<WorkoutPlan>>('/workout-plans', { params }).then(r => r.data),

  saved: (params?: { page?: number; limit?: number; offset?: number }) =>
    api.get<PaginatedResponse<WorkoutPlan>>('/workout-plans/saved', { params }).then(r => r.data),

  get: (id: string) =>
    api.get<ApiResponse<WorkoutPlan>>(`/workout-plans/${id}`).then(r => r.data.data),

  create: (data: Partial<WorkoutPlan>) =>
    api.post('/workout-plans', data).then(r => r.data),

  update: (id: string, data: Partial<WorkoutPlan>) =>
    api.put(`/workout-plans/${id}`, data).then(r => r.data),

  remove: (id: string) =>
    api.delete(`/workout-plans/${id}`).then(r => r.data),

  import: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    // Don't set Content-Type header - browser will set it with boundary automatically
    return api.post<ApiResponse<{ imported: number; plan_ids: string[]; warnings: string[] }>>(
      '/workout-plans/import',
      formData
    ).then(r => r.data)
  },

  importFromDrive: (url: string) => {
    const validationError = validateDriveUrl(url)
    if (validationError) {
      return Promise.reject(new Error(validationError))
    }
    return api.post<ApiResponse<{ imported: number; plan_ids: string[]; warnings: string[] }>>(
      '/workout-plans/import-drive',
      { url }
    ).then(r => r.data)
  },

  assign: (id: string, client_ids: string[]) =>
    api.post(`/workout-plans/${id}/assign`, { client_ids }).then(r => r.data),
}
