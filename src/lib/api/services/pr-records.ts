import api from "../client";
import type { ApiResponse } from "@/types";

export interface PrRecord {
  id: string;
  exercise_id: string;
  exercise_name: string;
  reps: number;
  weight: number;
  unit: string;
  one_rm: number;
  date: string;
}

export const prRecordsApi = {
  list: (clientId: string) =>
    api
      .get<ApiResponse<{ prs: PrRecord[]; total_count: number }>>(`/coach/clients/${clientId}/prs`)
      .then((r) => r.data.data),

  history: (clientId: string, exerciseId: string) =>
    api
      .get<ApiResponse<{ exercise_id: string; history: PrRecord[] }>>(
        `/coach/clients/${clientId}/prs/${exerciseId}`,
      )
      .then((r) => r.data.data),
};
