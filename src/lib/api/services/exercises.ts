import api from "../client";
import type { ApiResponse } from "@/types";

export interface ExerciseLibraryItem {
  id: string;
  external_id: number;
  name: string;
  category: string;
  muscles: string[];
  equipment: string[];
  description: string;
  images: string[];
  source: string;
}

export interface SearchExercisesResponse {
  data: ExerciseLibraryItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export const exercisesApi = {
  search: (params: {
    q?: string;
    category?: string;
    muscle?: string;
    page?: number;
    per_page?: number;
  }) =>
    api
      .get<ApiResponse<SearchExercisesResponse>>("/exercises", { params })
      .then((r) => r.data.data),

  get: (id: string) =>
    api
      .get<ApiResponse<ExerciseLibraryItem>>(`/exercises/${id}`)
      .then((r) => r.data.data),

  sync: () =>
    api
      .post<ApiResponse<{ synced: number }>>("/exercises/sync")
      .then((r) => r.data.data),
};
