import { useQuery } from '@tanstack/react-query'
import { subscriptionApi } from '@/lib/api'

export const useInvoices = () =>
  useQuery({
    queryKey: ['invoices'],
    queryFn: () => subscriptionApi.invoices(),
    staleTime: 5 * 60_000,
  })
