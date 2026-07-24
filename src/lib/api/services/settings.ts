import api from "../client";
import type { ApiResponse, Coach } from "@/types";

export interface NotificationSettings {
  email_sms: boolean;
  appointments: boolean;
  consultation: boolean;
  test_result: boolean;
  login_alerts: boolean;
  dnd_enabled: boolean;
  dnd_from: string;
  dnd_to: string;
}

export const settingsApi = {
  // GET /coach/profile — re-resolves profile_photo to a fresh presigned URL
  // server-side (see CoachController::resolveProfilePhoto). Must be re-fetched
  // periodically, since the URL itself expires after 24h — it is NOT safe to
  // rely on the value captured once at login.
  getProfile: () =>
    api.get<ApiResponse<Coach>>("/coach/profile").then((r) => r.data.data),

  getIntegrations: () =>
    api
      .get<
        ApiResponse<{ webhook_url?: string; api_key?: string }>
      >("/integrations/settings")
      .then((r) => r.data.data),

  updateIntegrations: (data: {
    webhook_url?: string;
    generate_api_key?: boolean;
  }) =>
    api
      .put<ApiResponse<null>>("/integrations/settings", data)
      .then((r) => r.data),

  createSupportTicket: (data: { subject: string; message: string }) =>
    api.post<ApiResponse<null>>("/support/contact", data).then((r) => r.data),

  getNotifications: () =>
    api
      .get<ApiResponse<NotificationSettings>>("/notification-settings")
      .then((r) => r.data.data),

  updateNotifications: (data: Partial<NotificationSettings>) =>
    api
      .put<ApiResponse<null>>("/notification-settings", data)
      .then((r) => r.data),

  deleteAccount: () =>
    api.delete<ApiResponse<null>>("/coach/profile").then((r) => r.data),
};
