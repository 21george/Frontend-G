"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCreateWorkoutPlan, useClients } from "@/lib/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  Video as VideoIcon,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { DAYS } from "@/lib/utils";
import { safeHref } from "@/lib/safeHref";
import ExercisePicker from "@/components/ExercisePicker";
import type { ExerciseLibraryItem } from "@/lib/api/services/exercises";

/* ═══════════════════════════════════════════════════════════════════
   VIDEO EMBED HELPERS
   ═══════════════════════════════════════════════════════════════════ */

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  );
  return match?.[1] ?? null;
}

function isValidVideoUrl(url: string): boolean {
  if (!url) return false;
  // Anchor the regex: only accept a URL whose host (or first label
  // for youtu.be) IS the video domain. A bare substring match would
  // let `javascript:alert(1)//youtube.com` pass.
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return (
      host === "youtube.com" ||
      host === "www.youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtu.be" ||
      host === "vimeo.com" ||
      host === "www.vimeo.com" ||
      host === "player.vimeo.com" ||
      host === "dailymotion.com" ||
      host === "www.dailymotion.com"
    );
  } catch {
    return false;
  }
}

function VideoEmbed({ url }: { url: string }) {
  const youtubeId = getYouTubeId(url);

  if (youtubeId) {
    return (
      <div className=" overflow-hidden border border-[var(--border)]">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title="Exercise video"
          className="w-min h-min"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Generic video link fallback. The href is gated through safeHref
  // so a coach who somehow bypasses isValidVideoUrl (e.g. via a video
  // URL on a redirector domain) still cannot XSS via javascript:.
  const safeUrl = safeHref(url);
  if (!safeUrl) return null;
  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
    >
      <VideoIcon className="w-4 h-4" />
      <span className="truncate flex-1">{url}</span>
      <ExternalLink className="w-3 h-3 flex-shrink-0" />
    </a>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════ */

const emptyExercise = {
  name: "",
  sets: 3,
  reps: "10",
  rest_seconds: 60,
  notes: "",
  video_url: "",
  exercise_id: "",
  exercise_name: "",
  exercise_images: [] as string[],
  exercise_description: "",
  exercise_equipment: [] as string[],
  exercise_muscles: [] as string[],
};

export default function NewWorkoutPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultClient = searchParams.get("client") ?? "";
  const createPlan = useCreateWorkoutPlan();
  const { data: clientsData } = useClients();
  const clients = clientsData?.data ?? [];

  const [days, setDays] = useState<
    { day: string; exercises: (typeof emptyExercise)[] }[]
  >([{ day: "monday", exercises: [{ ...emptyExercise }] }]);
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState(defaultClient);
  const [weekStart, setWeekStart] = useState("");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{ di: number; ei: number } | null>(null);

  const addDay = () => {
    const used = days.map((d) => d.day);
    const next = DAYS.find((d) => !used.includes(d));
    if (next)
      setDays([...days, { day: next, exercises: [{ ...emptyExercise }] }]);
  };

  const removeDay = (i: number) => setDays(days.filter((_, idx) => idx !== i));
  const addExercise = (di: number) =>
    setDays(
      days.map((d, i) =>
        i === di
          ? { ...d, exercises: [...d.exercises, { ...emptyExercise }] }
          : d,
      ),
    );
  const removeExercise = (di: number, ei: number) =>
    setDays(
      days.map((d, i) =>
        i === di
          ? { ...d, exercises: d.exercises.filter((_, j) => j !== ei) }
          : d,
      ),
    );

  const updateDay = (di: number, field: string, value: string) =>
    setDays(days.map((d, i) => (i === di ? { ...d, [field]: value } : d)));

  const updateExercise = (di: number, ei: number, field: string, value: any) =>
    setDays(
      days.map((d, i) =>
        i === di
          ? {
              ...d,
              exercises: d.exercises.map((e, j) =>
                j === ei ? { ...e, [field]: value } : e,
              ),
            }
          : d,
      ),
    );

  const openPicker = (di: number, ei: number) => {
    setPickerTarget({ di, ei });
    setPickerOpen(true);
  };

  const handlePickExercise = (ex: ExerciseLibraryItem) => {
    if (!pickerTarget) return;
    const { di, ei } = pickerTarget;
    updateExercise(di, ei, "name", ex.name);
    updateExercise(di, ei, "exercise_id", ex.id);
    updateExercise(di, ei, "exercise_name", ex.name);
    updateExercise(di, ei, "exercise_images", ex.images);
    updateExercise(di, ei, "exercise_description", ex.description);
    updateExercise(di, ei, "exercise_equipment", ex.equipment);
    updateExercise(di, ei, "exercise_muscles", ex.muscles);
    setPickerOpen(false);
    setPickerTarget(null);
  };

  const handleSubmit = async (
    e: React.FormEvent,
    saveMode: "assign" | "save",
  ) => {
    e.preventDefault();
    setLoading(true);
    try {
      const planStatus = saveMode === "save" ? "draft" : status;
      const payload: any = {
        title,
        week_start: weekStart || undefined,
        status: planStatus,
        days,
        notes,
      };
      if (saveMode === "assign" && clientId) {
        payload.client_id = clientId;
      }
      await createPlan.mutateAsync(payload);
      router.push("/workout-plans");
    } catch {
      // Error toast is handled by useToastMutation
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div>
        <Link
          href="/workout-plans"
          className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6"
        >
          <ArrowLeft className="w-3 h-3" /> Back
        </Link>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)] mb-6">
          New Workout Plan
        </h1>

        <form className="space-y-6">
          <div className="bg-[var(--bg-card)] p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Plan Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="Week 1 — Strength"
                required
              />
            </div>
            <div>
              <label className="label">
                Client{" "}
                <span className="text-slate-400 font-normal">
                  (optional — leave empty to save as draft)
                </span>
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="input"
              >
                <option value="">Save without assigning…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Week Start</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input h-20 resize-none"
                placeholder="Plan notes…"
              />
            </div>
          </div>

          {/* Days */}
          <div className="space-y-4">
            {days.map((day, di) => (
              <div key={di} className="bg-[var(--bg-card)] p-3 sm:p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="label">Day</label>
                    <select
                      value={day.day}
                      onChange={(e) => updateDay(di, "day", e.target.value)}
                      className="input w-full sm:w-40 capitalize"
                    >
                      {DAYS.map((d) => (
                        <option key={d} value={d} className="capitalize">
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDay(di)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {day.exercises.map((ex, ei) => (
                    <div
                      key={ei}
                      className="bg-[var(--bg-subtle)] p-3 sm:p-4 rounded-lg border border-[var(--border)]"
                    >
                      {/* Exercise header row */}
                      <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-start mb-3">
                        <div className="col-span-2 sm:col-span-4">
                          <label className="label text-xs">Exercise Name</label>
                          <div className="flex gap-2">
                            <input
                              value={ex.name}
                              onChange={(e) =>
                                updateExercise(di, ei, "name", e.target.value)
                              }
                              className="input text-sm flex-1"
                              placeholder="Exercise name"
                            />
                            <button
                              type="button"
                              onClick={() => openPicker(di, ei)}
                              className="btn-secondary text-xs px-2 py-1 whitespace-nowrap"
                              title="Browse Exercise Library"
                            >
                              Browse
                            </button>
                          </div>
                        </div>
                        <div className="col-span-1 sm:col-span-1">
                          <label className="label text-xs">Sets</label>
                          <input
                            type="number"
                            value={ex.sets}
                            onChange={(e) =>
                              updateExercise(di, ei, "sets", +e.target.value)
                            }
                            className="input text-sm"
                            placeholder="Sets"
                            min="1"
                          />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                          <label className="label text-xs">Reps</label>
                          <input
                            value={ex.reps}
                            onChange={(e) =>
                              updateExercise(di, ei, "reps", e.target.value)
                            }
                            className="input text-sm"
                            placeholder="Reps"
                          />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                          <label className="label text-xs">Rest (s)</label>
                          <input
                            type="number"
                            value={ex.rest_seconds}
                            onChange={(e) =>
                              updateExercise(
                                di,
                                ei,
                                "rest_seconds",
                                +e.target.value,
                              )
                            }
                            className="input text-sm"
                            placeholder="Rest (s)"
                          />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                          <label className="label text-xs">Notes</label>
                          <input
                            value={ex.notes}
                            onChange={(e) =>
                              updateExercise(di, ei, "notes", e.target.value)
                            }
                            className="input text-sm"
                            placeholder="Notes"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1 flex sm:justify-end">
                          <button
                            type="button"
                            onClick={() => removeExercise(di, ei)}
                            className="text-red-400 hover:text-red-600 sm:mt-7 text-xs sm:text-base flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />{" "}
                            <span className="sm:hidden">Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* Exercise Library Preview */}
                      {ex.exercise_id && ex.exercise_images?.length > 0 && (
                        <div className="mt-2 flex items-start gap-3 p-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/20">
                          <img
                            src={ex.exercise_images[0]}
                            alt={ex.exercise_name || ex.name}
                            className="w-16 h-16 rounded object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                              {ex.exercise_name || ex.name}
                            </p>
                            {ex.exercise_muscles?.length > 0 && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{ex.exercise_muscles.slice(0, 3).join(", ")}</p>
                            )}
                            {ex.exercise_equipment?.length > 0 && (
                              <p className="text-[11px] text-slate-400">{ex.exercise_equipment.join(", ")}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Video URL */}
                      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
                        <VideoIcon className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <input
                          value={ex.video_url || ""}
                          onChange={(e) =>
                            updateExercise(di, ei, "video_url", e.target.value)
                          }
                          className="flex-1 bg-transparent text-xs text-[var(--text-secondary)] placeholder:text-slate-400 outline-none"
                          placeholder="Paste YouTube or video URL…"
                        />
                        {ex.video_url && (
                          <button
                            type="button"
                            onClick={() => window.open(ex.video_url, "_blank")}
                            className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Preview
                          </button>
                        )}
                      </div>

                      {/* Video Preview */}
                      {ex.video_url && isValidVideoUrl(ex.video_url) && (
                        <div className="mt-2">
                          <VideoEmbed url={ex.video_url} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addExercise(di)}
                  className="mt-3 flex items-center gap-1 text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)]"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Exercise
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={addDay}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Day
            </button>
            <button
              type="submit"
              onClick={(e) => handleSubmit(e, "save")}
              disabled={loading || !title.trim()}
              className="btn-secondary flex-1 py-3 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving…" : "Save as Draft"}
            </button>
            <button
              type="submit"
              onClick={(e) => handleSubmit(e, "assign")}
              disabled={loading || !title.trim() || !clientId}
              className="btn-primary flex-1 py-3 bg-brand-600 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? "Saving…" : "Assign to Client"}
            </button>
          </div>
        </form>
      </div>

      {pickerOpen && (
        <ExercisePicker
          onSelect={handlePickExercise}
          onClose={() => {
            setPickerOpen(false);
            setPickerTarget(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
