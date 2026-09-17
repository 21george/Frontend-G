"use client";

import type { AnalyticsData } from "@/types";

const METRIC_META: Record<
  string,
  { label: string; unit: string; color: string }
> = {
  steps: { label: "Steps", unit: "", color: "#3b82f6" },
  active_calories: { label: "Active Calories", unit: "kcal", color: "#f97316" },
  distance_km: { label: "Distance", unit: "km", color: "#10b981" },
  resting_hr: { label: "Resting HR", unit: "bpm", color: "#ef4444" },
  sleep_minutes: { label: "Sleep", unit: "min", color: "#8b5cf6" },
};

function formatValue(metric: string, value: number): string {
  if (metric === "sleep_minutes") {
    const h = Math.floor(value / 60);
    const m = Math.round(value % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
  return Number(value).toLocaleString();
}

export default function WearableTrendSection({
  analytics,
}: {
  analytics: AnalyticsData | undefined;
}) {
  const trends = analytics?.wearable?.trends?.["30d"];
  const readiness = analytics?.wearable?.readiness;
  const correlation = analytics?.wearable?.correlation;

  if (!trends) {
    return null;
  }

  return (
    <div className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-5 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Wearable Trends (30 days)
        </p>
        {readiness && (
          <span className="text-[11px] text-[var(--text-secondary)]">
            Recovery: {" "}
            <span
              className={`font-bold ${
                readiness.recovery_score >= 70
                  ? "text-emerald-500"
                  : readiness.recovery_score >= 45
                    ? "text-amber-500"
                    : "text-rose-500"
              }`}
            >
              {readiness.recovery_score}/100
            </span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Object.entries(METRIC_META).map(([metric, meta]) => {
          const trend = trends[metric];
          if (!trend || trend.points.length === 0) return null;
          const values = trend.points.map((p: { value: number }) => p.value);
          const max = Math.max(...values, 1);
          const min = Math.min(...values);
          const range = max - min || 1;
          return (
            <div key={metric} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[var(--text-secondary)]">{meta.label}</span>
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  avg {formatValue(metric, trend.average)} {meta.unit}
                </span>
              </div>
              <div className="flex items-end gap-0.5 h-16">
                {trend.points.slice(-30).map((p: { date: string; value: number }, i: number) => {
                  const pct = ((p.value - min) / range) * 80 + 20;
                  return (
                    <div
                      key={i}
                      className="flex-1 min-w-[2px] rounded-sm transition-all"
                      style={{ height: `${Math.min(100, pct)}%`, background: meta.color }}
                      title={`${p.date}: ${formatValue(metric, p.value)} ${meta.unit}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {correlation && (
        <div className="pt-3 border-t border-[var(--border)] dark:border-white/[0.06]">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Workout vs Sleep Correlation (30 days)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(["poor", "moderate", "good"] as const).map((bucket) => {
              const data = correlation[bucket];
              if (!data) return null;
              return (
                <div
                  key={bucket}
                  className="p-2.5 bg-[var(--bg-subtle)] dark:bg-white/[0.02] border border-[var(--border)] dark:border-white/[0.04] rounded text-center"
                >
                  <p className="text-[10px] text-[var(--text-tertiary)] capitalize">{bucket}</p>
                  <p className="text-[14px] font-bold text-[var(--text-primary)]">{data.completion_rate}%</p>
                  <p className="text-[9px] text-[var(--text-tertiary)]">{data.workout_days}/{data.days} days</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
