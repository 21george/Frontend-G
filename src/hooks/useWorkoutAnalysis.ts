import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { workoutAnalysisApi } from "@/lib/api";
import { useToastMutation } from "./useToastMutation";
import type {
  WorkoutAnalysis,
  WorkoutAnalysisListItem,
  RecommendationsPreview,
  PaginatedResponse,
} from "@/types";

export const useWorkoutAnalyses = (
  clientId?: string,
  status?: string,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<WorkoutAnalysisListItem>>,
    "queryKey" | "queryFn"
  >,
) =>
  useQuery({
    queryKey: ["workout-analyses", clientId, status],
    queryFn: () => workoutAnalysisApi.list(clientId!, status),
    staleTime: 2 * 60_000,
    enabled: !!clientId,
    ...options,
  });

export const useWorkoutAnalysis = (clientId?: string, analysisId?: string) =>
  useQuery({
    queryKey: ["workout-analysis", clientId, analysisId],
    queryFn: () => workoutAnalysisApi.get(clientId!, analysisId!),
    enabled: !!clientId && !!analysisId,
    staleTime: 2 * 60_000,
  });

export const useCreateWorkoutAnalysis = () =>
  useToastMutation({
    mutationFn: (clientId: string) => workoutAnalysisApi.create(clientId),
    successMessage: "Workout analysis generated",
    errorMessage: "Failed to generate workout analysis",
    invalidateKeys: [["workout-analyses"]],
  });

export const useRecommendationsPreview = (clientId?: string) =>
  useQuery({
    queryKey: ["workout-analysis-preview", clientId],
    queryFn: () => workoutAnalysisApi.preview(clientId!),
    enabled: !!clientId,
    staleTime: 2 * 60_000,
  });

export const useApproveAnalysis = () =>
  useToastMutation({
    mutationFn: ({
      clientId,
      analysisId,
      notes,
    }: {
      clientId: string;
      analysisId: string;
      notes?: string;
    }) => workoutAnalysisApi.approve(clientId, analysisId, notes),
    successMessage: "Analysis approved",
    errorMessage: "Failed to approve analysis",
    invalidateKeys: [["workout-analyses"], ["workout-analysis"]],
  });

export const useRejectAnalysis = () =>
  useToastMutation({
    mutationFn: ({
      clientId,
      analysisId,
      notes,
    }: {
      clientId: string;
      analysisId: string;
      notes?: string;
    }) => workoutAnalysisApi.reject(clientId, analysisId, notes),
    successMessage: "Analysis rejected",
    errorMessage: "Failed to reject analysis",
    invalidateKeys: [["workout-analyses"], ["workout-analysis"]],
  });

export const useAssignPlan = () =>
  useToastMutation({
    mutationFn: ({
      clientId,
      analysisId,
      payload,
    }: {
      clientId: string;
      analysisId: string;
      payload: Parameters<typeof workoutAnalysisApi.assign>[2];
    }) => workoutAnalysisApi.assign(clientId, analysisId, payload),
    successMessage: "Plan assigned successfully",
    errorMessage: "Failed to assign plan",
    invalidateKeys: [["workout-analyses"], ["workout-analysis"], ["workout-plans"]],
  });
