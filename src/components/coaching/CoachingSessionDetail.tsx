"use client";

import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  User,
  FileText,
  Radio,
  XCircle,
  Edit3,
  Save,
  Loader2,
  Video,
  PhoneOff,
} from "lucide-react";
import {
  useCoachingSession,
  useUpdateSessionStatus,
  useSaveSessionNotes,
  useUpdateCoachingSession,
} from "@/lib/hooks";
import { parseDateValue } from "@/lib/utils";
import type { CoachingSessionStatus } from "@/types";

/* ── Status config ── */
const STATUS_CFG: Record<
  CoachingSessionStatus,
  { label: string; badge: string }
> = {
  live: {
    label: "Live Now",
    badge: "bg-green-500/15 text-green-400 border-green-500/20",
  },
  upcoming: {
    label: "Upcoming",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  },
  ended: {
    label: "Ended",
    badge: "bg-slate-500/15 text-[var(--text-tertiary)] border-slate-500/20",
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-red-500/15 text-red-400 border-red-500/20",
  },
};

/* ── Skeleton ── */
export function SessionDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-5 w-24 bg-slate-200 dark:bg-white/10 rounded" />
      <div className="h-8 w-64 bg-slate-200 dark:bg-white/10 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-white/[0.04]" />
        ))}
      </div>
      <div className="h-40 rounded-2xl bg-slate-100 dark:bg-white/[0.04]" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
interface Props {
  id: string;
  onClose?: () => void;
  onEnterVideoRoom?: () => void;
}

export function CoachingSessionDetail({ id, onClose, onEnterVideoRoom }: Props) {
  const qc = useQueryClient();
  const { data: session, isLoading } = useCoachingSession(id);
  const updateStatus = useUpdateSessionStatus();
  const updateSession = useUpdateCoachingSession();
  const saveNotes = useSaveSessionNotes(id);

  /* ── Notes state ── */
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const notesInitRef = useRef(false);

  /* ── Reschedule state ── */
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [newScheduledAt, setNewScheduledAt] = useState("");
  const [newDuration, setNewDuration] = useState(60);

  useEffect(() => {
    if (session && !notesInitRef.current) {
      setNotes(session.notes ?? "");
      notesInitRef.current = true;
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      const dt = parseDateValue(session.scheduled_at);
      setNewScheduledAt(dt ? new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
      setNewDuration(session.duration_min);
    }
  }, [session]);

  const handleGoLive = () => updateStatus.mutate({ id, status: "live" });

  const handleEndSession = () => updateStatus.mutate({ id, status: "ended" });

  const handleCancel = () => {
    if (confirm("Cancel this session? It will be marked as cancelled."))
      updateStatus.mutate({ id, status: "cancelled" });
  };

  const handleSaveNotes = () => {
    saveNotes.mutate(notes, { onSuccess: () => setEditingNotes(false) });
  };

  const submitReschedule = () => {
    if (!newScheduledAt) return;
    updateSession.mutate(
      { id, payload: { scheduled_at: new Date(newScheduledAt).toISOString(), duration_min: newDuration } },
      {
        onSuccess: () => {
          setEditingSchedule(false);
          qc.invalidateQueries({ queryKey: ["coaching-sessions", id] });
        },
      }
    );
  };

  if (isLoading) return <SessionDetailSkeleton />;

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--text-tertiary)]">
        <Video className="h-10 w-10 mb-3 opacity-30" />
        <p className="font-medium">Session not found</p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 text-sm text-cyan-500 hover:underline"
          >
            Back to sessions
          </button>
        )}
      </div>
    );
  }

  const cfg = STATUS_CFG[session.status];
  const dt = parseDateValue(session.scheduled_at);
  const isLive = session.status === "live";
  const isUpcoming = session.status === "upcoming";
  const isEnded = session.status === "ended" || session.status === "cancelled";

  return (
    <div className="space-y-6">
      {/* Back */}
      {onClose && (
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sessions
        </button>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.badge}`}
            >
              {isLive && (
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              )}
              {cfg.label}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {session.title}
          </h1>
          {session.description && (
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              {session.description}
            </p>
          )}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-2 min-w-[160px]">
          {isUpcoming && (
            <>
              <button
                onClick={handleGoLive}
                disabled={updateStatus.isPending}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-lg shadow-green-500/20"
              >
                {updateStatus.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Radio className="h-4 w-4" />
                )}
                Go Live
              </button>
              {!editingSchedule && (
                <button
                  onClick={() => setEditingSchedule(true)}
                  disabled={updateSession.isPending}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-500/20 text-amber-600 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                >
                  <CalendarDays className="h-4 w-4" />
                  Reschedule
                </button>
              )}
              <button
                onClick={handleCancel}
                disabled={updateStatus.isPending}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-orange-200 dark:border-orange-500/20 text-orange-600 text-sm font-medium hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Cancel Session
              </button>
            </>
          )}

          {isLive && (
            <>
              <button
                onClick={onEnterVideoRoom}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-cyan-500/20"
              >
                <Video className="h-4 w-4" />
                Enter Video Room
              </button>
              <button
                onClick={handleEndSession}
                disabled={updateStatus.isPending}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-500/20 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <PhoneOff className="h-4 w-4" />
                End Session
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Client */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-4 flex items-center gap-3">
          {session.client_photo ? (
            <img
              src={session.client_photo}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
              <User className="h-5 w-5 text-cyan-600" />
            </div>
          )}
          <div>
            <p className="text-xs text-[var(--text-tertiary)]">Client</p>
            <p className="font-semibold text-[var(--text-primary)]">
              {session.client_name}
            </p>
          </div>
        </div>

        {/* Time */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-4">
          <p className="text-xs text-[var(--text-tertiary)] mb-1">Scheduled</p>
          <p className="font-semibold text-[var(--text-primary)]">
            {dt ? format(dt, "MMM d, yyyy") : "—"}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            {dt ? format(dt, "h:mm a") : ""}
          </p>
        </div>

        {/* Duration */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-4">
          <p className="text-xs text-[var(--text-tertiary)] mb-1">Duration</p>
          <p className="font-semibold text-[var(--text-primary)] flex items-center gap-1">
            <Clock className="h-4 w-4 text-cyan-500" />
            {session.duration_min} min
          </p>
          {session.started_at && (
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Started {format(new Date(session.started_at), "h:mm a")}
            </p>
          )}
        </div>
      </div>

      {/* Reschedule form */}
      {isUpcoming && editingSchedule && (
        <div className="rounded-2xl border border-amber-100 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-amber-500" />
            Reschedule Session
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">New Date & Time</label>
              <input
                type="datetime-local"
                value={newScheduledAt}
                onChange={(e) => setNewScheduledAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Duration (minutes)</label>
              <select
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              >
                {[15, 30, 45, 60, 75, 90, 120].map((m) => (
                  <option key={m} value={m}>{m} minutes</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setEditingSchedule(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] text-sm font-medium text-[var(--text-secondary)] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
            >
              Discard
            </button>
            <button
              onClick={submitReschedule}
              disabled={updateSession.isPending || !newScheduledAt}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-lg shadow-cyan-500/20"
            >
              {updateSession.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
              ) : (
                <Save className="h-4 w-4 inline mr-1" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Agenda */}
      {session.agenda && (
        <div className="rounded-2xl border border-slate-100 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-cyan-500" />
            Session Agenda
          </h2>
          <pre className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap font-sans leading-relaxed">
            {session.agenda}
          </pre>
        </div>
      )}

      {/* Session Notes */}
      <div className="rounded-2xl border border-slate-100 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
            <Edit3 className="h-4 w-4 text-cyan-500" />
            Session Notes
          </h2>
          {!editingNotes ? (
            <button
              onClick={() => setEditingNotes(true)}
              className="text-xs text-cyan-500 hover:text-cyan-600 font-medium transition-colors"
            >
              {notes ? "Edit" : "Add notes"}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setNotes(session.notes ?? "");
                  setEditingNotes(false);
                }}
                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={saveNotes.isPending}
                className="flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-600 font-medium transition-colors"
              >
                {saveNotes.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                Save
              </button>
            </div>
          )}
        </div>

        {editingNotes ? (
          <textarea
            rows={8}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this session — observations, next steps, action items…"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 resize-none"
          />
        ) : notes ? (
          <pre className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap font-sans leading-relaxed">
            {notes}
          </pre>
        ) : (
          <p className="text-sm text-[var(--text-tertiary)] italic">
            No notes yet. Click &quot;Add notes&quot; to start.
          </p>
        )}
      </div>

      {/* Timeline (for ended sessions) */}
      {isEnded && (session.started_at || session.ended_at) && (
        <div className="rounded-2xl border border-slate-100 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-cyan-500" />
            Session Timeline
          </h2>
          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            {session.started_at && (
              <div className="flex justify-between">
                <span>Started</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {format(new Date(session.started_at), "MMM d, h:mm a")}
                </span>
              </div>
            )}
            {session.ended_at && (
              <div className="flex justify-between">
                <span>Ended</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {format(new Date(session.ended_at), "MMM d, h:mm a")}
                </span>
              </div>
            )}
            {session.started_at && session.ended_at && (
              <div className="flex justify-between border-t border-slate-100 dark:border-white/[0.06] pt-2 mt-2">
                <span>Actual duration</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {Math.round(
                    (new Date(session.ended_at).getTime() -
                      new Date(session.started_at).getTime()) /
                      60000,
                  )}{" "}
                  min
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
