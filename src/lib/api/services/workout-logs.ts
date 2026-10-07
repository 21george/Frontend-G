import apiClient from "@/lib/api/client";

export interface PendingReviewLog {
  id: string;
  client: {
    name: string;
    photo: string | null;
  };
  day: string;
  exercises: unknown[];
  notes: string | null;
  completed_at: string;
  review_status: string;
}

export async function getPendingReviews(): Promise<{
  logs: PendingReviewLog[];
  count: number;
}> {
  return apiClient.get("/coach/workout-logs/pending-review");
}

export async function reviewWorkoutLog(
  logId: string,
  data: { status: "approved" | "needs_redo"; feedback?: string },
): Promise<unknown> {
  return apiClient.post(`/coach/workout-logs/${logId}/review`, data);
}
