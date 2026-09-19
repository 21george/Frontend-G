"use client";

import { useMemo } from "react";
import { Watch, Flame, Moon, HeartPulse, Activity } from "lucide-react";
import type { AnalyticsData } from "@/types";

interface Props {
  analytics: AnalyticsData | undefined;
}

function fmtNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString();
}

function fmtDuration(min: number | null | undefined): string {
  if (min === null || min === undefined || min <= 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  return h > 0 ? `${h}h` : `${m}m`;
}

export default function WearableWidget({ analytics }: Props) {
  const readiness = analytics?.wearable?.readiness;

  const avg30d = useMemo(() => {
    const trends = analytics?.wearable?.trends?.["30d"];
    if (!trends) return null;
    return {
      steps: trends.steps?.average,
      sleep: trends.sleep_minutes?.average,
      calories: trends.active_calories?.average,
      hr: trends.resting_hr?.average,
    };
  }, [analytics]);

  if (!readiness && !avg30d) {
    return (
      <div className="p-4 border border-dashed border-[var(--border)] rounded-xl text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          No wearable data yet.
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          Connect Fitbit or Apple Watch in the FitApp.
        </p>
      </div>
    );
  }

  const recoveryColor =
    (readiness?.recovery_score ?? 0) >= 70
      ? "text-emerald-600"
      : (readiness?.recovery_score ?? 0) >= 45
        ? "text-amber-600"
        : "text-rose-600";

  return (
    <div className="space-y-4">
      {readiness && (
        <div className="flex items-center justify-between p-4 bg-[var(--bg-subtle)] dark:bg-white/[0.02] border border-[var(--border)] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">
                Readiness / Recovery
              </p>
              <p className={`text-2xl font-bold ${recoveryColor}`}>
                {readiness.recovery_score}
                <span className="text-sm font-normal text-[var(--text-tertiary)]">
                  /100
                </span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-tertiary)]">Latest</p>
            <p className="text-sm text-[var(--text-secondary)]">
              {readiness.date}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={Watch}
          label={readiness?.steps != null ? "Steps today" : "Avg steps (30d)"}
          value={fmtNumber(readiness?.steps ?? avg30d?.steps)}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <MetricCard
          icon={Flame}
          label="Active cal"
          value={fmtNumber(readiness?.active_calories ?? avg30d?.calories)}
          color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
        />
        <MetricCard
          icon={Moon}
          label="Sleep"
          value={fmtDuration(readiness?.sleep_minutes ?? avg30d?.sleep)}
          color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
        />
        <MetricCard
          icon={HeartPulse}
          label="Resting HR"
          value={fmtNumber(readiness?.resting_hr ?? avg30d?.hr)}
          color="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
        />
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-xl bg-white dark:bg-[var(--bg-card)]">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {value}
        </p>
      </div>
    </div>
  );
}
