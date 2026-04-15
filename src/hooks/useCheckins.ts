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

export const useUpdateCheckin = (id: string) =>
  useToastMutation({
    mutationFn: (data: Partial<CheckinMeeting>) => checkinsApi.update(id, data),
    successMessage: 'Check-in updated',
    errorMessage: 'Failed to update check-in',
    invalidateKeys: [['checkins']],
  })
