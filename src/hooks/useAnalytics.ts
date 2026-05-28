import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api'

export const useClientAnalytics = (id: string) =>
  useQuery({
    queryKey: ['analytics', id],
    queryFn: () => analyticsApi.client(id),
    enabled: !!id,
  })

export const useCoachAnalytics = () =>
  useQuery({
    queryKey: ['analytics', 'coach'],
    queryFn: () => analyticsApi.coach(),
    staleTime: 2 * 60_000,
  })
