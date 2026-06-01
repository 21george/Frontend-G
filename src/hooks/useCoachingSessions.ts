import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coachingSessionsApi } from "@/lib/api";
import { useToastMutation } from "./useToastMutation";
import type {
  CreateCoachingSessionPayload,
  UpdateCoachingSessionPayload,
} from "@/types";

const KEYS = {
  all: ["coaching-sessions"] as string[],
  detail: (id: string) => ["coaching-sessions", id] as string[],
};

// ── Coach hooks ───────────────────────────────────────────────────────────────

export const useCoachingSessions = (params?: {
  status?: string;
  client_id?: string;
}) =>
  useQuery({
    queryKey: [...KEYS.all, params],
    queryFn: () => coachingSessionsApi.list(params),
    select: (res) => res.data.data,
  });

export const useCoachingSession = (id: string) =>
  useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => coachingSessionsApi.get(id),
    enabled: !!id,
    select: (res) => res.data.data,
  });

export const useCreateCoachingSession = () =>
  useToastMutation({
    mutationFn: (payload: CreateCoachingSessionPayload) =>
      coachingSessionsApi.create(payload),
    successMessage: "Coaching session scheduled",
    errorMessage: "Failed to create session",
    invalidateKeys: [KEYS.all],
  });

export const useUpdateCoachingSession = (id: string) =>
  useToastMutation({
    mutationFn: (payload: UpdateCoachingSessionPayload) =>
      coachingSessionsApi.update(id, payload),
    successMessage: "Session updated",
    errorMessage: "Failed to update session",
    invalidateKeys: [KEYS.all, KEYS.detail(id)],
  });

export const useDeleteCoachingSession = () =>
  useToastMutation({
    mutationFn: (id: string) => coachingSessionsApi.delete(id),
    successMessage: "Session deleted",
    errorMessage: "Failed to delete session",
    invalidateKeys: [KEYS.all],
  });

export const useUpdateSessionStatus = () =>
  useToastMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      coachingSessionsApi.updateStatus(id, status),
    successMessage: "Session status updated",
    errorMessage: "Failed to update status",
    invalidateKeys: [KEYS.all],
  });

/** Fetches a LiveKit token for the coach — enabled only when ready to join. */
export const useCoachingSessionToken = (
  id: string,
  enabled: boolean = false,
) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: [...KEYS.detail(id), "token"],
    queryFn: async () => {
      const res = await coachingSessionsApi.getToken(id);
      return res.data.data;
    },
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000, // token is valid for 6 h; refetch every 5 min is fine
    retry: 1,
  });
};

export const useSaveSessionNotes = (id: string) =>
  useToastMutation({
    mutationFn: (notes: string) => coachingSessionsApi.saveNotes(id, notes),
    successMessage: "Notes saved",
    errorMessage: "Failed to save notes",
    invalidateKeys: [KEYS.detail(id)],
  });
