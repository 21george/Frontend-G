import { useQuery } from "@tanstack/react-query";
import { prRecordsApi, type PrRecord } from "@/lib/api/services/pr-records";

export function useClientPrs(clientId: string) {
  return useQuery<{ prs: PrRecord[]; total_count: number } | undefined, Error>({
    queryKey: ["client-prs", clientId],
    queryFn: () => prRecordsApi.list(clientId),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useExercisePrHistory(clientId: string, exerciseId: string) {
  return useQuery<
    { exercise_id: string; history: PrRecord[] } | undefined,
    Error
  >({
    queryKey: ["exercise-pr-history", clientId, exerciseId],
    queryFn: () => prRecordsApi.history(clientId, exerciseId),
    enabled: !!clientId && !!exerciseId,
    staleTime: 1000 * 60 * 5,
  });
}
