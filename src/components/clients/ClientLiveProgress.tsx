"use client";

import {
  Activity,
  CheckCircle2,
  Clock,
  Dumbbell,
  User,
} from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { LiveProgressResponse } from "@/types";

interface Props {
  liveProgress: LiveProgressResponse | undefined;
  isLoading?: boolean;
}

export function ClientLiveProgress({ liveProgress, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="border border-[var(--border)] dark:border-white/[0.06] bg-[var(--bg-card)] p-4 sm:p-5 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 dark:bg-white/[0.06] mb-3" />
        <div className="h-2 w-full bg-slate-200 dark:bg-white/[0.06] mb-4" />
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-8 bg-slate-200 dark:bg-white/[0.06]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!liveProgress || !liveProgress.active_plan) {
    return (
      <div className="border border-[var(--border)] dark:border-white/[0.06] bg-[var(--bg-card)] p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center">
            <Activity size={16} className="text-slate-400 dark:text-slate-500" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
              Live Progress
            </p>
            <p className="text-[11px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
              No active workout plan
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { client, active_plan, latest_log, last_activity_at } = liveProgress;
  const progressPct = active_plan.progress_pct ?? 0;
  const isComplete = progressPct >= 100;

  return (
    <div className="border border-[var(--border)] dark:border-white/[0.06] bg-[var(--bg-card)] overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Activity size={16} className="text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[14px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                Live Progress
              </p>
              {last_activity_at && (
                <span className="text-[10px] text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)] flex items-center gap-1">
                  <Clock size={9} />
                  {timeAgo(last_activity_at)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-5 h-5 bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center overflow-hidden flex-shrink-0">
                {client.photo ? (
                  <img
                    src={client.photo}
                    alt={client.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={10} className="text-slate-400" />
                )}
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)] truncate">
                {client.name}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-[18px] font-bold text-[var(--text-primary)] dark:text-white">
              {progressPct}%
            </p>
            <p className="text-[10px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
              {active_plan.completed_days}/{active_plan.total_days} days
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full bg-[var(--bg-subtle)] dark:bg-slate-800 overflow-hidden mb-4">
          <div
            className={`h-full transition-all ${isComplete ? "bg-emerald-500" : "bg-amber-500"}`}
            style={{ width: `${Math.min(progressPct, 100)}%` }}
          />
        </div>

        {/* Days */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {active_plan.days.map((day, idx) => (
            <div
              key={idx}
              className={`border p-2 flex flex-col items-center justify-center gap-1 transition-colors ${
                day.is_completed
                  ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/5"
                  : "border-[var(--border)] dark:border-white/[0.06] bg-[var(--bg-subtle)] dark:bg-white/[0.03]"
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)]">
                {day.day.slice(0, 3)}
              </span>
              {day.is_completed ? (
                <CheckCircle2 size={14} className="text-emerald-500" />
              ) : (
                <div className="w-3.5 h-3.5 border-2 border-[var(--border)] dark:border-white/10" />
              )}
              {day.completed_at && (
                <span className="text-[9px] text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)] hidden sm:block">
                  {timeAgo(day.completed_at)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Latest log */}
      {latest_log && (
        <div className="border-t border-[var(--border)] dark:border-white/[0.06] p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell size={14} className="text-[var(--text-tertiary)]" />
            <p className="text-[12px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
              Latest Log — {latest_log.day}
            </p>
            <span className="text-[10px] text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)] ml-auto">
              {latest_log.completed_at
                ? timeAgo(latest_log.completed_at)
                : ""}
            </span>
          </div>

          {(latest_log.exercises ?? []).length === 0 ? (
            <p className="text-[11px] text-[var(--text-tertiary)]">
              No exercise details recorded
            </p>
          ) : (
            <div className="space-y-2">
              {(latest_log.exercises ?? []).map((ex, ei) => {
                const totalSets = ex.sets_completed?.length ?? 0;
                const totalVol = (ex.sets_completed ?? []).reduce(
                  (acc, s) => acc + (s.kg ?? 0) * (s.reps_done ?? s.reps ?? 0),
                  0,
                );
                return (
                  <div
                    key={ei}
                    className="flex items-center justify-between p-2 bg-[var(--bg-subtle)] dark:bg-white/[0.02] border border-[var(--border)] dark:border-white/[0.05]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-[var(--text-primary)] dark:text-slate-200 truncate">
                        {ex.name}
                      </p>
                      <p className="text-[10px] text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)]">
                        {totalSets} sets ·{" "}
                        {totalVol > 0
                          ? `${Math.round(totalVol).toLocaleString()} kg vol`
                          : "—"}
                      </p>
                    </div>
                    {(ex.sets_completed ?? []).length > 0 && (
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {(ex.sets_completed ?? []).map((s, si) => (
                          <span
                            key={si}
                            className="text-[9px] font-semibold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400"
                          >
                            {s.kg ?? 0}×{s.reps_done ?? s.reps ?? 0}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {latest_log.notes && (
            <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/20">
              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mb-0.5">
                Client Notes
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                {latest_log.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
