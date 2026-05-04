import api from '../client'
import type { CheckinMeeting, ApiResponse } from '@/types'

export const checkinsApi = {
  list: (clientId?: string) =>
    api.get<ApiResponse<CheckinMeeting[]>>('/checkins', { params: { client_id: clientId } }).then(r => r.data.data),

  create: (data: Partial<CheckinMeeting> & { client_id: string }) =>
    api.post('/checkins', data).then(r => r.data),

  update: (id: string, data: Partial<CheckinMeeting>) =>
    api.put(`/checkins/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/checkins/${id}`).then(r => r.data),
}
