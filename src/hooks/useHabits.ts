import { useQuery } from "@tanstack/react-query";
import { habitsApi, type Habit } from "@/lib/api/services/habits";

export function useClientHabits(clientId: string) {
  return useQuery<Habit[], Error>({
    queryKey: ["client-habits", clientId],
    queryFn: () => habitsApi.list(clientId),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
  });
}
