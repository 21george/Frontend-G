import { useQuery } from '@tanstack/react-query'
import { checkinsApi } from '@/lib/api'
import { useToastMutation } from './useToastMutation'
import type { CheckinMeeting } from '@/types'

export const useCheckins = (clientId?: string) =>
  useQuery({
    queryKey: ['checkins', clientId],
    queryFn: () => checkinsApi.list(clientId),
  })

export const useCreateCheckin = () =>
  useToastMutation({
    mutationFn: (data: Partial<CheckinMeeting> & { client_id: string }) => checkinsApi.create(data),
    successMessage: 'Check-in scheduled',
    errorMessage: 'Failed to schedule check-in',
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
    errorMessage: 'Failed to update check-in',
    invalidateKeys: [['checkins']],
  })

export const useDeleteCheckin = () =>
  useToastMutation({
    mutationFn: (id: string) => checkinsApi.delete(id),
    successMessage: 'Check-in cancelled',
    errorMessage: 'Failed to cancel check-in',
    invalidateKeys: [['checkins']],
  })
