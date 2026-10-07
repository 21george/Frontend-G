import api from "@/lib/api/client";
import type {
  ApiResponse,
  PaginatedResponse,
  StaffMember,
  StaffActivity,
  InviteStaffPayload,
  UpdateStaffRolePayload,
  DeactivateStaffPayload,
} from "@/types";

/**
 * Staff / RBAC API service (Feature 6). Every endpoint is org-scoped and
 * accepts either the org owner's coach session or an active staff session —
 * the backend's StaffMiddleware resolves org_id + role automatically.
 */
export const staffApi = {
  list: (page = 1, perPage = 20) =>
    api
      .get<PaginatedResponse<StaffMember>>("/org/staff", { params: { page, per_page: perPage } })
      .then((r) => r.data),

  get: (id: string) =>
    api.get<ApiResponse<StaffMember>>(`/org/staff/${id}`).then((r) => r.data.data),

  invite: (payload: InviteStaffPayload) =>
    api
      .post<ApiResponse<{ id: string }>>("/org/staff/invite", payload)
      .then((r) => r.data),

  updateRole: ({ id, role }: UpdateStaffRolePayload) =>
    api
      .patch<ApiResponse<null>>(`/org/staff/${id}/role`, { role })
      .then((r) => r.data),

  deactivate: ({ id, reassign_to }: DeactivateStaffPayload) =>
    api
      .post<ApiResponse<null>>(`/org/staff/${id}/deactivate`, {
        reassign_to,
      })
      .then((r) => r.data),

  assignClient: (clientId: string, primaryStaffId: string | "owner" | null) =>
    api
      .patch<ApiResponse<null>>(`/org/clients/${clientId}/assignment`, {
        primary_staff_id: primaryStaffId,
      })
      .then((r) => r.data),

  takeOn: (clientId: string) =>
    api
      .post<ApiResponse<null>>(`/org/clients/${clientId}/take-on`)
      .then((r) => r.data),

  acceptInvite: (payload: { token: string; name: string; password: string }) =>
    api
      .post<
        ApiResponse<{
          id: string;
          access_token: string;
          refresh_token: string;
          staff: StaffMember;
        }>
      >("/org/staff/accept-invite", payload)
      .then((r) => r.data),

  activities: (page = 1) =>
    api
      .get<ApiResponse<{ data: StaffActivity[]; pagination: { total: number; page: number; per_page: number } }>>("/org/staff/activities", { params: { page } })
      .then((r) => r.data.data),

  getProfile: () =>
    api
      .get<ApiResponse<StaffMember>>("/staff/profile")
      .then((r) => r.data.data),

  updateProfile: (payload: {
    name: string;
    date_of_birth?: string;
    nationality?: string;
    years_of_profession?: number;
    bio?: string;
  }) =>
    api
      .put<ApiResponse<StaffMember>>("/staff/profile", payload)
      .then((r) => r.data),

  update: (id: string, payload: { name: string; role?: string }) =>
    api
      .put<ApiResponse<StaffMember>>(`/org/staff/${id}`, payload)
      .then((r) => r.data),
};
