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
import { CoachingSessionDetail } from "@/components/coaching";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Loader2,
  VideoOff,
  Video,
  PhoneOff,
} from "lucide-react";
import { useUpdateSessionStatus, useCoachingSessionToken } from "@/lib/hooks";

/* ── LiveKit video room (lazy) ─────────────────────────────────────────────── */
function VideoRoom({
  token,
  serverUrl,
  onLeave,
}: {
  token: string;
  serverUrl: string;
  onLeave: () => void;
}) {
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

  const [inRoom, setInRoom] = useState(false);
  const [tokenEnabled, setTokenEnabled] = useState(false);
  const { data: lkToken } = useCoachingSessionToken(id, tokenEnabled);
  const updateStatus = useUpdateSessionStatus();

  // Enter the room once token arrives
  useEffect(() => {
    if (tokenEnabled && lkToken) {
      setInRoom(true);
    }
  }, [tokenEnabled, lkToken]);

  const handleEnterRoom = () => setTokenEnabled(true);

  const handleLeaveRoom = () => {
    setInRoom(false);
    setTokenEnabled(false);
  };

  const handleEndSession = () => {
    updateStatus.mutate({ id, status: "ended" });
    setInRoom(false);
  };

  /* ── Live video room view ── */
  if (inRoom && lkToken) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-tertiary)]">Session ID: {id}</p>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <CoachingSessionDetail
          id={id}
          onClose={() => router.push("/coaching-sessions")}
          onEnterVideoRoom={handleEnterRoom}
        />
      </div>
    </DashboardLayout>
  );
}
