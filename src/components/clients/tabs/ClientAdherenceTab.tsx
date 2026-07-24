"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { Activity, Utensils, TrendingUp, Calendar } from "lucide-react";

interface AdherenceSummary {
  workouts_completed: number;
  meals_completed: number;
  from: string;
  to: string;
}

interface AdherenceData {
  workout_completions: {
    day: string;
    completed_at: string | null;
    plan_id: string | null;
  }[];
  meal_completions: {
    id: string;
    day: string;
    meal_name: string;
    completed_at: string | null;
  }[];
  summary: AdherenceSummary;
}

function useAdherence(clientId: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  return useQuery<AdherenceData>({
    queryKey: ["adherence", clientId, from, to],
    queryFn: () =>
      api
        .get(`/coach/clients/${clientId}/adherence?${params.toString()}`)
        .then((r) => r.data.data),
    staleTime: 60_000,
  });
}

const RANGE_OPTIONS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
] as const;

function isoDateDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

export function ClientAdherenceTab({ clientId }: { clientId: string }) {
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);

  const from = isoDateDaysAgo(rangeDays);
  const to = isoToday();

  const { data, isLoading } = useAdherence(clientId, from, to);

  const summary = data?.summary;

  // Build a day-keyed map for the sparkline
  const workoutDays = new Set(
    (data?.workout_completions ?? []).map(
      (w) => w.completed_at?.slice(0, 10) ?? "",
    ),
  );
  const mealDayMap = new Map<string, number>();
  for (const m of data?.meal_completions ?? []) {
    const d = m.completed_at?.slice(0, 10) ?? "";
    mealDayMap.set(d, (mealDayMap.get(d) ?? 0) + 1);
  }

  // Skeleton
  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      {/* Range selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.days}
            onClick={() => setRangeDays(opt.days as 7 | 30 | 90)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              rangeDays === opt.days
                ? "bg-[var(--btn-bg)] text-white"
                : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <SummaryCard
          icon={<Activity className="w-5 h-5 text-blue-500" />}
          label="Workouts Completed"
          value={summary?.workouts_completed ?? 0}
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <SummaryCard
          icon={<Utensils className="w-5 h-5 text-green-500" />}
          label="Meals Completed"
          value={summary?.meals_completed ?? 0}
          bg="bg-green-50 dark:bg-green-900/20"
        />
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
          label="Adherence Rate"
          value={
            summary && summary.workouts_completed + summary.meals_completed > 0
              ? `${Math.round(
                  ((summary.workouts_completed * 1 +
                    summary.meals_completed * 0.5) /
                    (rangeDays * 1.5)) *
                    100,
                )}%`
              : "—"
          }
          bg="bg-purple-50 dark:bg-purple-900/20"
        />
      </div>

      {/* Day grid */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Daily Activity
        </h3>
        <DayGrid
          from={from}
          to={to}
          workoutDays={workoutDays}
          mealDayMap={mealDayMap}
        />
        <div className="flex gap-4 mt-3 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />{" "}
            Workout
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />{" "}
            Meals
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-300/60 inline-block" />{" "}
            Both
          </span>
        </div>
      </div>

      {/* Meal completions list */}
      {(data?.meal_completions?.length ?? 0) > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            Meal Completions
          </h3>
          <div className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] overflow-hidden">
            {data!.meal_completions.slice(0, 20).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between px-4 py-2.5 bg-[var(--bg-card)] text-sm"
              >
                <span className="text-[var(--text-primary)] font-medium capitalize">
                  {m.meal_name}
                </span>
                <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                  <span className="capitalize">{m.day}</span>
                  {m.completed_at && (
                    <span>
                      {new Date(m.completed_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!data ||
      (data.workout_completions.length === 0 &&
        data.meal_completions.length === 0) ? (
        <p className="text-sm text-[var(--text-secondary)] text-center py-8">
          No activity recorded in this period.
        </p>
      ) : null}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────────── */

function SummaryCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  bg: string;
}) {
  return (
    <div className={`rounded-lg p-4 ${bg}`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{label}</p>
    </div>
  );
}

function DayGrid({
  from,
  to,
  workoutDays,
  mealDayMap,
}: {
  from: string;
  to: string;
  workoutDays: Set<string>;
  mealDayMap: Map<string, number>;
}) {
  const days: string[] = [];
  const cursor = new Date(from);
  const end = new Date(to);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return (
    <div className="flex flex-wrap gap-1">
      {days.map((d) => {
        const hasWorkout = workoutDays.has(d);
        const hasMeal = (mealDayMap.get(d) ?? 0) > 0;
        let bg = "bg-[var(--bg-subtle)]";
        if (hasWorkout && hasMeal) bg = "bg-blue-300";
        else if (hasWorkout) bg = "bg-blue-500";
        else if (hasMeal) bg = "bg-green-500";

        return (
          <div
            key={d}
            title={d}
            className={`w-5 h-5 rounded-sm ${bg} transition-colors`}
          />
        );
      })}
    </div>
  );
}
