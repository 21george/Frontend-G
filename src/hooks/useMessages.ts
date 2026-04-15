import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesApi } from '@/lib/api'
import toast from 'react-hot-toast'

export const useMessages = (clientId: string) =>
  useQuery({
    queryKey: ['messages', clientId],
    queryFn: () => messagesApi.list(clientId),
    refetchInterval: 5000,
    enabled: !!clientId,
  })

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
