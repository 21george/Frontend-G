import { useQuery } from "@tanstack/react-query";
import { goalsApi, type Goal } from "@/lib/api/services/goals";

export function useClientGoals(clientId: string) {
  return useQuery<Goal[], Error>({
    queryKey: ["client-goals", clientId],
    queryFn: () => goalsApi.list(clientId),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
  });
}
