import api from "../client";
import type {
  CoachingSession,
  CreateCoachingSessionPayload,
  UpdateCoachingSessionPayload,
  LiveKitTokenResponse,
} from "@/types";

export const coachingSessionsApi = {
  // ── Coach endpoints ──────────────────────────────────────────────────────

  list: (params?: { status?: string; client_id?: string }) =>
    api.get<{ data: CoachingSession[] }>("/coaching-sessions", { params }),

  get: (id: string) =>
    api.get<{ data: CoachingSession }>(`/coaching-sessions/${id}`),

  create: (payload: CreateCoachingSessionPayload) =>
    api.post<{ data: { id: string } }>("/coaching-sessions", payload),

  update: (id: string, payload: UpdateCoachingSessionPayload) =>
    api.put(`/coaching-sessions/${id}`, payload),

  delete: (id: string) => api.delete(`/coaching-sessions/${id}`),

  /** Update status: 'upcoming' | 'live' | 'ended' | 'cancelled' */
  updateStatus: (id: string, status: string) =>
    api.post(`/coaching-sessions/${id}/status`, { status }),

  /** Get a LiveKit JWT token for the coach to join the video room. */
  getToken: (id: string) =>
    api.post<{ data: LiveKitTokenResponse }>(
      `/coaching-sessions/${id}/token`,
      {},
    ),

  /** Persist session notes (called after session ends or during). */
  saveNotes: (id: string, notes: string) =>
    api.post(`/coaching-sessions/${id}/notes`, { notes }),
};
