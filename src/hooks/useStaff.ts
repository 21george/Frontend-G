import { useQuery } from "@tanstack/react-query";
import { staffApi } from "@/lib/api/services/staff";
import { useToastMutation } from "@/hooks/useToastMutation";
import type {
  InviteStaffPayload,
  UpdateStaffRolePayload,
  DeactivateStaffPayload,
} from "@/types";

const STAFF_KEY = ["org-staff"];
const ACTIVITIES_KEY = ["org-staff-activities"];

export const useStaffList = (page = 1, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: [...STAFF_KEY, page],
    queryFn: () => staffApi.list(page),
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });

export const useStaffMember = (id: string) =>
  useQuery({
    queryKey: [...STAFF_KEY, id],
    queryFn: () => staffApi.get(id),
    staleTime: 30_000,
    enabled: !!id,
  });

export const useStaffActivities = (page = 1) =>
  useQuery({
    queryKey: [...ACTIVITIES_KEY, page],
    queryFn: () => staffApi.activities(page),
    staleTime: 30_000,
  });

export const useInviteStaff = () =>
  useToastMutation({
    mutationFn: (payload: InviteStaffPayload) => staffApi.invite(payload),
    successMessage: "Invite sent",
    errorMessage: "Failed to send invite",
    invalidateKeys: [STAFF_KEY],
  });

export const useUpdateStaffRole = () =>
  useToastMutation({
    mutationFn: (payload: UpdateStaffRolePayload) =>
      staffApi.updateRole(payload),
    successMessage: "Role updated",
    errorMessage: "Failed to update role",
    invalidateKeys: [STAFF_KEY],
  });

export const useDeactivateStaff = () =>
  useToastMutation({
    mutationFn: (payload: DeactivateStaffPayload) =>
      staffApi.deactivate(payload),
    successMessage: "Staff member deactivated",
    errorMessage: "Failed to deactivate staff member",
    invalidateKeys: [STAFF_KEY],
  });

export const useTakeOnClient = () =>
  useToastMutation({
    mutationFn: (clientId: string) => staffApi.takeOn(clientId),
    successMessage: "Client taken on",
    errorMessage: "Failed to take on client",
    invalidateKeys: [["clients"], ACTIVITIES_KEY],
  });

export const useUpdateStaff = () =>
  useToastMutation({
    mutationFn: (payload: { id: string; name: string; role?: string }) =>
      staffApi.update(payload.id, { name: payload.name, role: payload.role }),
    successMessage: "Staff updated",
    errorMessage: "Failed to update staff",
    invalidateKeys: [STAFF_KEY],
  });

// GET /staff/profile — refetched periodically (not just once at login) because
// the server re-signs `profile_photo` to a URL that expires after 24h. If we
// never refetch, the avatar silently breaks a day after login even though the
// underlying photo still exists. See staffApi.getProfile for details.
export const useStaffProfile = (enabled: boolean) =>
  useQuery({
    queryKey: ["staff-profile"],
    queryFn: () => staffApi.getProfile(),
    enabled,
    staleTime: 10 * 60_000, // 10 min — comfortably under the 24h URL expiry
    refetchOnWindowFocus: true,
  });
