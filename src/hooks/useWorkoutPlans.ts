import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workoutPlansApi } from '@/lib/api'
import type { WorkoutPlan, WorkoutPlanType } from '@/types'

export const useWorkoutPlans = (clientId?: string, status?: string, planType?: WorkoutPlanType) =>
  useQuery({
    queryKey: ['workout-plans', clientId, status, planType],
    queryFn: () => workoutPlansApi.list({ client_id: clientId, status, plan_type: planType }),
  })

export const useWorkoutPlan = (id: string) =>
  useQuery({
    queryKey: ['workout-plan', id],
    queryFn: () => workoutPlansApi.get(id),
    enabled: !!id,
  })

export const useCreateWorkoutPlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<WorkoutPlan>) => workoutPlansApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-plans'] }),
  })
}

export const useCreateGroupWorkoutPlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Partial<WorkoutPlan>, 'plan_type'> & { plan_type: 'group' | 'team'; client_ids?: string[]; group_name?: string }) =>
      workoutPlansApi.create(data as Partial<WorkoutPlan>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-plans'] }),
  })
}

export const useUpdateWorkoutPlan = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<WorkoutPlan>) => workoutPlansApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workout-plan', id] })
      qc.invalidateQueries({ queryKey: ['workout-plans'] })
    },
  })
}

export const useDeleteWorkoutPlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => workoutPlansApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-plans'] }),
  })
}
