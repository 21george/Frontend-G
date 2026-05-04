import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { parseApiError } from '@/lib/api/errors'

interface ToastMutationOptions<TData, TVariables> extends Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> {
  mutationFn: (vars: TVariables) => Promise<TData>
  successMessage?: string
  errorMessage?: string
  invalidateKeys?: string[][]
  onSuccess?: (data: TData, vars: TVariables) => void
  onError?: (error: Error, vars: TVariables) => void
}

export function useToastMutation<TData = unknown, TVariables = void>({
  mutationFn,
  successMessage,
  errorMessage = 'Something went wrong',
  invalidateKeys = [],
  onSuccess,
  onError,
  ...rest
}: ToastMutationOptions<TData, TVariables>) {
  const qc = useQueryClient()

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: (data, vars) => {
      if (successMessage) toast.success(successMessage)
      invalidateKeys.forEach((key) => qc.invalidateQueries({ queryKey: key }))
      onSuccess?.(data, vars)
    },
    onError: (error, vars) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message || errorMessage)
      onError?.(error, vars)
    },
    ...rest,
  })
}
