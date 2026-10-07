import { useQuery } from "@tanstack/react-query";
import { teamMeetingsApi } from "@/lib/api";
import { useToastMutation } from "./useToastMutation";
import type { CreateTeamMeetingPayload, UpdateTeamMeetingPayload } from "@/lib/api/services/team-meetings";

export const useTeamMeetings = (params?: { status?: string; from?: string; to?: string }) =>
  useQuery({
    queryKey: ["team-meetings", params],
    queryFn: () => teamMeetingsApi.list(params),
    staleTime: 60_000,
  });

export const useTeamMeeting = (id: string) =>
  useQuery({
    queryKey: ["team-meetings", id],
    queryFn: () => teamMeetingsApi.get(id),
    staleTime: 60_000,
    enabled: !!id,
  });

export const useCreateTeamMeeting = () =>
  useToastMutation({
    mutationFn: (data: CreateTeamMeetingPayload) => teamMeetingsApi.create(data),
    successMessage: "Team meeting scheduled",
    errorMessage: "Failed to schedule team meeting. Please try again.",
    invalidateKeys: [["team-meetings"]],
  });

export const useUpdateTeamMeeting = () =>
  useToastMutation({
    mutationFn: ({ id, ...data }: UpdateTeamMeetingPayload & { id: string }) =>
      teamMeetingsApi.update(id, data),
    successMessage: "Team meeting updated",
    errorMessage: "Failed to update team meeting. Please try again.",
    invalidateKeys: [["team-meetings"]],
  });

export const useDeleteTeamMeeting = () =>
  useToastMutation({
    mutationFn: (id: string) => teamMeetingsApi.delete(id),
    successMessage: "Team meeting cancelled",
    errorMessage: "Failed to cancel team meeting. Please try again.",
    invalidateKeys: [["team-meetings"]],
  });

export const useUpdateTeamMeetingStatus = () =>
  useToastMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      teamMeetingsApi.updateStatus(id, status),
    successMessage: "Status updated",
    errorMessage: "Failed to update status. Please try again.",
    invalidateKeys: [["team-meetings"]],
  });
