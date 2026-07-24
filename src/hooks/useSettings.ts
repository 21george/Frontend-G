import { useQuery } from "@tanstack/react-query";
import { settingsApi, type NotificationSettings } from "@/lib/api";
import { useToastMutation } from "./useToastMutation";

// GET /coach/profile — refetched periodically (not just once at login) because
// the server re-signs `profile_photo` to a URL that expires after 24h. If we
// never refetch, the avatar silently breaks a day after login even though the
// underlying photo still exists. See settingsApi.getProfile for details.
export const useCoachProfile = (enabled: boolean) =>
  useQuery({
    queryKey: ["coach-profile"],
    queryFn: () => settingsApi.getProfile(),
    enabled,
    staleTime: 10 * 60_000, // 10 min — comfortably under the 24h URL expiry
    refetchOnWindowFocus: true,
  });

export const useIntegrations = () =>
  useQuery({
    queryKey: ["integrations"],
    queryFn: () => settingsApi.getIntegrations(),
    staleTime: 60_000,
  });

export const useUpdateIntegrations = () =>
  useToastMutation({
    mutationFn: (data: { webhook_url?: string; generate_api_key?: boolean }) =>
      settingsApi.updateIntegrations(data),
    successMessage: "Integration settings updated",
    errorMessage: "Failed to update integrations",
    invalidateKeys: [["integrations"]],
  });

export const useCreateSupportTicket = () =>
  useToastMutation({
    mutationFn: (data: { subject: string; message: string }) =>
      settingsApi.createSupportTicket(data),
    successMessage: "Support ticket submitted",
    errorMessage: "Failed to submit support ticket",
  });

export const useNotificationSettings = () =>
  useQuery({
    queryKey: ["notification-settings"],
    queryFn: () => settingsApi.getNotifications(),
    staleTime: 60_000,
  });

export const useUpdateNotificationSettings = () =>
  useToastMutation({
    mutationFn: (data: Partial<NotificationSettings>) =>
      settingsApi.updateNotifications(data),
    successMessage: "Notification settings updated",
    errorMessage: "Failed to update notifications",
    invalidateKeys: [["notification-settings"]],
  });
