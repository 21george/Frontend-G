import { useQuery } from "@tanstack/react-query";
import { progressPhotosApi, type ProgressPhoto } from "@/lib/api/services/progress-photos";

export function useClientProgressPhotos(clientId: string) {
  return useQuery<ProgressPhoto[], Error>({
    queryKey: ["client-progress-photos", clientId],
    queryFn: () => progressPhotosApi.list(clientId),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
  });
}
