import api from "../client";
import type { ApiResponse } from "@/types";

export interface ProgressPhoto {
  id: string;
  type: "front" | "side" | "back";
  label: "before" | "after" | "progress";
  photo_url: string;
  taken_at: string;
}

export const progressPhotosApi = {
  list: (clientId: string) =>
    api
      .get<ApiResponse<ProgressPhoto[]>>(`/clients/${clientId}/progress-photos`)
      .then((r) => r.data.data ?? []),
};
