"use client";

import { useMemo } from "react";
import { Video, CalendarDays, Radio, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { format, isBefore } from "date-fns";
import { parseDateValue } from "@/lib/utils";
import { useCoachingSessions } from "@/lib/hooks";
import { useSessionDetailModal } from "@/components/coaching";
import type { CoachingSession } from "@/types";

export function UpcomingCoachingSessions() {
  const { data: sessions = [], isLoading } = useCoachingSessions();
  const { open, Modal, isOpen } = useSessionDetailModal();

  const upcoming = useMemo(() => {
    const now = new Date();
    return sessions
      .filter(
        (s: CoachingSession) =>
          s.status === "live" ||
          (s.status === "upcoming" &&
            !isBefore(new Date(s.scheduled_at), now)),
      )
      .sort(
        (a: CoachingSession, b: CoachingSession) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime(),
      )
      .slice(0, 4);
  }, [sessions]);

  const liveCount = sessions.filter(
    (s: CoachingSession) => s.status === "live",
  ).length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="bg-[var(--bg-card)] border border-[var(--border)] dark:border-white/[0.07] flex flex-col rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] dark:border-white/[0.07]">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-cyan-500" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Upcoming 1-on-1 Sessions
            </p>
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/15 text-green-400 border border-green-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                {liveCount} live
              </span>
            )}
          </div>
          <Link
            href="/coaching-sessions"
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center gap-0.5 transition-colors"
          >
            View all
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Body */}
        <div className="flex-1 divide-y divide-[var(--border)] dark:divide-white/[0.06]">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="px-5 py-3 flex items-center gap-3 animate-pulse"
              >
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-white/10" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-32 rounded bg-slate-200 dark:bg-white/10" />
                  <div className="h-2.5 w-20 rounded bg-slate-100 dark:bg-white/[0.06]" />
                </div>
              </div>
            ))}

          {!isLoading && upcoming.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-[var(--text-tertiary)]">
              <CalendarDays className="h-6 w-6 mb-2 opacity-40" />
              <p className="text-xs">No upcoming sessions.</p>
              <Link
                href="/coaching-sessions/new"
                className="text-xs text-cyan-500 hover:underline mt-1"
              >
                Schedule one now
              </Link>
            </div>
          )}

          {!isLoading &&
            upcoming.map((s: CoachingSession) => {
              const dt = parseDateValue(s.scheduled_at);
              const isLive = s.status === "live";
              return (
                <button
                  key={s.id}
                  onClick={() => open(s.id)}
                  className="w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-[#d0d5dd36] dark:hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {s.client_photo ? (
                      <img
                        src={s.client_photo}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-xs font-semibold text-cyan-600">
                        {s.client_name[0]?.toUpperCase()}
                      </div>
                    )}
                    {isLive && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-white dark:border-[var(--bg-card)] animate-pulse" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {s.title}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] truncate">
                      {s.client_name}
                    </p>
                  </div>

                  {/* Time / status */}
                  <div className="text-right flex-shrink-0">
                    {isLive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-500">
                        <Radio className="h-3 w-3" />
                        Live
                      </span>
                    ) : (
                      <>
                        <p className="text-xs font-medium text-[var(--text-secondary)]">
                          {dt ? format(dt, "MMM d") : "—"}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-0.5 justify-end">
                          <Clock className="h-2.5 w-2.5" />
                          {dt ? format(dt, "h:mm a") : ""}
                        </p>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
        </div>

        {/* Footer CTA */}
        <div className="border-t border-[var(--border)] dark:border-white/[0.07] px-5 py-3">
          <Link
            href="/coaching-sessions/new"
            className="text-xs text-cyan-500 hover:text-cyan-600 font-medium transition-colors"
          >
            + Schedule new session
          </Link>
        </div>
      </motion.div>

      {/* Session Detail Modal */}
      {isOpen && <Modal />}
    </>
  );
}
