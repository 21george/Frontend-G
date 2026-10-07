"use client";

import { Trophy, TrendingUp, Calendar } from "lucide-react";
import { useClientPrs } from "@/hooks/usePrRecords";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  clientId: string;
}

export function ClientPrsTab({ clientId }: Props) {
  const { data, isLoading } = useClientPrs(clientId);
  const prs = data?.prs ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (prs.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          No personal records yet
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          Client PRs will appear here once they complete workouts with logged weights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)] dark:text-[#FAFAFA]">
          Personal Records
        </h3>
        <span className="ml-auto text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          {data?.total_count ?? 0} total
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {prs.map((pr) => (
          <div
            key={pr.id}
            className="bg-[var(--bg-card)] border border-[var(--border)] dark:border-white/[0.07] p-4 rounded-xl"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)] dark:text-[#FAFAFA]">
                  {pr.exercise_name}
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(pr.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-[var(--bg-subtle)] dark:bg-white/[0.03] rounded-lg">
                <p className="text-lg font-bold text-[var(--text-primary)] dark:text-[#FAFAFA]">
                  {pr.weight}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                  {pr.unit}
                </p>
              </div>
              <div className="text-center p-2 bg-[var(--bg-subtle)] dark:bg-white/[0.03] rounded-lg">
                <p className="text-lg font-bold text-[var(--text-primary)] dark:text-[#FAFAFA]">
                  {pr.reps}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                  reps
                </p>
              </div>
              <div className="text-center p-2 bg-[var(--bg-subtle)] dark:bg-white/[0.03] rounded-lg">
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {Math.round(pr.one_rm)}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                  est 1RM
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
