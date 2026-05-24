import api from '../client'
import type { Client, PaginatedResponse, ApiResponse } from '@/types'

export const clientsApi = {
  list: (search?: string) =>
    api.get<PaginatedResponse<Client>>('/coach/clients', { params: { search } }).then(r => r.data),

  get: (id: string) =>
    api.get<ApiResponse<Client>>(`/coach/clients/${id}`).then(r => r.data.data),

  create: (data: Partial<Client>) =>
    api.post<ApiResponse<{ id: string; login_code: string; email_sent: boolean }>>('/coach/clients', data).then(r => r.data),

  update: (id: string, data: Partial<Client>) =>
    api.put(`/coach/clients/${id}`, data).then(r => r.data),

  remove: (id: string) =>
    api.delete(`/coach/clients/${id}`).then(r => r.data),

  regenerateCode: (id: string) =>
    api.post<ApiResponse<{ login_code: string }>>(`/coach/clients/${id}/regenerate-code`).then(r => r.data),

  block: (id: string) =>
    api.post<ApiResponse<Client>>(`/coach/clients/${id}/block`).then(r => r.data.data),

  unblock: (id: string) =>
    api.post<ApiResponse<Client>>(`/coach/clients/${id}/unblock`).then(r => r.data.data),

  /** Check if a client already exists by email or phone (returns true if found). */
  checkExists: async (params: { email?: string; phone?: string }): Promise<{ email: boolean; phone: boolean }> => {
    const results = { email: false, phone: false }
    const checks: Promise<void>[] = []
    if (params.email) {
      checks.push(
        api.get<PaginatedResponse<Client>>('/coach/clients', { params: { search: params.email } })
          .then(r => {
            results.email = (r.data.data ?? []).some(
              (c: Client) => c.email?.toLowerCase() === params.email!.toLowerCase()
            )
          })
          .catch(() => {})
      )
    }
    if (params.phone) {
      checks.push(
        api.get<PaginatedResponse<Client>>('/coach/clients', { params: { search: params.phone } })
          .then(r => {
            results.phone = (r.data.data ?? []).some(
              (c: Client) => c.phone === params.phone
            )
          })
          .catch(() => {})
      )
    }
    await Promise.all(checks)
    return results
  },
}
