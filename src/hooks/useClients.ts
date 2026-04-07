import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsApi } from '@/lib/api'
import type { Client } from '@/types'

export const useClients = (search?: string) =>
  useQuery({
    queryKey: ['clients', search],
    queryFn: () => clientsApi.list(search),
  })

export const useClient = (id: string) =>
  useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.get(id),
    enabled: !!id,
  })

export const useCreateClient = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Client>) => clientsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export const useUpdateClient = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Client>) => clientsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', id] })
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export const useDeleteClient = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => clientsApi.remove(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['client', id] })
    },
  })
}

export const useRegenerateCode = (id: string) =>
  useMutation({
    mutationFn: () => clientsApi.regenerateCode(id),
  })
