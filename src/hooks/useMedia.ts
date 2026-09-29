import { useQuery, useQueries } from '@tanstack/react-query'
import { mediaApi } from '@/lib/api'
import { useToastMutation } from './useToastMutation'
import type { LiveProgressResponse } from '@/types'

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

export const useLiveProgress = (clientId: string) =>
  useQuery({
    queryKey: ['live-progress', clientId],
    queryFn: () => mediaApi.clientLiveProgress(clientId),
    enabled: !!clientId,
    refetchInterval: 5_000,
    staleTime: 5_000,
  })

export const useLiveProgresses = (clientIds: string[]) =>
  useQueries({
    queries: clientIds.map((id) => ({
      queryKey: ['live-progress', id] as const,
      queryFn: () => mediaApi.clientLiveProgress(id),
      enabled: !!id,
      staleTime: 30_000,
    })),
  })

export const useStoreMeasurement = (clientId: string) =>
  useToastMutation({
    mutationFn: (payload: Parameters<typeof mediaApi.storeMeasurement>[1]) =>
      mediaApi.storeMeasurement(clientId, payload),
    successMessage: 'Measurements recorded',
    errorMessage: 'Failed to record measurements',
    invalidateKeys: [['analytics', clientId], ['client', clientId]],
  })
