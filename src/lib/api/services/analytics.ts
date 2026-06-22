import api from "../client";
import type { ApiResponse, AnalyticsData } from "@/types";

export interface CoachAnalyticsData {
  total_clients: number;
  new_clients_this_month: number;
  active_clients: number;
  total_workouts: number;
  completion_rate: number;
  top_clients: Array<{
    id: string;
    name: string;
    sessions: number;
  }>;
}

export interface SessionAnalyticsData {
  total: number;
  this_month: number;
  by_status: {
    upcoming: number;
    live: number;
    ended: number;
    cancelled: number;
  };
  avg_duration_min: number | null;
  top_clients: Array<{
    id: string;
    name: string;
    sessions: number;
  }>;
  recent: Array<{
    id: string;
    title: string;
    client_name: string;
    status: string;
    scheduled_at: string;
    duration_min: number | null;
  }>;
}

export const analyticsApi = {
  client: (clientId: string) =>
    api
      .get<ApiResponse<AnalyticsData>>(`/coach/clients/${clientId}/analytics`)
      .then((r) => r.data.data),

  coach: () =>
    api
      .get<ApiResponse<CoachAnalyticsData>>("/analytics/coach")
      .then((r) => r.data.data),

  sessions: () =>
    api
      .get<ApiResponse<SessionAnalyticsData>>("/analytics/sessions")
      .then((r) => r.data.data),
};
