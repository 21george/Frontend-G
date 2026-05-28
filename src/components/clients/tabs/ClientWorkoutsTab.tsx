"use client";

import {
  Plus,
  Dumbbell,
  Check,
  CheckCircle2,
  ExternalLink,
  Video,
  ImageIcon,
  Clock,
  ChevronDown,
  Trash2,
  Loader2,
  Play,
} from "lucide-react";
import Link from "next/link";
import type {
  PaginatedResponse,
  WorkoutPlan,
  WorkoutLogDetailed,
  Exercise,
} from "@/types";
import type {
  ClientWorkoutProgress,
  WorkoutProgressPlan,
  WorkoutProgressDay,
} from "@/lib/api/services/media";
import { getWorkoutCategory, CATEGORY_CONFIG } from "@/lib/workoutCategories";
import { DailyProtocol } from "@/components/clients/DailyProtocol";
import { formatDate, timeAgo } from "@/lib/utils";

interface Props {
  clientId: string;
  plans: PaginatedResponse<WorkoutPlan> | undefined;
  workoutProgress: ClientWorkoutProgress | undefined;
  workoutLogs: WorkoutLogDetailed[] | undefined;
  completedDaysMap: Record<string, boolean>;
  expandedPlan: string | null;
  setExpandedPlan: (id: string | null) => void;
  expandedLog: string | null;
  setExpandedLog: (id: string | null) => void;
  onDeleteWorkout: (plan: WorkoutPlan) => void;
  isDeleteWorkoutPending: boolean;
}

function ExerciseBadge({ ex, color }: { ex: Exercise; color: string }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-[var(--bg-subtle)] dark:bg-white/[0.02] border border-[var(--border)] dark:border-white/[0.05]">
      <div
        className="w-1.5 h-1.5 flex-shrink-0"
        style={{ background: color }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-[var(--text-secondary)] dark:text-[var(--text-tertiary)] truncate">
          {ex.name}
        </p>
        <p className="text-[10px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
          {ex.sets}×{ex.reps}
          {ex.rest_seconds ? ` · ${ex.rest_seconds}s` : ""}
        </p>
      </div>
      {ex.demo_video_url && (
        <a
          href={ex.demo_video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-blue-500 hover:text-blue-300 transition-colors"
        >
          <Video size={11} />
        </a>
      )}
    </div>
  );
}

function DayBlock({
  day,
  planId,
  completedDaysMap,
  idx,
}: {
  day: WorkoutProgressDay;
  planId: string;
  completedDaysMap: Record<string, boolean>;
  idx: number;
}) {
  const dayCategory = getWorkoutCategory(day.exercises ?? []);
  const dayCfg = CATEGORY_CONFIG[dayCategory];
  const isCompleted =
    completedDaysMap[`${planId}-${day.day.toLowerCase()}`] ??
    day.is_completed ??
    false;
  return (
    <div className="p-4 sm:px-5">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: dayCfg.bg }}
        >
          {dayCfg.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-medium text-[var(--text-primary)] dark:text-[var(--text-primary)]">
              {day.day}
            </p>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-s-xl"
              style={{ color: dayCfg.color, background: dayCfg.bg }}
            >
              {dayCfg.label}
            </span>
            {isCompleted && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5">
                <CheckCircle2 size={9} /> Completed
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
            {day.exercises?.length ?? 0} exercises
          </p>
        </div>
        <div
          className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 ${isCompleted ? "border-emerald-400 bg-emerald-400/10" : "border-[var(--border)] dark:border-white/10"}`}
        >
          {isCompleted && <Check size={10} className="text-emerald-400" />}
        </div>
      </div>
      {day.exercises?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-12">
          {day.exercises.map((ex, ei) => (
            <ExerciseBadge key={ei} ex={ex} color={dayCfg.color} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function WorkoutPlanCard({
  plan,
  completedDaysMap,
  expandedPlan,
  setExpandedPlan,
  onDeleteWorkout,
  isDeleteWorkoutPending,
}: {
  plan: WorkoutPlan;
  completedDaysMap: Record<string, boolean>;
  expandedPlan: string | null;
  setExpandedPlan: (id: string | null) => void;
  onDeleteWorkout: (plan: WorkoutPlan) => void;
  isDeleteWorkoutPending: boolean;
}) {
  const allExercises = plan.days?.flatMap((d) => d.exercises ?? []) ?? [];
  const planCategory = getWorkoutCategory(allExercises);
  const catCfg = CATEGORY_CONFIG[planCategory];
  const isExpanded = expandedPlan === plan.id;
  const totalExercises = allExercises.length;
  const completedDays =
    plan.days?.filter(
      (d) => completedDaysMap[`${plan.id}-${d.day.toLowerCase()}`],
    ).length ?? 0;
  const totalDays = plan.days?.length ?? 0;

  return (
    <div
      className={`transition-all overflow-hidden ${isExpanded ? "border-blue-300 dark:border-blue-700/50" : "border-[var(--border)] dark:border-white/[0.07]"} bg-[var(--bg-card)]`}
    >
      <div className="flex flex-col gap-3 p-4 sm:p-5 bg-[var(--bg-card)]">
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className="w-10 h-10 flex items-center justify-center flex-shrink-0 text-xl"
            style={{ background: catCfg.bg }}
          >
            {catCfg.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[14px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)] leading-snug">
                {plan.title}
              </p>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5"
                style={{ color: catCfg.color, background: catCfg.bg }}
              >
                {catCfg.label}
              </span>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)] mt-0.5 line-clamp-1">
              Week of {formatDate(plan.week_start, "MMM d, yyyy")} · {totalDays}{" "}
              days · {totalExercises} exercises
              {completedDays > 0 &&
                ` · ${completedDays}/${totalDays} completed`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <span
              className={`inline-flex rounded-8 items-center gap-1 px-2.5 py-1 text-[11px] font-semibold ${
                plan.status === "active"
                  ? "bg-emerald-100 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400"
                  : plan.status === "completed"
                    ? "bg-blue-100 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400"
                    : "bg-[var(--bg-subtle)] dark:bg-white/[0.06] text-[var(--text-secondary)] dark:text-[var(--text-tertiary)]"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${plan.status === "active" ? "bg-emerald-500" : plan.status === "completed" ? "bg-blue-500" : "bg-slate-400"}`}
              />
              {plan.status}
            </span>
            <button
              onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
              className="hidden sm:flex items-center rounded-s-xl gap-1 px-3 py-1.5 border border-[var(--border)] dark:border-white/[0.08] bg-[var(--bg-card)] dark:bg-white/[0.03] text-[11px] font-semibold text-[var(--text-secondary)] dark:text-[var(--text-tertiary)] hover:bg-[#13131314] dark:hover:bg-white/[0.06] transition-colors"
            >
              View Details
              <ChevronDown
                size={12}
                className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
              />
            </button>
            <button
              onClick={() => onDeleteWorkout(plan)}
              disabled={isDeleteWorkoutPending}
              className="w-8 h-8  border-[var(--border)] dark:border-white/[0.08] flex items-center justify-center text-[var(--text-tertiary)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {isDeleteWorkoutPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          </div>
        </div>
        <button
          onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
          className="sm:hidden flex items-center justify-center gap-1 px-3 py-1.5 rounded-s-xl border border-[var(--border)] dark:border-white/[0.08] bg-[var(--bg-card)] dark:bg-white/[0.03] text-[11px] font-semibold text-[var(--text-secondary)] dark:text-[var(--text-tertiary)]"
        >
          {isExpanded ? "Hide Details" : "View Details"}
          <ChevronDown
            size={12}
            className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-[var(--border)] dark:border-white/[0.06]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 sm:p-5 bg-[var(--bg-card)]">
            {[
              {
                label: "Week",
                value: formatDate(plan.week_start, "MMM d, yyyy"),
              },
              { label: "Days", value: `${totalDays} training days` },
              { label: "Exercises", value: `${totalExercises} total` },
              {
                label: "Progress",
                value: `${completedDays}/${totalDays} completed`,
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] font-semibold text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)] uppercase tracking-wider">
                  {label}
                </p>
                <p className="text-[13px] font-medium text-[var(--text-primary)] dark:text-white mt-0.5">
                  {value}
                </p>
              </div>
            ))}
          </div>
          {plan.notes && (
            <div className="mx-4 sm:mx-5 mb-4 p-3 ">
              <p className="text-[12px] font-semibold ">{plan.notes}</p>
            </div>
          )}
          {plan.days?.length ? (
            <div className="divide-y divide-slate-100 dark:divide-white/[0.04] bg-[var(--bg-card)]">
              {plan.days.map((day, idx) => {
                const dayCategory = getWorkoutCategory(day.exercises ?? []);
                const dayCfg = CATEGORY_CONFIG[dayCategory];
                const isCompleted =
                  completedDaysMap[`${plan.id}-${day.day.toLowerCase()}`] ??
                  false;
                return (
                  <div key={idx} className="p-4 sm:px-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-9 h-9 flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: dayCfg.bg }}
                      >
                        {dayCfg.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-medium text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                            {day.day}
                          </p>
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-s-xl"
                            style={{
                              color: dayCfg.color,
                              background: dayCfg.bg,
                            }}
                          >
                            {dayCfg.label}
                          </span>
                          {isCompleted && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5">
                              <CheckCircle2 size={9} /> Completed
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                          {day.exercises?.length ?? 0} exercises
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 ${isCompleted ? "border-emerald-400 bg-emerald-400/10" : "border-[var(--border)] dark:border-white/10"}`}
                      >
                        {isCompleted && (
                          <Check size={10} className="text-emerald-400" />
                        )}
                      </div>
                    </div>
                    {day.exercises?.length ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-12">
                        {day.exercises.map((ex, ei) => (
                          <div
                            key={ei}
                            className="flex items-center gap-2 p-2 bg-[var(--bg-subtle)] dark:bg-white/[0.02] border border-[var(--border)] dark:border-white/[0.05]"
                          >
                            <div
                              className="w-1.5 h-1.5 flex-shrink-0"
                              style={{ background: dayCfg.color }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] text-[var(--text-secondary)] dark:text-[var(--text-tertiary)] truncate">
                                {ex.name}
                              </p>
                              <p className="text-[10px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                                {ex.sets}×{ex.reps}
                                {ex.rest_seconds
                                  ? ` · ${ex.rest_seconds}s`
                                  : ""}
                              </p>
                            </div>
                            {ex.demo_video_url && (
                              <a
                                href={ex.demo_video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 text-blue-500 hover:text-blue-300 transition-colors"
                              >
                                <Video size={11} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center bg-[var(--bg-card)]">
              <p className="text-[12px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                No workout days defined
              </p>
            </div>
          )}
          <div className="border-t border-[var(--border)] dark:border-white/[0.06] p-4 sm:px-5 flex items-center justify-end gap-2 bg-[var(--bg-card)]">
            <Link
              href={`/workout-plans/${plan.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] rounded-s-xl font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/15 hover:bg-blue-100 dark:hover:bg-blue-900/25 transition-colors"
            >
              <ExternalLink size={12} /> Open Plan
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkoutLogCard({
  log,
  expandedLog,
  setExpandedLog,
}: {
  log: WorkoutLogDetailed;
  expandedLog: string | null;
  setExpandedLog: (id: string | null) => void;
}) {
  const isExpanded = expandedLog === log.id;
  const totalSets = (log.exercises ?? []).reduce(
    (acc, ex) => acc + (ex.sets_completed?.length ?? 0),
    0,
  );
  const totalVolume = (log.exercises ?? []).reduce(
    (acc, ex) =>
      acc +
      (ex.sets_completed ?? []).reduce(
        (s, set) => s + (set.kg ?? 0) * (set.reps_done ?? set.reps ?? 0),
        0,
      ),
    0,
  );
  const logMedia = log.media ?? [];
  const plannedExercises = log.planned_exercises ?? [];

  return (
    <div
      className={`border overflow-hidden transition-all ${isExpanded ? "border-blue-300 dark:border-blue-700/50" : "border-[var(--border)] dark:border-white/[0.07]"} bg-[var(--bg-card)]`}
    >
      <button
        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
        className="w-full flex items-center gap-4 p-4 hover:bg-[#13131314] dark:hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={16} className="text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)] truncate">
            {log.plan_title ?? "Workout"} — {log.day}
          </p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-[11px] text-[var(--text-tertiary)]">
              {log.exercises?.length ?? 0} exercises
            </span>
            <span className="text-[11px] text-[var(--text-tertiary)]">
              {totalSets} sets
            </span>
            {totalVolume > 0 && (
              <span className="text-[11px] text-[var(--text-tertiary)]">
                {Math.round(totalVolume).toLocaleString()} kg vol
              </span>
            )}
            {logMedia.length > 0 && (
              <span className="text-[11px] text-blue-400 flex items-center gap-0.5">
                <ImageIcon size={10} /> {logMedia.length} media
              </span>
            )}
          </div>
        </div>
        <span className="text-[11px] text-[var(--text-tertiary)] flex-shrink-0">
          {log.completed_at ? timeAgo(log.completed_at) : ""}
        </span>
        <ChevronDown
          size={14}
          className={`text-[var(--text-tertiary)] transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-[var(--border)] dark:border-white/[0.06]">
          <div className="p-4 space-y-4">
            {(log.exercises ?? []).map((ex: any, ei: number) => {
              const planned = plannedExercises.find(
                (pe: any) => pe.name === ex.name,
              );
              return (
                <div
                  key={ei}
                  className="border border-[var(--border)] dark:border-white/[0.05] bg-[var(--bg-page)] dark:bg-[var(--bg-page)] overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-3 border-b border-[var(--border)] dark:border-white/[0.04]">
                    <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/25 flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                        {ei + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[var(--text-primary)] dark:text-slate-200">
                        {ex.name}
                      </p>
                      {planned && (
                        <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                          Planned: {planned.sets}×{planned.reps}
                          {planned.rest_seconds
                            ? ` · ${planned.rest_seconds}s rest`
                            : ""}
                        </p>
                      )}
                    </div>
                    {planned?.demo_video_url && (
                      <a
                        href={planned.demo_video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-400 font-medium"
                      >
                        <Play size={10} /> Demo
                      </a>
                    )}
                  </div>
                  <div className="p-3 overflow-x-auto">
                    <div
                      className={`grid gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1 px-1 ${planned ? "grid-cols-5 min-w-[280px]" : "grid-cols-3 min-w-[180px]"}`}
                    >
                      <span>Set</span>
                      {planned && (
                        <>
                          <span className="text-[var(--text-tertiary)]">
                            Plan kg
                          </span>
                          <span className="text-[var(--text-tertiary)]">
                            Plan reps
                          </span>
                        </>
                      )}
                      <span className="text-blue-500">Actual kg</span>
                      <span className="text-blue-500">Actual reps</span>
                    </div>
                    {(ex.sets_completed ?? []).map((set: any, si: number) => (
                      <div
                        key={si}
                        className={`grid gap-1 text-[12px] px-1 py-1.5 ${si % 2 === 0 ? "bg-[var(--bg-card)] dark:bg-white/[0.02]" : ""} ${planned ? "grid-cols-5 min-w-[280px]" : "grid-cols-3 min-w-[180px]"}`}
                      >
                        <span className="text-[var(--text-tertiary)] font-medium">
                          {set.set_number}
                        </span>
                        {planned && (
                          <>
                            <span className="text-[var(--text-tertiary)]">
                              —
                            </span>
                            <span className="text-[var(--text-tertiary)]">
                              {planned.reps}
                            </span>
                          </>
                        )}
                        <span className="text-[var(--text-primary)] dark:text-slate-200 font-semibold">
                          {set.kg ?? 0}
                        </span>
                        <span className="text-[var(--text-primary)] dark:text-slate-200 font-semibold">
                          {set.reps_done ?? set.reps ?? 0}
                        </span>
                      </div>
                    ))}
                  </div>
                  {planned?.notes && (
                    <div className="px-3 pb-3">
                      <p className="text-[10px] text-[var(--text-tertiary)] font-medium">
                        Coach note:
                      </p>
                      <p className="text-[11px] text-[var(--text-tertiary)] italic">
                        {planned.notes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            {log.notes && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/20">
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mb-1">
                  Client Notes
                </p>
                <p className="text-[12px] text-amber-800 dark:text-amber-300">
                  {log.notes}
                </p>
              </div>
            )}
            {logMedia.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                  Media Uploads
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {logMedia.map((m: any) => (
                    <a
                      key={m.id}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square bg-[var(--bg-subtle)] dark:bg-[var(--bg-subtle)] border border-[var(--border)] dark:border-white/[0.06] flex items-center justify-center overflow-hidden hover:border-blue-300 dark:hover:border-blue-700/50 transition-colors"
                    >
                      {m.type === "video" ? (
                        <>
                          <Video className="w-6 h-6 text-[var(--text-tertiary)]" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play size={18} className="text-white" />
                          </div>
                        </>
                      ) : m.url ? (
                        <img
                          src={m.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-[var(--text-tertiary)]" />
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ClientWorkoutsTab({
  clientId,
  plans,
  workoutProgress,
  workoutLogs,
  completedDaysMap,
  expandedPlan,
  setExpandedPlan,
  expandedLog,
  setExpandedLog,
  onDeleteWorkout,
  isDeleteWorkoutPending,
}: Props) {
  return (
    <div className="space-y-5">
      <DailyProtocol plans={plans} completedDaysMap={completedDaysMap} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
            Workout Plans
          </h3>
          <p className="text-[12px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)] mt-0.5">
            {workoutProgress
              ? `${workoutProgress.stats.in_progress_count} in progress · ${workoutProgress.stats.completed_count} completed`
              : `${(plans?.data ?? []).length} plans assigned to this client`}
          </p>
        </div>
        <Link
          href={`/workout-plans/new?client=${clientId}`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-s-xl text-[12px] font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors self-start sm:self-auto"
        >
          <Plus size={14} /> New Plan
        </Link>
      </div>

      {/*  {(plans?.data ?? []).length === 0 ? (
        <div className="border-2 border-dashed border-[var(--border)] dark:border-white/[0.08] bg-[var(--bg-card)] dark:bg-transparent p-12 text-center">
          <Dumbbell className="w-10 h-10 mx-auto mb-3 text-[var(--text-tertiary)] dark:text-[var(--text-secondary)]" />
          <p className="text-[14px] font-medium text-[var(--text-secondary)] dark:text-[var(--text-secondary)] mb-1">
            No workout plans yet
          </p>
          <p className="text-[12px] text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)] mb-5">
            Create a new plan to get started
          </p>
          <Link
            href={`/workout-plans/new?client=${clientId}`}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-s-xl text-[12px] font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors"
          >
            <Plus size={14} /> Create First Plan
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(plans?.data ?? []).map((plan) => (
            <WorkoutPlanCard
              key={plan.id}
              plan={plan}
              completedDaysMap={completedDaysMap}
              expandedPlan={expandedPlan}
              setExpandedPlan={setExpandedPlan}
              onDeleteWorkout={onDeleteWorkout}
              isDeleteWorkoutPending={isDeleteWorkoutPending}
            />
          ))}
        </div>
    )}*/}

      {/* In Progress */}
      {workoutProgress && workoutProgress.in_progress.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2" />
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
              In Progress
            </h3>
            <span className="text-[11px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
              ({workoutProgress.in_progress.length})
            </span>
          </div>
          <div className="space-y-2">
            {workoutProgress.in_progress.map((plan: WorkoutProgressPlan) => {
              const isExpanded = expandedPlan === plan.id;
              const allExercises =
                plan.days?.flatMap((d) => d.exercises ?? []) ?? [];
              const planCategory = getWorkoutCategory(allExercises);
              const catCfg = CATEGORY_CONFIG[planCategory];
              return (
                <div
                  key={plan.id}
                  className={` overflow-hidden transition-all ${isExpanded ? "border-blue-300 dark:border-blue-700/50" : "border-[var(--border)] dark:border-white/[0.07]"} bg-[var(--bg-card)]`}
                >
                  <button
                    onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-[#13131314] dark:hover:bg-white/[0.02] transition-colors text-left"
                  >
                    <div
                      className="w-9 h-9  flex items-center justify-center flex-shrink-0"
                      style={isExpanded ? { background: catCfg.bg } : undefined}
                    >
                      {isExpanded ? (
                        <span className="text-lg">{catCfg.icon}</span>
                      ) : (
                        <Dumbbell size={17} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)] truncate">
                        {plan.title}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                        {plan.completed_days}/{plan.total_days} days ·{" "}
                        {plan.progress_pct}% complete · {allExercises.length}{" "}
                        exercises
                      </p>
                    </div>
                    <div className="w-20 flex-shrink-0">
                      <div className="h-1.5 w-full bg-[var(--bg-subtle)] dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 transition-all"
                          style={{ width: `${plan.progress_pct}%` }}
                        />
                      </div>
                    </div>
                    <Link
                      href={`/workout-plans/${plan.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 hover:bg-[#13131314] dark:hover:bg-white/[0.06] transition-colors flex-shrink-0"
                    >
                      <ExternalLink
                        size={14}
                        className="text-[var(--text-tertiary)]"
                      />
                    </Link>
                    <ChevronDown
                      size={14}
                      className={`text-[var(--text-tertiary)] transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="border-t border-[var(--border)] dark:border-white/[0.06]">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 sm:p-5 bg-[var(--bg-card)]">
                        {[
                          {
                            label: "Week",
                            value: plan.week_start
                              ? formatDate(plan.week_start, "MMM d, yyyy")
                              : "—",
                          },
                          {
                            label: "Days",
                            value: `${plan.total_days} training days`,
                          },
                          {
                            label: "Exercises",
                            value: `${allExercises.length} total`,
                          },
                          {
                            label: "Progress",
                            value: `${plan.completed_days}/${plan.total_days} completed`,
                          },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-[11px] font-semibold text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)] uppercase tracking-wider">
                              {label}
                            </p>
                            <p className="text-[13px] font-medium text-[var(--text-primary)] dark:text-white mt-0.5">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                      {plan.days?.length ? (
                        <div className="divide-y divide-slate-100 dark:divide-white/[0.04] bg-[var(--bg-card)]">
                          {plan.days.map((day, idx) => (
                            <DayBlock
                              key={idx}
                              day={day}
                              planId={plan.id}
                              completedDaysMap={completedDaysMap}
                              idx={idx}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center bg-[var(--bg-card)]">
                          <p className="text-[12px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                            No workout days defined
                          </p>
                        </div>
                      )}
                      <div className="border-t border-[var(--border)] dark:border-white/[0.06] p-4 sm:px-5 flex items-center justify-end gap-2 bg-[var(--bg-card)]">
                        <Link
                          href={`/workout-plans/${plan.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] rounded-s-xl font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/15 hover:bg-blue-100 dark:hover:bg-blue-900/25 transition-colors"
                        >
                          <ExternalLink size={12} /> Open Plan
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed */}
      {workoutProgress && workoutProgress.completed.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-emerald-400" />
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
              Completed
            </h3>
            <span className="text-[11px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
              ({workoutProgress.completed.length})
            </span>
          </div>
          <div className="space-y-2">
            {workoutProgress.completed.map((plan: WorkoutProgressPlan) => {
              const isExpanded = expandedPlan === plan.id;
              const allExercises =
                plan.days?.flatMap((d) => d.exercises ?? []) ?? [];
              const planCategory = getWorkoutCategory(allExercises);
              const catCfg = CATEGORY_CONFIG[planCategory];
              return (
                <div
                  key={plan.id}
                  className={`border overflow-hidden transition-all ${isExpanded ? "border-blue-300 dark:border-blue-700/50" : "border-[var(--border)] dark:border-white/[0.07]"} bg-[var(--bg-card)]`}
                >
                  <button
                    onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-[#13131314] dark:hover:bg-white/[0.02] transition-colors text-left"
                  >
                    <div
                      className="w-9 h-9 flex items-center justify-center flex-shrink-0"
                      style={isExpanded ? { background: catCfg.bg } : undefined}
                    >
                      {isExpanded ? (
                        <span className="text-lg">{catCfg.icon}</span>
                      ) : (
                        <CheckCircle2
                          size={14}
                          className="text-emerald-600 dark:text-emerald-400"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)] truncate">
                        {plan.title}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                        {plan.total_days} days · 100% complete ·{" "}
                        {allExercises.length} exercises
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/20 px-2 py-0.5 flex-shrink-0">
                      ✓ Done
                    </span>
                    <Link
                      href={`/workout-plans/${plan.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 hover:bg-[#13131314] dark:hover:bg-white/[0.06] transition-colors flex-shrink-0"
                    >
                      <ExternalLink
                        size={14}
                        className="text-[var(--text-tertiary)]"
                      />
                    </Link>
                    <ChevronDown
                      size={14}
                      className={`text-[var(--text-tertiary)] transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="border-t border-[var(--border)] dark:border-white/[0.06]">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 sm:p-5 bg-[var(--bg-card)]">
                        {[
                          {
                            label: "Week",
                            value: plan.week_start
                              ? formatDate(plan.week_start, "MMM d, yyyy")
                              : "—",
                          },
                          {
                            label: "Days",
                            value: `${plan.total_days} training days`,
                          },
                          {
                            label: "Exercises",
                            value: `${allExercises.length} total`,
                          },
                          { label: "Status", value: "All days completed" },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-[11px] font-semibold text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)] uppercase tracking-wider">
                              {label}
                            </p>
                            <p className="text-[13px] font-medium text-[var(--text-primary)] dark:text-white mt-0.5">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                      {plan.days?.length ? (
                        <div className="divide-y divide-slate-100 dark:divide-white/[0.04] bg-[var(--bg-card)]">
                          {plan.days.map((day, idx) => (
                            <DayBlock
                              key={idx}
                              day={day}
                              planId={plan.id}
                              completedDaysMap={completedDaysMap}
                              idx={idx}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center bg-[var(--bg-card)]">
                          <p className="text-[12px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                            No workout days defined
                          </p>
                        </div>
                      )}
                      <div className="border-t border-[var(--border)] dark:border-white/[0.06] p-4 sm:px-5 flex items-center justify-end gap-2 bg-[var(--bg-card)]">
                        <Link
                          href={`/workout-plans/${plan.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] rounded-s-xl font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/15 hover:bg-blue-100 dark:hover:bg-blue-900/25 transition-colors"
                        >
                          <ExternalLink size={12} /> Open Plan
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Workout History */}
      <div className="mt-8">
        <h3 className="text-[14px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)] mb-4">
          Workout History
        </h3>
        {(workoutLogs ?? []).length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-[var(--text-secondary)]" />
            <p className="text-[13px] text-[var(--text-tertiary)]">
              No workouts logged yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(workoutLogs ?? []).map((log: any) => (
              <WorkoutLogCard
                key={log.id}
                log={log}
                expandedLog={expandedLog}
                setExpandedLog={setExpandedLog}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
