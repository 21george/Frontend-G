"use client";

import { Target, Trophy } from "lucide-react";
import { useClientGoals } from "@/hooks/useGoals";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  clientId: string;
}

export function ClientGoalsTab({ clientId }: Props) {
  const { data: goals, isLoading } = useClientGoals(clientId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!goals || goals.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          No goals set
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          Create goals for this client to track progress.
        </p>
      </div>
    );
  }

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-emerald-500" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)] dark:text-[#FAFAFA]">
          Goals
        </h3>
        <span className="ml-auto text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          {activeGoals.length} active
        </span>
      </div>

      {activeGoals.length > 0 && (
        <div className="space-y-3">
          {activeGoals.map((goal) => (
            <div
              key={goal.id}
              className="bg-[var(--bg-card)] border border-[var(--border)] dark:border-white/[0.07] p-4 rounded-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-[var(--text-primary)] dark:text-[#FAFAFA]">
                  {goal.title}
                </p>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {Math.round(goal.progress_pct)}%
                </span>
              </div>

              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(goal.progress_pct, 100)}%`,
                    backgroundColor:
                      goal.progress_pct >= 75
                        ? "#10b981"
                        : goal.progress_pct >= 50
                          ? "#f59e0b"
                          : "#3b82f6",
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                <span>
                  {goal.current_value} / {goal.target_value} {goal.unit}
                </span>
                {goal.deadline && (
                  <span>
                    Due{" "}
                    {new Date(goal.deadline).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>

              {goal.progress_pct >= 100 && (
                <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <Trophy className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Goal achieved!
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {completedGoals.length > 0 && (
        <>
          <h4 className="text-sm font-semibold text-[var(--text-secondary)] mt-6 mb-2">
            Completed
          </h4>
          <div className="space-y-2">
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                className="bg-[var(--bg-card)] border border-[var(--border)] dark:border-white/[0.07] p-3 rounded-xl flex items-center gap-3 opacity-70"
              >
                <Trophy className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <p className="text-sm font-medium text-[var(--text-primary)] dark:text-[#FAFAFA] line-through">
                  {goal.title}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
