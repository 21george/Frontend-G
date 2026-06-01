export interface WorkoutMetrics {
  completion_rate: number;
  avg_workout_duration_min: number;
  total_volume_lifted_kg: number;
  consistency_score: number;
  progression_score: number;
  pr_count_30d: number;
  streak_days: number;
  body_weight_change_kg: number | null;
  body_fat_change_pct: number | null;
}

export interface PlanRecommendation {
  plan_title: string;
  confidence: number;
  reasoning: string;
  focus_area: "strength" | "hypertrophy" | "endurance" | "rehab" | "maintenance";
  suggested_frequency_days_per_week: number;
  suggested_duration_weeks: number;
  notes: string;
}

export type AnalysisStatus = "pending" | "approved" | "rejected" | "assigned";

export interface WorkoutAnalysis {
  id: string;
  client_id: string;
  coach_id: string;
  status: AnalysisStatus;
  generated_at: string;
  reviewed_at: string | null;
  metrics: WorkoutMetrics;
  recommendations: PlanRecommendation[];
  coach_notes: string | null;
  selected_recommendation_index: number | null;
  assigned_plan_id: string | null;
}

export interface WorkoutAnalysisListItem {
  id: string;
  client_id: string;
  coach_id: string;
  status: AnalysisStatus;
  generated_at: string;
  reviewed_at: string | null;
  metrics: WorkoutMetrics;
  coach_notes: string | null;
  selected_recommendation_index: number | null;
  assigned_plan_id: string | null;
}

export interface RecommendationsPreview {
  client_id: string;
  metrics: WorkoutMetrics;
  recommendations: PlanRecommendation[];
}
