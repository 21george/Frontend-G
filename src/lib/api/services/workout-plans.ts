import api from '../client'
import type { WorkoutPlan, WorkoutPlanType, PaginatedResponse, ApiResponse } from '@/types'

export const workoutPlansApi = {
  list: (params?: { client_id?: string; status?: string; plan_type?: WorkoutPlanType }) =>
    api.get<PaginatedResponse<WorkoutPlan>>('/workout-plans', { params }).then(r => r.data),

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

  assign: (id: string, client_ids: string[]) =>
    api.post(`/workout-plans/${id}/assign`, { client_ids }).then(r => r.data),
}
