import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";

export const useWeeklySessions = (weekStart?: string) =>
  useQuery({
    queryKey: ["dashboard", "weekly-sessions", weekStart],
    queryFn: () => dashboardApi.weeklySessions(weekStart),
    staleTime: 60_000,
  });
