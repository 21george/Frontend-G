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
}
