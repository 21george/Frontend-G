import { useQuery } from '@tanstack/react-query'
import { mediaApi } from '@/lib/api'

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
