"use client";

import { useState, useMemo, useEffect } from "react";
import {
  CalendarDays,
  MessageCircle,
  Video,
  Phone,
  Users,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { parseDateValue } from "@/lib/utils";
import { humanDate } from "@/lib/formatDate";
import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { useWeeklySessions } from "@/lib/hooks";
import type {
  DashboardTeamMeeting,
  DashboardCoachingSession,
  DashboardClientMeeting,
} from "@/types";

const BRAND = "#132E35";

const TYPE_ICON: Record<string, LucideIcon> = {
  video: Video,
  call: Phone,
  chat: MessageCircle,
  in_person: Briefcase,
};

type ScheduleItem =
  | (DashboardTeamMeeting & { sortTime: number })
  | (DashboardCoachingSession & { sortTime: number })
  | (DashboardClientMeeting & { sortTime: number });

export function WeeklyScheduleCard() {
  const [now, setNow] = useState(() => new Date());
  const { data, isLoading } = useWeeklySessions();

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const allItems: ScheduleItem[] = useMemo(() => {
    if (!data) return [];

    const items: ScheduleItem[] = [];

    data.team_meetings.forEach((m) => {
      items.push({ ...m, sortTime: new Date(m.scheduled_at).getTime() });
    });
    data.coaching_sessions.forEach((s) => {
      items.push({ ...s, sortTime: new Date(s.scheduled_at).getTime() });
    });
    data.client_meetings.forEach((c) => {
      items.push({ ...c, sortTime: new Date(c.scheduled_at).getTime() });
    });

    return items.sort((a, b) => a.sortTime - b.sortTime);
  }, [data]);

  const counts = useMemo(() => {
    if (!data) return { team: 0, coaching: 0, client: 0 };
    return {
      team: data.team_meetings.length,
      coaching: data.coaching_sessions.length,
      client: data.client_meetings.length,
    };
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="bg-[var(--bg-card)] border border-[var(--border)] dark:border-white/[0.07] flex flex-col shadow-[var(--shadow-sm)]"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] dark:border-white/[0.07]">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-[#132E35] dark:text-[#2A96AD]" />
          <p className="text-sm font-semibold text-[var(--text-primary)] dark:text-[#FAFAFA]">
            This Week&apos;s Schedule
          </p>
          {(counts.team > 0 || counts.client > 0) && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[var(--bg-subtle)] text-[#132E35] dark:bg-[#132E35]/40 dark:text-[#6DB9A8]">
              {counts.team > 0 && `${counts.team} team`}
              {counts.team > 0 && counts.client > 0 && " · "}
              {counts.client > 0 && `${counts.client} client req`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/team-meetings"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#132E35] dark:text-[#2A96AD] hover:underline"
          >
            Team <ChevronRight size={12} />
          </Link>
        </div>
      </div>

      <div className="flex-1 divide-y divide-[var(--border)] dark:divide-white/[0.06]">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="px-5 py-3 flex items-center gap-3 animate-pulse w-full"
              >
                <div className="h-10 w-10 flex-shrink-0 rounded bg-slate-200 dark:bg-white/10" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-32 rounded bg-slate-200 dark:bg-white/10" />
                  <div className="h-2.5 w-20 rounded bg-slate-100 dark:bg-white/[0.06]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && allItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--text-tertiary)] dark:text-[#FAFAFA]/30">
            <CalendarDays size={24} className="mb-2" />
            <p className="text-xs">No sessions this week.</p>
          </div>
        )}

        {!isLoading &&
          allItems.map((item, i) => {
            const date = parseDateValue(item.scheduled_at);
            const isTeam = item.type === "team_meeting";
            const isCoaching = item.type === "coaching_session";
            const isClientMeeting = item.type === "client_meeting";

            let Icon = MessageCircle;
            let title = "";
            let subtitle = "";
            let badge = "";
            let badgeClass = "";

            if (isTeam) {
              const tm = item as DashboardTeamMeeting;
              Icon = TYPE_ICON[tm.meeting_type] ?? MessageCircle;
              title = tm.title;
              subtitle = tm.is_group
                ? `Group · ${tm.participants.map((p) => p.name).join(", ")}`
                : `1-on-1 · ${tm.participants[0]?.name ?? ""}`;
              badge = tm.is_group ? "Team" : "1-on-1";
              badgeClass =
                "bg-[var(--bg-subtle)] text-[#132E35] dark:bg-[#132E35]/40 dark:text-[#6DB9A8]";
            } else if (isCoaching) {
              const cs = item as DashboardCoachingSession;
              Icon = Video;
              title = cs.title || "Coaching Session";
              subtitle = cs.client_name;
              badge = "Client";
              badgeClass =
                "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400";
            } else {
              const cm = item as DashboardClientMeeting;
              Icon = TYPE_ICON[cm.meeting_type] ?? MessageCircle;
              title = `${cm.client_name}`;
              subtitle = `Requested by client · ${cm.meeting_type}`;
              badge = "Request";
              badgeClass =
                "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
            }

            return (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + i * 0.06 }}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--bg-subtle)] dark:hover:bg-[#FAFAFA]/[0.02] transition-colors"
              >
                {/* Date box */}
                <div
                  className="w-10 h-10 flex-shrink-0 flex flex-col items-center justify-center text-white"
                  style={{ backgroundColor: BRAND }}
                >
                  <span className="text-sm font-bold leading-none">
                    {date ? date.getDate() : "—"}
                  </span>
                  <span className="text-[9px] font-semibold uppercase leading-none mt-0.5">
                    {date
                      ? date.toLocaleDateString("en-US", { month: "short" })
                      : ""}
                  </span>
                </div>

                {/* Icon */}
                <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-[var(--bg-subtle)] dark:bg-[#FAFAFA]/[0.05]">
                  <Icon
                    size={13}
                    className="text-[var(--text-secondary)] dark:text-[#FAFAFA]/60"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] dark:text-[#FAFAFA] truncate">
                    {title}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] dark:text-[#FAFAFA]/50 truncate">
                    {date ? humanDate(date) : ""}
                    {subtitle && ` · ${subtitle}`}
                  </p>
                </div>

                {/* Badge */}
                <span
                  className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${badgeClass}`}
                >
                  {badge}
                </span>
              </motion.div>
            );
          })}
      </div>

      <div className="px-5 py-3 border-t border-[var(--border)] dark:border-white/[0.07] flex items-center justify-between">
        <Link
          href="/checkins"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#132E35] dark:text-[#2A96AD] hover:underline"
        >
          View all sessions <ChevronRight size={13} />
        </Link>
        <Link
          href="/team-meetings"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#132E35] dark:text-[#2A96AD] hover:underline"
        >
          <Users size={12} /> Schedule team meeting
        </Link>
      </div>
    </motion.div>
  );
}
