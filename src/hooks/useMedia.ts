import { useQuery } from '@tanstack/react-query'
import { mediaApi } from '@/lib/api'
import { useToastMutation } from './useToastMutation'

export const useClientMedia = (clientId: string) =>
  useQuery({
    queryKey: ['media', clientId],
    queryFn: () => mediaApi.clientMedia(clientId),
    enabled: !!clientId,
  })

export const useWorkoutLogs = (clientId: string) =>
  useQuery({
    queryKey: ['workout-logs', clientId],
    queryFn: () => mediaApi.clientLogs(clientId),
    enabled: !!clientId,
  })

export const useWorkoutProgress = (clientId: string) =>
  useQuery({
    queryKey: ['workout-progress', clientId],
    queryFn: () => mediaApi.clientWorkoutProgress(clientId),
    enabled: !!clientId,
  })

export const useStoreMeasurement = (clientId: string) =>
  useToastMutation({
    mutationFn: (payload: Parameters<typeof mediaApi.storeMeasurement>[1]) =>
      mediaApi.storeMeasurement(clientId, payload),
    successMessage: 'Measurements recorded',
    errorMessage: 'Failed to record measurements',
    invalidateKeys: [['analytics', clientId], ['client', clientId]],
  })
