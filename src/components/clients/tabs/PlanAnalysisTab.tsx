"use client";

import { useState, useMemo } from "react";
import {
  useWorkoutAnalyses,
  useCreateWorkoutAnalysis,
  useApproveAnalysis,
  useRejectAnalysis,
  useAssignPlan,
} from "@/lib/hooks";
import {
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Dumbbell,
  TrendingUp,
  Flame,
  Trophy,
  Activity,
  Scale,
  ArrowRight,
} from "lucide-react";
import type {
  WorkoutAnalysis,
  WorkoutAnalysisListItem,
  PlanRecommendation,
  WorkoutMetrics,
} from "@/types";
import toast from "react-hot-toast";

interface Props {
  clientId: string;
}

/* ─── Metric badge ─────────────────────────────────────────────────────── */
function MetricBadge({
  Icon,
  label,
  value,
  unit,
  color,
}: {
  Icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5 p-3 border border-[var(--border)] dark:border-white/[0.06] bg-[var(--bg-subtle)] dark:bg-white/[0.02]">
      <div
        className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-md"
        style={{ background: `${color}1a` }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
          {label}
        </p>
        <p className="text-[14px] font-bold text-[var(--text-primary)]">
          {value}
          {unit && (
            <span className="text-[10px] font-normal text-[var(--text-tertiary)] ml-0.5">
              {unit}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

/* ─── Progress bar ─────────────────────────────────────────────────────── */
function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium text-[var(--text-secondary)]">{label}</span>
        <span className="text-[11px] font-bold" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

/* ─── Recommendation card ────────────────────────────────────────────── */
function RecommendationCard({
  rec,
  index,
  selected,
  onSelect,
}: {
  rec: PlanRecommendation;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const focusColors: Record<string, string> = {
    strength: "#3b82f6",
    hypertrophy: "#8b5cf6",
    endurance: "#10b981",
    rehab: "#f59e0b",
    maintenance: "#64748b",
  };
  const color = focusColors[rec.focus_area] || "#64748b";

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer border p-4 transition-all ${
        selected
          ? "border-[var(--energy)] dark:border-[var(--energy)] bg-[var(--energy)]/[0.04]"
          : "border-[var(--border)] dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12]"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <input
            type="radio"
            name="recommendation"
            checked={selected}
            onChange={onSelect}
            className="accent-[var(--energy)]"
          />
          <h4 className="text-[13px] font-semibold text-[var(--text-primary)]">
            {rec.plan_title}
          </h4>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: `${color}20`, color }}
        >
          {(rec.confidence * 100).toFixed(0)}% match
        </span>
      </div>
      <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mb-3">
        {rec.reasoning}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
        <span
          className="px-1.5 py-0.5 rounded border"
          style={{ borderColor: `${color}40`, color }}
        >
          {rec.focus_area}
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={10} />
          {rec.suggested_frequency_days_per_week} days/week · {rec.suggested_duration_weeks} weeks
        </span>
      </div>
      {rec.notes && (
        <p className="mt-2 text-[11px] text-[var(--text-tertiary)] italic">{rec.notes}</p>
      )}
    </div>
  );
}

/* ─── History item ─────────────────────────────────────────────────────── */
function HistoryItem({
  item,
  isExpanded,
  onToggle,
}: {
  item: WorkoutAnalysisListItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const statusConfig: Record<
    string,
    { label: string; bg: string; text: string }
  > = {
    pending: { label: "Pending Review", bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-300" },
    approved: { label: "Approved", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-300" },
    rejected: { label: "Rejected", bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-600 dark:text-red-300" },
    assigned: { label: "Assigned", bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-300" },
  };
  const cfg = statusConfig[item.status] || statusConfig.pending;

  return (
    <div className="border border-[var(--border)] dark:border-white/[0.06] bg-[var(--bg-card)]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
          </span>
          <span className="text-[12px] text-[var(--text-secondary)]">
            {new Date(item.generated_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {isExpanded && item.metrics && (
        <div className="px-3 pb-3 pt-1 border-t border-[var(--border)] dark:border-white/[0.06]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            <MetricBadge
              Icon={Activity}
              label="Completion"
              value={`${(item.metrics.completion_rate * 100).toFixed(0)}%`}
              color="#3b82f6"
            />
            <MetricBadge
              Icon={Flame}
              label="Consistency"
              value={item.metrics.consistency_score}
              unit="/100"
              color="#f97316"
            />
            <MetricBadge
              Icon={TrendingUp}
              label="Progression"
              value={item.metrics.progression_score}
              unit="/100"
              color="#8b5cf6"
            />
            <MetricBadge
              Icon={Trophy}
              label="PRs (30d)"
              value={item.metrics.pr_count_30d}
              color="#10b981"
            />
          </div>
          {item.coach_notes && (
            <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">
              Coach notes: {item.coach_notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────────────── */
export function PlanAnalysisTab({ clientId }: Props) {
  const { data, isLoading } = useWorkoutAnalyses(clientId);
  const createAnalysis = useCreateWorkoutAnalysis();
  const approve = useApproveAnalysis();
  const reject = useRejectAnalysis();
  const assign = useAssignPlan();

  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [selectedRecIndex, setSelectedRecIndex] = useState<number | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [pendingAnalysisId, setPendingAnalysisId] = useState<string | null>(null);

  const analyses = data?.data ?? [];
  const latestAnalysis: WorkoutAnalysis | undefined = useMemo(() => {
    const full = analyses.find((a) => a.status === "pending") as WorkoutAnalysis | undefined;
    return full;
  }, [analyses]);

  const history = analyses.slice(latestAnalysis ? 1 : 0);

  const handleTrigger = async () => {
    try {
      await createAnalysis.mutateAsync(clientId);
      toast.success("Analysis generated successfully");
    } catch {
      // toast handled by mutation
    }
  };

  const handleApprove = async (analysisId: string) => {
    try {
      await approve.mutateAsync({ clientId, analysisId });
    } catch {
      // toast handled by mutation
    }
  };

  const openReject = (analysisId: string) => {
    setPendingAnalysisId(analysisId);
    setRejectModalOpen(true);
    setRejectNotes("");
  };

  const handleReject = async () => {
    if (!pendingAnalysisId) return;
    try {
      await reject.mutateAsync({
        clientId,
        analysisId: pendingAnalysisId,
        notes: rejectNotes || undefined,
      });
      setRejectModalOpen(false);
      setPendingAnalysisId(null);
    } catch {
      // toast handled by mutation
    }
  };

  const handleAssign = async (analysisId: string) => {
    if (selectedRecIndex == null) {
      toast.error("Select a recommendation first");
      return;
    }
    try {
      await assign.mutateAsync({
        clientId,
        analysisId,
        payload: {
          selected_recommendation_index: selectedRecIndex,
        },
      });
      setSelectedRecIndex(null);
    } catch {
      // toast handled by mutation
    }
  };

  const hasPending = analyses.some((a) => a.status === "pending");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <BrainCircuit size={16} className="text-[var(--energy)]" />
          Plan Analysis
        </h3>
        <button
          onClick={handleTrigger}
          disabled={hasPending || createAnalysis.isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--btn-bg)] text-[var(--btn-text)] text-xs font-semibold hover:bg-[var(--btn-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createAnalysis.isPending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <BarChart3 size={13} />
          )}
          {hasPending ? "Pending Review Exists" : "Run New Analysis"}
        </button>
      </div>

      {/* ── Latest Analysis ─────────────────────────────────────────────── */}
      {latestAnalysis ? (
        <div className="space-y-5">
          {/* Metrics card */}
          <div className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Latest Analysis Metrics
              </p>
              <span className="text-[10px] text-[var(--text-tertiary)]">
                {new Date(latestAnalysis.generated_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <MetricBadge
                Icon={Activity}
                label="Completion"
                value={`${(latestAnalysis.metrics.completion_rate * 100).toFixed(0)}%`}
                color="#3b82f6"
              />
              <MetricBadge
                Icon={Flame}
                label="Consistency"
                value={latestAnalysis.metrics.consistency_score}
                unit="/100"
                color="#f97316"
              />
              <MetricBadge
                Icon={TrendingUp}
                label="Progression"
                value={latestAnalysis.metrics.progression_score}
                unit="/100"
                color="#8b5cf6"
              />
              <MetricBadge
                Icon={Trophy}
                label="PRs (30d)"
                value={latestAnalysis.metrics.pr_count_30d}
                color="#10b981"
              />
              <MetricBadge
                Icon={Dumbbell}
                label="Total Volume"
                value={latestAnalysis.metrics.total_volume_lifted_kg}
                unit="kg"
                color="#6366f1"
              />
              <MetricBadge
                Icon={Calendar}
                label="Streak"
                value={latestAnalysis.metrics.streak_days}
                unit="days"
                color="#ec4899"
              />
              <MetricBadge
                Icon={Scale}
                label="Weight Δ"
                value={
                  latestAnalysis.metrics.body_weight_change_kg != null
                    ? `${latestAnalysis.metrics.body_weight_change_kg > 0 ? "+" : ""}${latestAnalysis.metrics.body_weight_change_kg}`
                    : "—"
                }
                unit="kg"
                color="#14b8a6"
              />
              <MetricBadge
                Icon={Activity}
                label="Body Fat Δ"
                value={
                  latestAnalysis.metrics.body_fat_change_pct != null
                    ? `${latestAnalysis.metrics.body_fat_change_pct > 0 ? "+" : ""}${latestAnalysis.metrics.body_fat_change_pct}`
                    : "—"
                }
                unit="%"
                color="#f59e0b"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border)] dark:border-white/[0.06]">
              <ScoreBar label="Consistency" value={latestAnalysis.metrics.consistency_score} />
              <ScoreBar label="Progression" value={latestAnalysis.metrics.progression_score} />
            </div>
          </div>

          {/* Recommendations */}
          {(latestAnalysis.recommendations ?? []).length > 0 && (
            <div className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-5 space-y-3">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                AI Recommendations
              </p>
              <div className="space-y-3">
                {(latestAnalysis.recommendations ?? []).map((rec, i) => (
                  <RecommendationCard
                    key={i}
                    rec={rec}
                    index={i}
                    selected={selectedRecIndex === i}
                    onSelect={() => setSelectedRecIndex(i)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Coach Action Bar */}
          {latestAnalysis.status === "pending" && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleApprove(latestAnalysis.id)}
                disabled={approve.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {approve.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={13} />
                )}
                Approve
              </button>
              <button
                onClick={() => openReject(latestAnalysis.id)}
                disabled={reject.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-300 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {reject.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <XCircle size={13} />
                )}
                Reject
              </button>
              <button
                onClick={() => handleAssign(latestAnalysis.id)}
                disabled={assign.isPending || selectedRecIndex == null}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--btn-bg)] text-[var(--btn-text)] text-xs font-semibold hover:bg-[var(--btn-hover)] transition-colors disabled:opacity-50"
              >
                {assign.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                Assign Plan
                {selectedRecIndex != null && (
                  <span className="ml-1 text-[10px] opacity-80">
                    (#{selectedRecIndex + 1})
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-8 text-center space-y-3">
          <BrainCircuit size={28} className="mx-auto text-slate-300 dark:text-slate-700" />
          <p className="text-[13px] font-medium text-[var(--text-secondary)]">
            No workout analysis yet
          </p>
          <p className="text-[12px] text-[var(--text-tertiary)] max-w-sm mx-auto">
            Run an analysis to get AI-generated insights and recommendations based on this client&apos;s workout history, measurements, and goals.
          </p>
          <button
            onClick={handleTrigger}
            disabled={createAnalysis.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--btn-bg)] text-[var(--btn-text)] text-xs font-semibold hover:bg-[var(--btn-hover)] transition-colors disabled:opacity-50"
          >
            {createAnalysis.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <ArrowRight size={13} />
            )}
            Run First Analysis
          </button>
        </div>
      )}

      {/* ── History Timeline ────────────────────────────────────────────── */}
      {history.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Past Analyses
          </p>
          <div className="space-y-2">
            {history.map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                isExpanded={expandedHistoryId === item.id}
                onToggle={() =>
                  setExpandedHistoryId(
                    expandedHistoryId === item.id ? null : item.id,
                  )
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Reject Modal ────────────────────────────────────────────────── */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setRejectModalOpen(false)}
          />
          <div className="relative bg-[var(--bg-card)] border border-[var(--border)] w-full max-w-md rounded-xl p-5 shadow-xl">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
              Reject Analysis
            </h3>
            <p className="text-[12px] text-[var(--text-secondary)] mb-3">
              Add optional notes explaining why this analysis was rejected.
            </p>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={3}
              placeholder="Coach notes..."
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30 resize-none"
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] border border-[var(--border)] rounded hover:bg-[var(--bg-subtle)]"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={reject.isPending}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold hover:bg-red-700 rounded transition-colors disabled:opacity-50"
              >
                {reject.isPending ? (
                  <Loader2 size={12} className="animate-spin inline mr-1" />
                ) : null}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
