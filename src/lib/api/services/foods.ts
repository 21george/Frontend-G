import api from "../client";
import type { Food, ApiResponse } from "@/types";

export interface SearchFoodsResponse {
  foods: Food[];
  total_hits: number;
  page: number;
}

export interface CalculatedNutrients {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  quantity_g: number;
}

export const foodsApi = {
  search: (query: string, page = 1) =>
    api
      .get<ApiResponse<SearchFoodsResponse>>("/foods/search", {
        params: { q: query, page },
      })
      .then((r) => r.data.data),

  calculate: (params: {
    food_id?: string;
    fdc_id?: number;
    quantity: string;
  }) =>
    api
      .get<ApiResponse<CalculatedNutrients>>("/foods/calculate", { params })
      .then((r) => r.data.data),

  getDetails: (fdcId: number) =>
    api.get<ApiResponse<Food>>(`/foods/fdc/${fdcId}`).then((r) => r.data.data),

  list: () => api.get<ApiResponse<Food[]>>("/foods").then((r) => r.data.data),

  get: (id: string) =>
    api.get<ApiResponse<Food>>(`/foods/${id}`).then((r) => r.data.data),

  create: (data: {
    name: string;
    nutrients_per_100g: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    };
  }) => api.post("/foods", data).then((r) => r.data),
};
