import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nutritionPlansApi } from '@/lib/api'
import type { NutritionPlan } from '@/types'

export const useNutritionPlans = (clientId?: string) =>
  useQuery({
    queryKey: ['nutrition-plans', clientId],
    queryFn: () => nutritionPlansApi.list(clientId),
  })

export const useNutritionPlan = (id: string) =>
  useQuery({
    queryKey: ['nutrition-plan', id],
    queryFn: () => nutritionPlansApi.get(id),
    enabled: !!id,
  })

export const useCreateNutritionPlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<NutritionPlan>) => nutritionPlansApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nutrition-plans'] }),
  })
}

export const useUpdateNutritionPlan = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<NutritionPlan>) => nutritionPlansApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nutrition-plans'] })
      qc.invalidateQueries({ queryKey: ['nutrition-plan', id] })
    },
  })
}

export const useDeleteNutritionPlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => nutritionPlansApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nutrition-plans'] }),
  })
}
