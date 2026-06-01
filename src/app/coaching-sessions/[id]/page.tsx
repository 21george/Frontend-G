"use client";

/**
 * 1-on-1 Coaching Session detail page.
 *
 * Modes:
 *  • Pre-session / ended → shows session info, agenda, notes editor
 *  • Live (in-progress)  → full LiveKit video room (requires @livekit/components-react)
 *
 * LiveKit packages to install:
 *   npm install @livekit/components-react @livekit/components-styles livekit-client
 */

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  User,
  FileText,
  Radio,
  CheckCircle2,
  XCircle,
  Edit3,
  Save,
  Loader2,
  Video,
  VideoOff,
  PhoneOff,
} from "lucide-react";
import {
  useCoachingSession,
  useUpdateSessionStatus,
  useSaveSessionNotes,
  useCoachingSessionToken,
} from "@/lib/hooks";
import { parseDateValue } from "@/lib/utils";
import type { CoachingSessionStatus } from "@/types";

/* ── Status config ── */
const STATUS_CFG: Record<
  CoachingSessionStatus,
  { label: string; badge: string; icon: typeof Radio }
> = {
  live: {
    label: "Live Now",
    badge: "bg-green-500/15 text-green-400 border-green-500/20",
    icon: Radio,
  },
  upcoming: {
    label: "Upcoming",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    icon: CalendarDays,
  },
  ended: {
    label: "Ended",
    badge: "bg-slate-500/15 text-[var(--text-tertiary)] border-slate-500/20",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-red-500/15 text-red-400 border-red-500/20",
    icon: XCircle,
  },
};

/* ── LiveKit video room (lazy) ─────────────────────────────────────────────── */
/**
 * Rendered only when status === 'live' and the coach clicks "Enter Room".
 * Uses @livekit/components-react pre-built <VideoConference /> for a full
 * camera / mic / screen-share / chat UI with zero custom styling needed.
 */
function VideoRoom({
  token,
  serverUrl,
  onLeave,
}: {
  token: string;
  serverUrl: string;
  onLeave: () => void;
}) {
  // Dynamic import keeps the LiveKit bundle out of other pages.
  const [Comps, setComps] = useState<{
    LiveKitRoom: React.ComponentType<{
      token: string;
      serverUrl: string;
      connect: boolean;
      video: boolean;
      audio: boolean;
      onDisconnected?: () => void;
      style?: React.CSSProperties;
      children: React.ReactNode;
    }>;
    VideoConference: React.ComponentType;
    RoomAudioRenderer: React.ComponentType;
  } | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    import("@livekit/components-react")
      .then((m) => {
        setComps({
          LiveKitRoom: m.LiveKitRoom as unknown as typeof Comps extends null
            ? never
            : NonNullable<typeof Comps>["LiveKitRoom"],
          VideoConference: m.VideoConference,
          RoomAudioRenderer: m.RoomAudioRenderer,
        });
        // Import CSS — harmless no-op if already loaded
        import("@livekit/components-styles").catch(() => {});
      })
      .catch(() => setLoadError(true));
  }, []);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-[var(--text-tertiary)] gap-4">
        <VideoOff className="h-10 w-10" />
        <p className="font-medium">Video unavailable</p>
        <p className="text-sm text-center max-w-xs">
          Could not load the video library. Make sure{" "}
          <code className="text-cyan-500">@livekit/components-react</code> is
          installed (<code>npm install</code>) and the LIVEKIT_URL env var is
          set.
        </p>
        <button
          onClick={onLeave}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] text-sm"
        >
          Back
        </button>
      </div>
    );
  }

  if (!Comps) {
    return (
      <div className="flex items-center justify-center h-[60vh] gap-3 text-[var(--text-tertiary)]">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Connecting to video…</span>
      </div>
    );
  }

  const { LiveKitRoom, VideoConference, RoomAudioRenderer } = Comps;

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect
      video
      audio
      onDisconnected={onLeave}
      style={{ height: "80vh", borderRadius: "1rem", overflow: "hidden" }}
    >
      <VideoConference />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function CoachingSessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: session, isLoading } = useCoachingSession(id);
  const updateStatus = useUpdateSessionStatus();
  const saveNotes = useSaveSessionNotes(id);

  /* ── Video state ── */
  const [inRoom, setInRoom] = useState(false);
  const [tokenEnabled, setTokenEnabled] = useState(false);
  const { data: lkToken } = useCoachingSessionToken(id, tokenEnabled);

  /* ── Notes state ── */
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const notesInitRef = useRef(false);

  // Seed notes from fetched session (once)
  useEffect(() => {
    if (session && !notesInitRef.current) {
      setNotes(session.notes ?? "");
      notesInitRef.current = true;
    }
  }, [session]);

  const handleGoLive = () => updateStatus.mutate({ id, status: "live" });

  const handleEndSession = () => {
    updateStatus.mutate({ id, status: "ended" });
    setInRoom(false);
  };

  const handleEnterRoom = useCallback(() => {
    setTokenEnabled(true);
  }, []);

  // Enter the room once token arrives
  useEffect(() => {
    if (tokenEnabled && lkToken) {
      setInRoom(true);
    }
  }, [tokenEnabled, lkToken]);

  const handleLeaveRoom = () => {
    setInRoom(false);
    setTokenEnabled(false);
  };

  const handleSaveNotes = () => {
    saveNotes.mutate(notes, { onSuccess: () => setEditingNotes(false) });
  };

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6 animate-pulse">
          <div className="h-5 w-24 bg-slate-200 dark:bg-white/10 rounded" />
          <div className="h-8 w-64 bg-slate-200 dark:bg-white/10 rounded" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-slate-100 dark:bg-white/[0.04]"
              />
            ))}
          </div>
          <div className="h-40 rounded-2xl bg-slate-100 dark:bg-white/[0.04]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 text-[var(--text-tertiary)]">
          <Video className="h-10 w-10 mb-3 opacity-30" />
          <p className="font-medium">Session not found</p>
          <button
            onClick={() => router.push("/coaching-sessions")}
            className="mt-4 text-sm text-cyan-500 hover:underline"
          >
            Back to sessions
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const cfg = STATUS_CFG[session.status];
  const dt = parseDateValue(session.scheduled_at);
  const isLive = session.status === "live";
  const isUpcoming = session.status === "upcoming";
  const isEnded = session.status === "ended" || session.status === "cancelled";

  /* ── Live video room view ── */
  if (inRoom && lkToken) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                {session.title}
              </h1>
              <p className="text-sm text-[var(--text-tertiary)]">
                with {session.client_name}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleLeaveRoom}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-white/[0.1] text-[var(--text-secondary)] hover:bg-slate-50 dark:hover:bg-white/[0.05]"
              >
                <Video className="h-3.5 w-3.5" />
                Leave Room
              </button>
              <button
                onClick={handleEndSession}
                disabled={updateStatus.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium"
              >
                <PhoneOff className="h-3.5 w-3.5" />
                End Session
              </button>
            </div>
          </div>

          {/* Video room */}
          <VideoRoom
            token={lkToken.token}
            serverUrl={lkToken.server_url}
            onLeave={handleLeaveRoom}
          />
        </div>
      </DashboardLayout>
    );
  }

  /* ── Normal view ── */
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Back */}
        <button
          onClick={() => router.push("/coaching-sessions")}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sessions
        </button>

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
            )}

            {isLive && (
              <>
                <button
                  onClick={handleEnterRoom}
                  disabled={tokenEnabled && !lkToken}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-lg shadow-cyan-500/20"
                >
                  {tokenEnabled && !lkToken ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Video className="h-4 w-4" />
                  )}
                  {tokenEnabled && !lkToken
                    ? "Connecting…"
                    : "Enter Video Room"}
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
            <p className="text-xs text-[var(--text-tertiary)] mb-1">
              Scheduled
            </p>
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
    </DashboardLayout>
  );
}
