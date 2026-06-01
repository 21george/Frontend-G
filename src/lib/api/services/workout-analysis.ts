import api from "../client";
import type {
  ApiResponse,
  PaginatedResponse,
  WorkoutAnalysis,
  WorkoutAnalysisListItem,
  RecommendationsPreview,
} from "@/types";

export const workoutAnalysisApi = {
  list: (clientId: string, status?: string, page?: number) =>
    api
      .get<
        PaginatedResponse<WorkoutAnalysisListItem>
      >(`/coach/clients/${clientId}/workout-analyses`, {
        params: { status, page },
      })
      .then((r) => r.data),

  get: (clientId: string, analysisId: string) =>
    api
      .get<ApiResponse<WorkoutAnalysis>>(
        `/coach/clients/${clientId}/workout-analyses/${analysisId}`,
      )
      .then((r) => r.data.data),

  create: (clientId: string) =>
    api
      .post<ApiResponse<WorkoutAnalysis>>(
        `/coach/clients/${clientId}/workout-analyses`,
      )
      .then((r) => r.data.data),

  preview: (clientId: string) =>
    api
      .get<ApiResponse<RecommendationsPreview>>(
        `/coach/clients/${clientId}/workout-analyses/recommendations`,
      )
      .then((r) => r.data.data),

  approve: (clientId: string, analysisId: string, notes?: string) =>
    api
      .post<ApiResponse<null>>(
        `/coach/clients/${clientId}/workout-analyses/${analysisId}/approve`,
        { coach_notes: notes },
      )
      .then((r) => r.data),

  reject: (clientId: string, analysisId: string, notes?: string) =>
    api
      .post<ApiResponse<null>>(
        `/coach/clients/${clientId}/workout-analyses/${analysisId}/reject`,
        { coach_notes: notes },
      )
      .then((r) => r.data),

  assign: (
    clientId: string,
    analysisId: string,
    payload: {
      plan_id?: string;
      plan?: {
        title: string;
        week_start?: string;
        status?: string;
        days?: any[];
        notes?: string;
      };
      selected_recommendation_index?: number;
      plan_title?: string;
    },
  ) =>
    api
      .post<ApiResponse<{ assigned_plan_id: string }>>(
        `/coach/clients/${clientId}/workout-analyses/${analysisId}/assign`,
        payload,
      )
      .then((r) => r.data),
};
