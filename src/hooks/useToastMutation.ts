import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import toast from 'react-hot-toast'

interface ToastMutationOptions<TData, TVariables> extends Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> {
  mutationFn: (vars: TVariables) => Promise<TData>
  successMessage?: string
  errorMessage?: string
  invalidateKeys?: string[][]
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
    onSuccess: (data, vars, ctx) => {
      if (successMessage) toast.success(successMessage)
      invalidateKeys.forEach((key) => qc.invalidateQueries({ queryKey: key }))
      onSuccess?.(data, vars, ctx)
    },
    onError: (error, vars, ctx) => {
      const msg = (error as any)?.response?.data?.message || error.message || errorMessage
      toast.error(msg)
      onError?.(error, vars, ctx)
    },
    ...rest,
  })
}
