import api from "../client";
import type {
  ApiResponse,
  CoachingSession,
  CreateCoachingSessionPayload,
  UpdateCoachingSessionPayload,
  LiveKitTokenResponse,
} from "@/types";

export const coachingSessionsApi = {
  // ── Coach endpoints ──────────────────────────────────────────────────────

  list: (params?: { status?: string; client_id?: string }) =>
    api
      .get<ApiResponse<CoachingSession[]>>("/coaching-sessions", { params })
      .then((r) => r.data.data),

  get: (id: string) =>
    api
      .get<ApiResponse<CoachingSession>>(`/coaching-sessions/${id}`)
      .then((r) => r.data.data),

  create: (payload: CreateCoachingSessionPayload) =>
    api
      .post<ApiResponse<{ id: string }>>("/coaching-sessions", payload)
      .then((r) => r.data),

  update: (id: string, payload: UpdateCoachingSessionPayload) =>
    api
      .put<ApiResponse<null>>(`/coaching-sessions/${id}`, payload)
      .then((r) => r.data),

  delete: (id: string) =>
    api
      .delete<ApiResponse<null>>(`/coaching-sessions/${id}`)
      .then((r) => r.data),

  /** Update status: 'upcoming' | 'live' | 'ended' | 'cancelled' */
  updateStatus: (id: string, status: string) =>
    api
      .post<ApiResponse<null>>(`/coaching-sessions/${id}/status`, { status })
      .then((r) => r.data),

  /** Get a LiveKit JWT token for the coach to join the video room. */
  getToken: (id: string) =>
    api
      .post<ApiResponse<LiveKitTokenResponse>>(
        `/coaching-sessions/${id}/token`,
        {},
      )
      .then((r) => r.data.data),

  /** Persist session notes (called after session ends or during). */
  saveNotes: (id: string, notes: string) =>
    api
      .post<ApiResponse<null>>(`/coaching-sessions/${id}/notes`, { notes })
      .then((r) => r.data),
};
