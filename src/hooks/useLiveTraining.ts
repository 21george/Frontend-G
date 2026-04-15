import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { liveTrainingApi } from '@/lib/api'
import { useToastMutation } from './useToastMutation'
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

export const useCreateLiveTraining = () =>
  useToastMutation({
    mutationFn: (data: Partial<LiveTrainingSession>) => liveTrainingApi.create(data),
    successMessage: 'Live training session created',
    errorMessage: 'Failed to create session',
    invalidateKeys: [['live-training']],
  })

export const useUpdateLiveTraining = (id: string) =>
  useToastMutation({
    mutationFn: (data: Partial<LiveTrainingSession>) => liveTrainingApi.update(id, data),
    successMessage: 'Session updated',
    errorMessage: 'Failed to update session',
    invalidateKeys: [['live-training'], ['live-training', id]],
  })

export const useDeleteLiveTraining = () =>
  useToastMutation({
    mutationFn: (id: string) => liveTrainingApi.remove(id),
    successMessage: 'Session deleted',
    errorMessage: 'Failed to delete session',
    invalidateKeys: [['live-training']],
  })

export const useGoLive = () =>
  useToastMutation({
    mutationFn: (id: string) => liveTrainingApi.goLive(id),
    successMessage: 'You are now live!',
    errorMessage: 'Failed to go live',
    invalidateKeys: [['live-training']],
  })

export const useEndSession = () =>
  useToastMutation({
    mutationFn: (id: string) => liveTrainingApi.endSession(id),
    successMessage: 'Session ended',
    errorMessage: 'Failed to end session',
    invalidateKeys: [['live-training']],
  })

export const useLiveTrainingRequests = (sessionId: string) =>
  useQuery({
    queryKey: ['live-training-requests', sessionId],
    queryFn: () => liveTrainingApi.listRequests(sessionId),
    enabled: !!sessionId,
  })

export const useHandleJoinRequest = (sessionId: string) =>
  useToastMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: 'approved' | 'rejected' }) =>
      liveTrainingApi.handleRequest(sessionId, requestId, action),
    successMessage: 'Request handled',
    errorMessage: 'Failed to handle request',
    invalidateKeys: [['live-training-requests', sessionId], ['live-training']],
  })

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
