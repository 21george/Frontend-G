import { useQuery } from "@tanstack/react-query";
import { staffApi } from "@/lib/api/services/staff";
import { useToastMutation } from "@/hooks/useToastMutation";
import type {
  InviteStaffPayload,
  UpdateStaffRolePayload,
  DeactivateStaffPayload,
} from "@/types";

const STAFF_KEY = ["org-staff"];

export const useStaffList = () =>
  useQuery({
    queryKey: STAFF_KEY,
    queryFn: () => staffApi.list(),
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
