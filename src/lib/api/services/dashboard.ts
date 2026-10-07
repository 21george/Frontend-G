import api from "../client";
import type { ApiResponse, WeeklyDashboardSessions } from "@/types";

export const dashboardApi = {
  weeklySessions: (weekStart?: string) =>
    api
      .get<ApiResponse<WeeklyDashboardSessions>>("/dashboard/weekly-sessions", {
        params: weekStart ? { week_start: weekStart } : undefined,
      })
      .then((r) => r.data.data),
};
