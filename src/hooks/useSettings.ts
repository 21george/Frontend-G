import { useQuery } from '@tanstack/react-query'
import { settingsApi, type NotificationSettings } from '@/lib/api'
import { useToastMutation } from './useToastMutation'

export const useIntegrations = () =>
  useQuery({
    queryKey: ['integrations'],
    queryFn: () => settingsApi.getIntegrations(),
    staleTime: 60_000,
  })

export const useUpdateIntegrations = () =>
  useToastMutation({
    mutationFn: (data: { webhook_url?: string; generate_api_key?: boolean }) =>
      settingsApi.updateIntegrations(data),
    successMessage: 'Integration settings updated',
    errorMessage: 'Failed to update integrations',
    invalidateKeys: [['integrations']],
  })

export const useCreateSupportTicket = () =>
  useToastMutation({
    mutationFn: (data: { subject: string; message: string }) =>
      settingsApi.createSupportTicket(data),
    successMessage: 'Support ticket submitted',
    errorMessage: 'Failed to submit support ticket',
  })

export const useNotificationSettings = () =>
  useQuery({
    queryKey: ['notification-settings'],
    queryFn: () => settingsApi.getNotifications(),
    staleTime: 60_000,
  })

export const useUpdateNotificationSettings = () =>
  useToastMutation({
    mutationFn: (data: Partial<NotificationSettings>) =>
      settingsApi.updateNotifications(data),
    successMessage: 'Notification settings updated',
    errorMessage: 'Failed to update notifications',
    invalidateKeys: [['notification-settings']],
  })
