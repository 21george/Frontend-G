import api from "../client";
import type {
  MediaUpload,
  WorkoutLogDetailed,
  ApiResponse,
  PaginatedResponse,
  Exercise,
} from "@/types";

export interface StoreMeasurementPayload {
  weight_kg?: number;
  chest_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
  arms_cm?: number;
  legs_cm?: number;
  body_fat_pct?: number;
  notes?: string;
}

export const mediaApi = {
  clientMedia: (clientId: string) =>
    api
      .get<ApiResponse<MediaUpload[]>>(`/coach/media/${clientId}`)
      .then((r) => r.data.data),

  clientLogs: (clientId: string) =>
    api
      .get<
        PaginatedResponse<WorkoutLogDetailed>
      >(`/coach/clients/${clientId}/logs`)
      .then((r) => r.data.data),

  clientWorkoutProgress: (clientId: string) =>
    api
      .get<
        ApiResponse<ClientWorkoutProgress>
      >(`/coach/clients/${clientId}/workout-progress`)
      .then((r) => r.data.data),

  storeMeasurement: (clientId: string, payload: StoreMeasurementPayload) =>
    api
      .post<
        ApiResponse<{ id: string }>
      >(`/coach/clients/${clientId}/measurements`, payload)
      .then((r) => r.data),
};

export interface ClientWorkoutProgress {
  completed: WorkoutProgressPlan[];
  in_progress: WorkoutProgressPlan[];
  stats: {
    total_plans: number;
    completed_count: number;
    in_progress_count: number;
  };
}

export interface WorkoutProgressPlan {
  id: string;
  title: string;
  week_start: string | null;
  status: string;
  total_days: number;
  completed_days: number;
  progress_pct: number;
  days: WorkoutProgressDay[];
}

export interface WorkoutProgressDay {
  day: string;
  exercises: Exercise[];
  is_completed: boolean;
  completed_at: string | null;
}
