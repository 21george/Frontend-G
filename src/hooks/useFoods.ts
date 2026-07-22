import { useQuery, useMutation } from "@tanstack/react-query";
import { foodsApi } from "@/lib/api";
import { useToastMutation } from "./useToastMutation";
import type { Food } from "@/types";
import type { CalculatedNutrients } from "@/lib/api/services/foods";

export const useSearchFoods = (query: string, page = 1) =>
  useQuery({
    queryKey: ["foods-search", query, page],
    queryFn: () => foodsApi.search(query, page),
    enabled: query.length >= 2,
    staleTime: 5 * 60_000,
  });

export const useFoods = () =>
  useQuery({
    queryKey: ["foods"],
    queryFn: () => foodsApi.list(),
    staleTime: 2 * 60_000,
  });

export const useGetFoodDetails = (fdcId: number | null | undefined) =>
  useQuery({
    queryKey: ["food-details-fdc", fdcId],
    queryFn: () => foodsApi.getDetails(fdcId!),
    enabled: typeof fdcId === "number" && fdcId > 0,
    staleTime: 10 * 60_000,
  });

export const useCalculateNutrition = (
  food: Pick<Food, "id" | "fdc_id"> | null,
  quantity: string,
) =>
  useQuery({
    queryKey: ["food-calculate", food?.id, food?.fdc_id, quantity],
    queryFn: () =>
      foodsApi.calculate({
        ...(food?.id ? { food_id: food.id } : {}),
        ...(food?.fdc_id ? { fdc_id: food.fdc_id } : {}),
        quantity,
      }),
    enabled: !!food && quantity.length >= 1 && /^\d/.test(quantity),
    staleTime: 30_000,
  });

export const useCreateFood = () =>
  useToastMutation({
    mutationFn: (data: {
      name: string;
      nutrients_per_100g: {
        calories: number;
        protein_g: number;
        carbs_g: number;
        fat_g: number;
      };
    }) => foodsApi.create(data),
    successMessage: "Custom food created",
    errorMessage: "Failed to create custom food",
    invalidateKeys: [["foods"]],
  });
