import api from '../client'

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
    api.get('/integrations/settings').then(r => r.data.data),

  updateIntegrations: (data: { webhook_url?: string; generate_api_key?: boolean }) =>
    api.put('/integrations/settings', data).then(r => r.data),

  createSupportTicket: (data: { subject: string; message: string }) =>
    api.post('/support/contact', data).then(r => r.data),

  getNotifications: () =>
    api.get('/notification-settings').then(r => r.data.data as NotificationSettings),

  updateNotifications: (data: Partial<NotificationSettings>) =>
    api.put('/notification-settings', data).then(r => r.data),
}
