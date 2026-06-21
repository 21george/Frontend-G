"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Video,
  Clock,
  CheckCircle2,
  XCircle,
  Radio,
  CalendarDays,
  User,
} from "lucide-react";
import { AnimatedSearch } from "@/components/ui/AnimatedSearch";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  useCoachingSessions,
  useUpdateSessionStatus,
  useDeleteCoachingSession,
  useUpdateCoachingSession,
} from "@/lib/hooks";
import { parseDateValue } from "@/lib/utils";
import { useSessionDetailModal } from "@/components/coaching";
import type { CoachingSession, CoachingSessionStatus } from "@/types";

/* ── Status config ───────────────────────────────────────────────────────── */
const STATUS_CFG: Record<
  CoachingSessionStatus,
  { label: string; dot: string; badge: string; icon: typeof Radio }
> = {
  live: {
    label: "Live Now",
    dot: "bg-green-400 animate-pulse",
    badge: "bg-green-500/15 text-green-400 border-green-500/20",
    icon: Radio,
  },
  upcoming: {
    label: "Upcoming",
    dot: "bg-amber-400",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    icon: CalendarDays,
  },
  ended: {
    label: "Ended",
    dot: "bg-slate-500",
    badge: "bg-slate-500/15 text-[var(--text-tertiary)] border-slate-500/20",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-red-500",
    badge: "bg-red-500/15 text-red-400 border-red-500/20",
    icon: XCircle,
  },
};

/* ── Skeleton ────────────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100 dark:border-white/[0.06]">
      {[100, 140, 80, 80, 100, 120].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 rounded bg-slate-200 dark:bg-white/10 animate-pulse"
            style={{ width: w }}
          />
        </td>
      ))}
    </tr>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function CoachingSessionsPage() {
  const { data: sessions = [], isLoading } = useCoachingSessions();
  const updateStatus = useUpdateSessionStatus();
  const updateSession = useUpdateCoachingSession();
  const deleteMut = useDeleteCoachingSession();
  const { open, Modal, isOpen } = useSessionDetailModal();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleAt, setRescheduleAt] = useState("");
  const [rescheduleDuration, setRescheduleDuration] = useState(60);
  const [deleteTarget, setDeleteTarget] = useState<CoachingSession | null>(null);

  /* ── Stats ── */
  const stats = useMemo(
    () => ({
      total: sessions.length,
      live: sessions.filter((s) => s.status === "live").length,
      upcoming: sessions.filter((s) => s.status === "upcoming").length,
      ended: sessions.filter((s) => s.status === "ended").length,
    }),
    [sessions],
  );

  /* ── Filtered rows ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sessions.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (
        q &&
        !s.title.toLowerCase().includes(q) &&
        !s.client_name.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [sessions, search, statusFilter]);

  /* ── Handlers ── */
  const handleGoLive = (s: CoachingSession) =>
    updateStatus.mutate({ id: s.id, status: "live" });

  const handleEnd = (s: CoachingSession) =>
    updateStatus.mutate({ id: s.id, status: "ended" });

  const handleCancel = (s: CoachingSession) => {
    if (confirm(`Cancel "${s.title}"? The session will be marked as cancelled.`))
      updateStatus.mutate({ id: s.id, status: "cancelled" });
  };

  const openDeleteConfirm = (s: CoachingSession) => setDeleteTarget(s);
  const closeDeleteConfirm = () => setDeleteTarget(null);
  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMut.mutate(deleteTarget.id, { onSuccess: closeDeleteConfirm });
  };

  const openReschedule = (s: CoachingSession) => {
    setRescheduleId(s.id);
    const dt = parseDateValue(s.scheduled_at);
    setRescheduleAt(dt ? new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
    setRescheduleDuration(s.duration_min);
  };

  const closeReschedule = () => {
    setRescheduleId(null);
    setRescheduleAt("");
    setRescheduleDuration(60);
  };

  const submitReschedule = () => {
    if (!rescheduleId || !rescheduleAt) return;
    updateSession.mutate(
      { id: rescheduleId, payload: { scheduled_at: new Date(rescheduleAt).toISOString(), duration_min: rescheduleDuration } },
      { onSuccess: closeReschedule }
    );
  };

  return (
    <DashboardLayout>
      <div className="mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              Schedule, manage and run private video coaching sessions with your
              clients.
            </p>
          </div>
        </div>

        {/* ── KPI cards ── */}

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <AnimatedSearch className="relative flex-1" active={search.length > 0}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or client…"
              className=" pl-9 pr-4 py-2  rounded-8 border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </AnimatedSearch>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-8 border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-secondary)] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="live">Live</option>
            <option value="ended">Ended</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* ── Table ── */}
        <div className="rounded-8 border border-slate-100 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/[0.06]">
                <tr>
                  {[
                    "Client",
                    "Session Title",
                    "Scheduled",
                    "Duration",
                    "Status",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}

                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-16 text-center text-[var(--text-tertiary)]"
                    >
                      <Video className="h-8 w-8 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No sessions found</p>
                      <p className="text-xs mt-1">
                        Schedule a new 1-on-1 session to get started.
                      </p>
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  filtered.map((s) => {
                    const cfg = STATUS_CFG[s.status];
                    const dt = parseDateValue(s.scheduled_at);
                    return (
                      <tr
                        key={s.id}
                        className="border-b border-slate-100 dark:border-white/[0.06] hover:bg-[#d0d5dd36] dark:hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Client */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {s.client_photo ? (
                              <img
                                src={s.client_photo}
                                alt=""
                                className="h-7 w-7 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                                <User className="h-3.5 w-3.5 text-cyan-600" />
                              </div>
                            )}
                            <span className="font-medium text-[var(--text-primary)] truncate max-w-[110px]">
                              {s.client_name}
                            </span>
                          </div>
                        </td>

                        {/* Title */}
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="font-medium text-[var(--text-primary)] truncate">
                            {s.title}
                          </p>
                          {s.description && (
                            <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
                              {s.description}
                            </p>
                          )}
                        </td>

                        {/* Scheduled */}
                        <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                          {dt ? format(dt, "MMM d, h:mm a") : "—"}
                        </td>

                        {/* Duration */}
                        <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 opacity-50" />
                            {s.duration_min} min
                          </span>
                        </td>

                        {/* Status badge */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.badge}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`}
                            />
                            {cfg.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => open(s.id)}
                              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-white/[0.1] text-[var(--text-secondary)] hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors"
                            >
                              View
                            </button>
                            {s.status === "upcoming" && (
                              <>
                                <button
                                  onClick={() => handleGoLive(s)}
                                  disabled={updateStatus.isPending}
                                  className="px-2.5 py-1 text-xs rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
                                >
                                  Go Live
                                </button>
                                <button
                                  onClick={() => openReschedule(s)}
                                  disabled={updateSession.isPending}
                                  className="px-2.5 py-1 text-xs rounded-lg border border-amber-200 dark:border-amber-500/20 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                >
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => handleCancel(s)}
                                  disabled={updateStatus.isPending}
                                  className="px-2.5 py-1 text-xs rounded-lg border border-orange-200 dark:border-orange-500/20 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {s.status === "live" && (
                              <button
                                onClick={() => open(s.id)}
                                className="px-2.5 py-1 text-xs rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors"
                              >
                                Join
                              </button>
                            )}
                            {(s.status === "ended" || s.status === "cancelled") && (
                              <button
                                onClick={() => openDeleteConfirm(s)}
                                disabled={deleteMut.isPending && deleteTarget?.id === s.id}
                                className="px-2.5 py-1 text-xs rounded-lg border border-red-200 dark:border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                              >
                                {deleteMut.isPending && deleteTarget?.id === s.id ? "Deleting…" : "Delete"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Session Detail Modal */}
      {isOpen && <Modal />}

      {/* Reschedule Modal */}
      {rescheduleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#181818] border border-[var(--border)] rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Reschedule Session</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">New Date & Time</label>
                <input
                  type="datetime-local"
                  value={rescheduleAt}
                  onChange={(e) => setRescheduleAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Duration (minutes)</label>
                <select
                  value={rescheduleDuration}
                  onChange={(e) => setRescheduleDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                >
                  {[15, 30, 45, 60, 75, 90, 120].map((m) => (
                    <option key={m} value={m}>{m} minutes</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={closeReschedule}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] text-sm font-medium text-[var(--text-secondary)] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
              >
                Close
              </button>
              <button
                onClick={submitReschedule}
                disabled={updateSession.isPending || !rescheduleAt}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-lg shadow-cyan-500/20"
              >
                {updateSession.isPending ? "Saving…" : "Reschedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDelete}
        title="Delete Session"
        message={deleteTarget ? `Permanently delete "${deleteTarget.title}"? This cannot be undone.` : ""}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMut.isPending}
      />
    </DashboardLayout>
  );
}
