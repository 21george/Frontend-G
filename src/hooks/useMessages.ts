import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesApi } from '@/lib/api'
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

export const useSendMessage = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { client_id: string; content: string; media_url?: string; media_type?: string; media_filename?: string }) =>
      messagesApi.send(data),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['messages', v.client_id] }),
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to send message')
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
