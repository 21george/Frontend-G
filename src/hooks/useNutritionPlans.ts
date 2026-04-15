import { useQuery } from '@tanstack/react-query'
import { nutritionPlansApi } from '@/lib/api'
import { useToastMutation } from './useToastMutation'
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

export const useCreateNutritionPlan = () =>
  useToastMutation({
    mutationFn: (data: Partial<NutritionPlan>) => nutritionPlansApi.create(data),
    successMessage: 'Nutrition plan created',
    errorMessage: 'Failed to create nutrition plan',
    invalidateKeys: [['nutrition-plans']],
  })

export const useUpdateNutritionPlan = (id: string) =>
  useToastMutation({
    mutationFn: (data: Partial<NutritionPlan>) => nutritionPlansApi.update(id, data),
    successMessage: 'Nutrition plan updated',
    errorMessage: 'Failed to update nutrition plan',
    invalidateKeys: [['nutrition-plans'], ['nutrition-plan', id]],
  })

export const useDeleteNutritionPlan = () =>
  useToastMutation({
    mutationFn: (id: string) => nutritionPlansApi.remove(id),
    successMessage: 'Nutrition plan deleted',
    errorMessage: 'Failed to delete nutrition plan',
    invalidateKeys: [['nutrition-plans']],
  })
