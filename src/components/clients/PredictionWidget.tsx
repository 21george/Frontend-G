"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { TrendingDown, TrendingUp, Minus, AlertCircle } from "lucide-react";

interface Prediction {
  horizon_days: number;
  confidence: "high" | "medium" | "low";
  current_weight_kg: number | null;
  current_body_fat_pct: number | null;
  predicted_weight_kg: number | null;
  predicted_body_fat_pct: number | null;
  weight_change_kg: number;
  body_fat_change_pct: number;
  inputs: {
    weekly_workouts: number;
    weekly_meal_logs: number;
    avg_daily_steps: number;
    activity_score: number;
  };
  disclaimer: string;
}

function usePrediction(clientId: string) {
  return useQuery<Prediction>({
    queryKey: ["prediction", clientId],
    queryFn: () =>
      api.get(`/coach/clients/${clientId}/prediction`).then((r) => r.data.data),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

const CONFIDENCE_COLORS = {
  high: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
  medium:
    "text-amber-600 bg-amber-50   dark:bg-amber-900/20   dark:text-amber-400",
  low: "text-slate-500 bg-slate-100  dark:bg-slate-800      dark:text-slate-400",
};

function ChangeIndicator({ value, unit }: { value: number; unit: string }) {
  if (Math.abs(value) < 0.01) {
    return (
      <span className="flex items-center gap-1 text-slate-500">
        <Minus className="w-4 h-4" /> No change
      </span>
    );
  }
  const isDown = value < 0;
  return (
    <span
      className={`flex items-center gap-1 font-semibold ${isDown ? "text-emerald-600 dark:text-emerald-400" : "text-orange-500"}`}
    >
      {isDown ? (
        <TrendingDown className="w-4 h-4" />
      ) : (
        <TrendingUp className="w-4 h-4" />
      )}
      {isDown ? "" : "+"}
      {value}
      {unit}
    </span>
  );
}

export function PredictionWidget({ clientId }: { clientId: string }) {
  const { data, isLoading, isError } = usePrediction(clientId);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-3">
        <Skeleton className="h-5 w-40 rounded" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <p className="text-sm text-[var(--text-secondary)]">
          Prediction not available — add body metrics and recent activity data
          to generate one.
        </p>
      </div>
    );
  }

  const confidenceClass =
    CONFIDENCE_COLORS[data.confidence] ?? CONFIDENCE_COLORS.low;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            2-Month Progress Prediction
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Based on last 28 days of activity
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${confidenceClass}`}
        >
          {data.confidence} confidence
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Weight */}
        <div className="rounded-lg bg-[var(--bg-subtle)] p-4 space-y-1">
          <p className="text-xs text-[var(--text-secondary)]">Weight</p>
          {data.current_weight_kg ? (
            <>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {data.predicted_weight_kg ?? "—"} kg
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                from {data.current_weight_kg} kg
              </p>
              <ChangeIndicator value={data.weight_change_kg} unit=" kg" />
            </>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              No weight data
            </p>
          )}
        </div>

        {/* Body fat */}
        <div className="rounded-lg bg-[var(--bg-subtle)] p-4 space-y-1">
          <p className="text-xs text-[var(--text-secondary)]">Body Fat</p>
          {data.current_body_fat_pct ? (
            <>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {data.predicted_body_fat_pct ?? "—"}%
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                from {data.current_body_fat_pct}%
              </p>
              <ChangeIndicator value={data.body_fat_change_pct} unit="%" />
            </>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              No body fat data
            </p>
          )}
        </div>
      </div>

      {/* Input signals */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Workouts/wk" value={data.inputs.weekly_workouts} />
        <Stat label="Meals logged/wk" value={data.inputs.weekly_meal_logs} />
        <Stat
          label="Avg steps/day"
          value={data.inputs.avg_daily_steps.toLocaleString()}
        />
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-xs text-[var(--text-secondary)] border-t border-[var(--border)] pt-3">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>{data.disclaimer}</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-[var(--bg-subtle)] py-2 px-1">
      <p className="text-sm font-bold text-[var(--text-primary)]">{value}</p>
      <p className="text-[10px] text-[var(--text-secondary)] leading-tight">
        {label}
      </p>
    </div>
  );
}
