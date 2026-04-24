import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api/services/notifications'
import type { Notification } from '@/types'

interface UseNotificationsOptions {
  page?: number
  type?: string
  unreadOnly?: boolean
  refetchInterval?: number
}

/**
 * Hook for fetching and managing notifications
 * Includes polling for real-time updates (default: 5 seconds)
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    page = 1,
    type,
    unreadOnly = false,
    refetchInterval = 5000,
  } = options

  const queryClient = useQueryClient()

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', { page, type, unreadOnly }],
    queryFn: () => notificationsApi.list({ page, type, unread: unreadOnly }),
    refetchInterval,
  })

  return {
    notifications: data?.data ?? [],
    pagination: data?.pagination,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook for getting unread notification count
 * Polls every 5 seconds for real-time badge updates
 */
export function useUnreadNotificationCount() {
  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 5000,
  })

  return {
    count: data?.data?.count ?? 0,
    isLoading,
  }
}

/**
 * Hook for marking a notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      // Invalidate notifications queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/**
 * Hook for marking all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })
}

/**
 * Hook for deleting a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })
}
