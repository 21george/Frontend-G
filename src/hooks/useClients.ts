import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsApi } from '@/lib/api'
import { useToastMutation } from './useToastMutation'
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

export const useCreateClient = () =>
  useToastMutation({
    mutationFn: (data: Partial<Client>) => clientsApi.create(data),
    successMessage: 'Client created successfully',
    errorMessage: 'Failed to create client',
    invalidateKeys: [['clients']],
  })

export const useUpdateClient = (id: string) =>
  useToastMutation({
    mutationFn: (data: Partial<Client>) => clientsApi.update(id, data),
    successMessage: 'Client updated successfully',
    errorMessage: 'Failed to update client',
    invalidateKeys: [['client', id], ['clients']],
  })

export const useDeleteClient = () =>
  useToastMutation({
    mutationFn: (id: string) => clientsApi.remove(id),
    successMessage: 'Client permanently deleted',
    errorMessage: 'Failed to delete client',
    invalidateKeys: [['clients']],
  })

export const useRegenerateCode = (id: string) =>
  useToastMutation({
    mutationFn: () => clientsApi.regenerateCode(id),
    successMessage: 'Login code regenerated',
    errorMessage: 'Failed to regenerate code',
  })

export const useBlockClient = (id: string) =>
  useToastMutation({
    mutationFn: () => clientsApi.block(id),
    successMessage: 'Client blocked — all sessions invalidated',
    errorMessage: 'Failed to block client',
    invalidateKeys: [['client', id], ['clients']],
  })

export const useUnblockClient = (id: string) =>
  useToastMutation({
    mutationFn: () => clientsApi.unblock(id),
    successMessage: 'Client unblocked — access restored',
    errorMessage: 'Failed to unblock client',
    invalidateKeys: [['client', id], ['clients']],
  })
