import api from "../client";
import type { ApiResponse } from "@/types";

export interface Habit {
  id: string;
  title: string;
  frequency: "daily" | "weekly";
  target_count: number;
  streak: number;
  completed_today: boolean;
}

export const habitsApi = {
  list: (clientId: string) =>
    api
      .get<ApiResponse<{ habits: Habit[] }>>(`/clients/${clientId}/habits`)
      .then((r) => r.data.data?.habits ?? []),
};
