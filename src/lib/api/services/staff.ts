import api from "@/lib/api/client";
import type {
  ApiResponse,
  StaffMember,
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
  list: () =>
    api.get<ApiResponse<StaffMember[]>>("/org/staff").then((r) => r.data.data),

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

  acceptInvite: (payload: { token: string; name: string; password: string }) =>
    api
      .post<ApiResponse<{ id: string }>>("/org/staff/accept-invite", payload)
      .then((r) => r.data),
};
