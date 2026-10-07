"use client";

import { useState } from "react";
import { ClipboardCheck, CheckCircle, AlertCircle } from "lucide-react";
import { getPendingReviews, reviewWorkoutLog, type PendingReviewLog } from "@/lib/api/services/workout-logs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/Skeleton";

export function PendingReviews() {
  const { data, isLoading } = useQuery({
    queryKey: ["pending-reviews"],
    queryFn: getPendingReviews,
  });

  const logs = data?.logs ?? [];
  const count = data?.count ?? 0;

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] dark:border-white/[0.07] p-5 shadow-[var(--shadow-sm)]">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-16 w-full mb-3" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (count === 0) {
    return null;
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] dark:border-white/[0.07] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardCheck size={16} className="text-[#132E35] dark:text-[#2A96AD]" />
        <span className="text-sm font-semibold text-[var(--text-primary)] dark:text-[#FAFAFA]">
          Pending Reviews
        </span>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          {count}
        </span>
      </div>

      <div className="space-y-3">
        {logs.slice(0, 5).map((log) => (
          <ReviewCard key={log.id} log={log} />
        ))}
      </div>

      {count > 5 && (
        <p className="text-[11px] text-[var(--text-tertiary)] mt-3 text-center">
          +{count - 5} more pending reviews
        </p>
      )}
    </div>
  );
}

function ReviewCard({ log }: { log: PendingReviewLog }) {
  const [feedback, setFeedback] = useState("");
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (status: "approved" | "needs_redo") =>
      reviewWorkoutLog(log.id, { status, feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-reviews"] });
    },
  });

  const completedDate = log.completed_at
    ? new Date(log.completed_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div className="border border-[var(--border)] dark:border-white/[0.06] rounded-lg p-3 bg-[var(--bg-subtle)] dark:bg-white/[0.02]">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[var(--bg-element)] dark:bg-[#FAFAFA]/[0.05] flex items-center justify-center flex-shrink-0">
          {log.client.photo ? (
            <img
              src={log.client.photo}
              alt={log.client.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-[10px] font-bold text-[var(--text-secondary)]">
              {(log.client.name ?? "?").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] dark:text-[#FAFAFA] truncate">
            {log.client.name}
          </p>
          <p className="text-[11px] text-[var(--text-tertiary)]">
            {log.day} • {completedDate}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] font-semibold text-[#132E35] dark:text-[#2A96AD] hover:underline"
        >
          {expanded ? "Close" : "Review"}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Add feedback (optional)..."
            className="w-full text-xs p-2 rounded border border-[var(--border)] dark:border-white/[0.1] bg-[var(--bg-card)] dark:bg-[#FAFAFA]/[0.03] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={() => mutation.mutate("approved")}
              disabled={mutation.isPending}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle size={14} />
              Approve
            </button>
            <button
              onClick={() => mutation.mutate("needs_redo")}
              disabled={mutation.isPending}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-50"
            >
              <AlertCircle size={14} />
              Request Redo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
