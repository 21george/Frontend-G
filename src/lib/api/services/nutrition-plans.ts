import api from '../client'
import type { NutritionPlan, ApiResponse } from '@/types'

export const nutritionPlansApi = {
  list: (clientId?: string) =>
    api.get<ApiResponse<NutritionPlan[]>>('/nutrition-plans', { params: { client_id: clientId } }).then(r => r.data.data),

  get: (id: string) =>
    api.get<ApiResponse<NutritionPlan>>(`/nutrition-plans/${id}`).then(r => r.data.data),

  create: (data: Partial<NutritionPlan>) =>
    api.post('/nutrition-plans', data).then(r => r.data),

  update: (id: string, data: Partial<NutritionPlan>) =>
    api.put(`/nutrition-plans/${id}`, data).then(r => r.data),

  remove: (id: string) =>
    api.delete(`/nutrition-plans/${id}`).then(r => r.data),
}
