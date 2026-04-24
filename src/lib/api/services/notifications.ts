import api from '../client'
import type { Notification, PaginatedResponse, ApiResponse } from '@/types'

export const notificationsApi = {
  /**
   * List coach's notifications with pagination
   */
  list: (params?: { page?: number; type?: string; unread?: boolean }) =>
    api.get<PaginatedResponse<Notification>>('/notifications', { params }).then(r => r.data),

  /**
   * Get count of unread notifications for badge display
   */
  getUnreadCount: () =>
    api.get<ApiResponse<{ count: number }>>('/notifications/unread-count').then(r => r.data),

  /**
   * Mark a single notification as read
   */
  markRead: (id: string) =>
    api.post<ApiResponse<null>>(`/notifications/${id}/read`).then(r => r.data),

  /**
   * Mark all notifications as read
   */
  markAllRead: () =>
    api.post<ApiResponse<{ marked: number }>>('/notifications/read-all').then(r => r.data),

  /**
   * Delete a notification
   */
  remove: (id: string) =>
    api.delete<ApiResponse<null>>(`/notifications/${id}`).then(r => r.data),
}
