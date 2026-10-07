import { useQuery } from "@tanstack/react-query";
import { exercisesApi } from "@/lib/api/services/exercises";

const EXERCISES_KEY = ["exercises"];

export const useExercises = (params: {
  q?: string;
  category?: string;
  muscle?: string;
  page?: number;
  per_page?: number;
}) =>
  useQuery({
    queryKey: [...EXERCISES_KEY, params],
    queryFn: () => exercisesApi.search(params),
    staleTime: 60_000,
    enabled: true,
  });

export const useExercise = (id: string) =>
  useQuery({
    queryKey: [...EXERCISES_KEY, id],
    queryFn: () => exercisesApi.get(id),
    staleTime: 300_000,
    enabled: !!id,
  });
