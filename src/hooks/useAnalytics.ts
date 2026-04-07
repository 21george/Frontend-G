import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api'

export const useClientAnalytics = (id: string) =>
  useQuery({
    queryKey: ['analytics', id],
    queryFn: () => analyticsApi.client(id),
    enabled: !!id,
  })
