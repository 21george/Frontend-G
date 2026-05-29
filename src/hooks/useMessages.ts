import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesApi } from '@/lib/api/services/messages'
import { shouldRetryRequest } from '@/lib/api/errors'
import { useAuthStore } from '@/store/auth'
import toast from 'react-hot-toast'

export const useMessages = (clientId: string) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['messages', clientId],
    queryFn: () => messagesApi.list(clientId),
    enabled: isAuthenticated && !!clientId,
    refetchInterval: isAuthenticated ? 5000 : false,
    retry: shouldRetryRequest,
  })
}

export const useUnreadMessages = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['messages', 'unread'],
    queryFn: () => messagesApi.getUnreadMessages(),
    enabled: isAuthenticated,
    refetchInterval: isAuthenticated ? 5000 : false,
    retry: shouldRetryRequest,
  })
}

export const useUnreadMessageCount = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: () => messagesApi.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: isAuthenticated ? 5000 : false,
    retry: shouldRetryRequest,
  })
}

export const useMarkAllMessagesRead = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => messagesApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', 'unread-count'] })
      qc.invalidateQueries({ queryKey: ['messages'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to mark messages as read')
    },
  })
}

export const useSendMessage = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { client_id: string; content: string; media_url?: string; media_type?: string; media_filename?: string }) =>
      messagesApi.send(data),
    onMutate: async (variables) => {
      const queryKey = ['messages', variables.client_id]
      await qc.cancelQueries({ queryKey })
      const previous = qc.getQueryData<{ data: any[] }>(queryKey)
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        content: variables.content,
        sender_role: 'coach',
        read: true,
        sent_at: new Date().toISOString(),
        media_url: variables.media_url ?? null,
        media_type: variables.media_type ?? null,
        media_filename: variables.media_filename ?? null,
      }
      if (previous) {
        qc.setQueryData(queryKey, {
          ...previous,
          data: [...previous.data, optimistic],
        })
      }
      return { previous, queryKey }
    },
    onError: (error: any, _variables, context: any) => {
      if (context?.previous && context?.queryKey) {
        qc.setQueryData(context.queryKey, context.previous)
      }
      toast.error(error?.response?.data?.message || 'Failed to send message')
    },
    onSettled: (_data, _error, variables) => {
      qc.invalidateQueries({ queryKey: ['messages', variables.client_id] })
      qc.invalidateQueries({ queryKey: ['messages', 'unread-count'] })
    },
  })
}

export const useUploadMessageMedia = () =>
  useMutation({
    mutationFn: (file: File) => messagesApi.uploadMedia(file),
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to upload media')
    },
  })
