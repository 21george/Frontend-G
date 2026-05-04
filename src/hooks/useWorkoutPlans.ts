import { useQuery } from '@tanstack/react-query'
import { workoutPlansApi } from '@/lib/api'
import { useToastMutation } from './useToastMutation'
import type { WorkoutPlan, WorkoutPlanType } from '@/types'

export const useWorkoutPlans = (clientId?: string, status?: string, planType?: WorkoutPlanType) =>
  useQuery({
    queryKey: ['workout-plans', clientId, status, planType],
    queryFn: () => workoutPlansApi.list({ client_id: clientId, status, plan_type: planType }),
  })

export const useSavedWorkoutPlans = (params?: { page?: number; limit?: number; offset?: number }) =>
  useQuery({
    queryKey: ['workout-plans', 'saved', params],
    queryFn: () => workoutPlansApi.saved(params),
  })

export const useWorkoutPlan = (id: string) =>
  useQuery({
    queryKey: ['workout-plan', id],
    queryFn: () => workoutPlansApi.get(id),
    enabled: !!id,
  })

export const useCreateWorkoutPlan = () =>
  useToastMutation({
    mutationFn: (data: Partial<WorkoutPlan>) => workoutPlansApi.create(data),
    successMessage: 'Workout plan created',
    errorMessage: 'Failed to create workout plan',
    invalidateKeys: [['workout-plans']],
  })

export const useCreateGroupWorkoutPlan = () =>
  useToastMutation({
    mutationFn: (data: Omit<Partial<WorkoutPlan>, 'plan_type'> & { plan_type: 'group' | 'team'; client_ids?: string[]; group_name?: string }) =>
      workoutPlansApi.create(data as Partial<WorkoutPlan>),
    successMessage: 'Group workout plan created',
    errorMessage: 'Failed to create group plan',
    invalidateKeys: [['workout-plans']],
  })

export const useUpdateWorkoutPlan = (id: string) =>
  useToastMutation({
    mutationFn: (data: Partial<WorkoutPlan>) => workoutPlansApi.update(id, data),
    successMessage: 'Workout plan updated',
    errorMessage: 'Failed to update workout plan',
    invalidateKeys: [['workout-plan', id], ['workout-plans']],
  })

export const useDeleteWorkoutPlan = () =>
  useToastMutation({
    mutationFn: (id: string) => workoutPlansApi.remove(id),
    successMessage: 'Workout plan deleted',
    errorMessage: 'Failed to delete workout plan',
    invalidateKeys: [['workout-plans']],
  })

export const useImportWorkoutPlans = () =>
  useToastMutation({
    mutationFn: (file: File) => workoutPlansApi.import(file),
    successMessage: 'Plans imported successfully',
    errorMessage: 'Failed to import plans',
    invalidateKeys: [['workout-plans']],
  })

export const useAssignWorkoutPlan = (id: string) =>
  useToastMutation({
    mutationFn: (client_ids: string[]) => workoutPlansApi.assign(id, client_ids),
    successMessage: 'Workout plan assigned successfully',
    errorMessage: 'Failed to assign workout plan',
    invalidateKeys: [['workout-plans'], ['workout-plan', id]],
  })
