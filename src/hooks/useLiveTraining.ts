import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { liveTrainingApi } from '@/lib/api'
import type { LiveTrainingSession } from '@/types'

export const useLiveTrainingSessions = (status?: string, category?: string) =>
  useQuery({
    queryKey: ['live-training', status, category],
    queryFn: () => liveTrainingApi.list(status, category),
  })

export const useLiveTrainingSession = (id: string) =>
  useQuery({
    queryKey: ['live-training', id],
    queryFn: () => liveTrainingApi.get(id),
    enabled: !!id,
  })

export const useCreateLiveTraining = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<LiveTrainingSession>) => liveTrainingApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['live-training'] }),
  })
}

export const useUpdateLiveTraining = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<LiveTrainingSession>) => liveTrainingApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['live-training'] })
      qc.invalidateQueries({ queryKey: ['live-training', id] })
    },
  })
}

export const useDeleteLiveTraining = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => liveTrainingApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['live-training'] }),
  })
}

export const useGoLive = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => liveTrainingApi.goLive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['live-training'] }),
  })
}

export const useEndSession = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => liveTrainingApi.endSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['live-training'] }),
  })
}

export const useLiveTrainingRequests = (sessionId: string) =>
  useQuery({
    queryKey: ['live-training-requests', sessionId],
    queryFn: () => liveTrainingApi.listRequests(sessionId),
    enabled: !!sessionId,
  })

export const useHandleJoinRequest = (sessionId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: 'approved' | 'rejected' }) =>
      liveTrainingApi.handleRequest(sessionId, requestId, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['live-training-requests', sessionId] })
      qc.invalidateQueries({ queryKey: ['live-training'] })
    },
  })
}

export const useLiveTrainingParticipants = (sessionId: string) =>
  useQuery({
    queryKey: ['live-training-participants', sessionId],
    queryFn: () => liveTrainingApi.participants(sessionId),
    enabled: !!sessionId,
  })

export const useLiveTrainingChat = (sessionId: string, enabled = true) =>
  useQuery({
    queryKey: ['live-training-chat', sessionId],
    queryFn: () => liveTrainingApi.getChat(sessionId),
    enabled: !!sessionId && enabled,
    refetchInterval: enabled ? 3000 : false,
  })

export const useSendLiveTrainingChat = (sessionId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => liveTrainingApi.sendChat(sessionId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['live-training-chat', sessionId] }),
  })
}
