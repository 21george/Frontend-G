import api from "../client";
import type { ApiResponse, TeamMeeting } from "@/types";

export interface CreateTeamMeetingPayload {
  title: string;
  description?: string;
  scheduled_at: string;
  type: "call" | "video" | "chat" | "in_person";
  duration_min?: number;
  meeting_link?: string;
  notes?: string;
  participant_ids: string[];
}

export interface UpdateTeamMeetingPayload {
  title?: string;
  description?: string;
  scheduled_at?: string;
  type?: "call" | "video" | "chat" | "in_person";
  duration_min?: number;
  meeting_link?: string;
  notes?: string;
  participant_ids?: string[];
}

export const teamMeetingsApi = {
  list: (params?: { status?: string; from?: string; to?: string }) =>
    api
      .get<ApiResponse<TeamMeeting[]>>("/team-meetings", { params })
      .then((r) => r.data.data),

  get: (id: string) =>
    api
      .get<ApiResponse<TeamMeeting>>(`/team-meetings/${id}`)
      .then((r) => r.data.data),

  create: (payload: CreateTeamMeetingPayload) =>
    api
      .post<ApiResponse<{ id: string }>>("/team-meetings", payload)
      .then((r) => r.data),

  update: (id: string, payload: UpdateTeamMeetingPayload) =>
    api
      .put<ApiResponse<null>>(`/team-meetings/${id}`, payload)
      .then((r) => r.data),

  delete: (id: string) =>
    api
      .delete<ApiResponse<null>>(`/team-meetings/${id}`)
      .then((r) => r.data),

  updateStatus: (id: string, status: string) =>
    api
      .post<ApiResponse<null>>(`/team-meetings/${id}/status`, { status })
      .then((r) => r.data),
};
