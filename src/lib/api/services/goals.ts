import api from "../client";
import type { ApiResponse } from "@/types";

export interface Goal {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string | null;
  status: "active" | "completed" | "abandoned";
  progress_pct: number;
}

export const goalsApi = {
  list: (clientId: string) =>
    api
      .get<ApiResponse<Goal[]>>(`/clients/${clientId}/goals`)
      .then((r) => r.data.data ?? []),
};
