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
}
