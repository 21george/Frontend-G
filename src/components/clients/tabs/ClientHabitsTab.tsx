"use client";

import { Flame, CheckCircle2, Circle } from "lucide-react";
import { useClientHabits } from "@/hooks/useHabits";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  clientId: string;
}

export function ClientHabitsTab({ clientId }: Props) {
  const { data: habits, isLoading } = useClientHabits(clientId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!habits || habits.length === 0) {
    return (
      <div className="text-center py-12">
        <Flame className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          No habits tracked
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          Assign habits to this client to start tracking adherence.
        </p>
      </div>
    );
  }

  const completedCount = habits.filter((h) => h.completed_today).length;
  const adherence =
    habits.length > 0
      ? Math.round((completedCount / habits.length) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)] dark:text-[#FAFAFA]">
          Habits
        </h3>
        <span className="ml-auto text-xs font-medium px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
          {adherence}% today
        </span>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] dark:border-white/[0.07] p-4 rounded-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 flex items-center justify-center">
            <span className="text-lg font-bold text-orange-500">
              {adherence}%
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)] dark:text-[#FAFAFA]">
              Today&apos;s Adherence
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              {completedCount} of {habits.length} habits completed
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="bg-[var(--bg-card)] border border-[var(--border)] dark:border-white/[0.07] p-3 rounded-xl flex items-center gap-3"
          >
            {habit.completed_today ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  habit.completed_today
                    ? "text-[var(--text-primary)] dark:text-[#FAFAFA]"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                {habit.title}
              </p>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                {habit.frequency} • Target: {habit.target_count}
              </p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20">
              <Flame className="w-3 h-3 text-orange-500" />
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                {habit.streak}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
