import api from '../client'
import type { ApiResponse } from '@/types'

export interface NotificationSettings {
  email_sms: boolean
  appointments: boolean
  consultation: boolean
  test_result: boolean
  login_alerts: boolean
  dnd_enabled: boolean
  dnd_from: string
  dnd_to: string
}

export const settingsApi = {
  getIntegrations: () =>
    api.get<ApiResponse<{ webhook_url?: string; api_key?: string }>>('/integrations/settings').then(r => r.data.data),

  updateIntegrations: (data: { webhook_url?: string; generate_api_key?: boolean }) =>
    api.put<ApiResponse<null>>('/integrations/settings', data).then(r => r.data),

  createSupportTicket: (data: { subject: string; message: string }) =>
    api.post<ApiResponse<null>>('/support/contact', data).then(r => r.data),

  getNotifications: () =>
    api.get<ApiResponse<NotificationSettings>>('/notification-settings').then(r => r.data.data),

  updateNotifications: (data: Partial<NotificationSettings>) =>
    api.put<ApiResponse<null>>('/notification-settings', data).then(r => r.data),

  deleteAccount: () =>
    api.delete<ApiResponse<null>>('/coach/profile').then(r => r.data),
}
