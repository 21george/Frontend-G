import { useQuery } from '@tanstack/react-query'
import { checkinsApi } from '@/lib/api'
import { useToastMutation } from './useToastMutation'
import type { CheckinMeeting } from '@/types'

export const useCheckins = (clientId?: string) =>
  useQuery({
    queryKey: ['checkins', clientId],
    queryFn: () => checkinsApi.list(clientId),
    staleTime: 60_000,
    retry: (failureCount, error: unknown) => {
      const e = error as { response?: { status?: number } } | undefined
      if (e?.response?.status === 401 || e?.response?.status === 403) return false
      return failureCount < 3
    },
  })

export const useCreateCheckin = () =>
  useToastMutation({
    mutationFn: (data: Partial<CheckinMeeting> & { client_id: string }) => checkinsApi.create(data),
    successMessage: 'Check-in scheduled',
    errorMessage: 'Failed to schedule check-in. Please try again.',
    invalidateKeys: [['checkins']],
  })

export const useUpdateCheckin = (id?: string) =>
  useToastMutation({
    mutationFn: ({ id: payloadId, ...data }: Partial<CheckinMeeting> & { id?: string }) => {
      const targetId = id || payloadId
      if (!targetId) {
        return Promise.reject(new Error('Check-in id is required'))
      }
      return checkinsApi.update(targetId, data)
    },
    successMessage: 'Check-in updated',
    errorMessage: 'Failed to update check-in. Please try again.',
    invalidateKeys: [['checkins']],
  })

export const useDeleteCheckin = () =>
  useToastMutation({
    mutationFn: (id: string) => checkinsApi.delete(id),
    successMessage: 'Check-in cancelled',
    errorMessage: 'Failed to cancel check-in. Please try again.',
    invalidateKeys: [['checkins']],
  })
