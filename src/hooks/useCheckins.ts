import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { checkinsApi } from '@/lib/api'
import type { CheckinMeeting } from '@/types'

export const useCheckins = (clientId?: string) =>
  useQuery({
    queryKey: ['checkins', clientId],
    queryFn: () => checkinsApi.list(clientId),
  })

export const useCreateCheckin = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CheckinMeeting> & { client_id: string }) => checkinsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checkins'] }),
  })
}

export const useUpdateCheckin = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CheckinMeeting>) => checkinsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checkins'] }),
  })
}
