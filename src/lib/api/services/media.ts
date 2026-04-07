import api from '../client'
import type { MediaUpload, WorkoutLogDetailed, ApiResponse, PaginatedResponse } from '@/types'

export const mediaApi = {
  clientMedia: (clientId: string) =>
    api.get<ApiResponse<MediaUpload[]>>(`/coach/media/${clientId}`).then(r => r.data.data),

  clientLogs: (clientId: string) =>
    api.get<PaginatedResponse<WorkoutLogDetailed>>(`/coach/clients/${clientId}/logs`).then(r => r.data.data),
}
