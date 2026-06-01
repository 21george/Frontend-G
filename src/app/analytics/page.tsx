"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCoachAnalytics, useSessionAnalytics } from "@/lib/hooks";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Users,
  Activity,
  TrendingUp,
  Dumbbell,
  BarChart3,
  UserCheck,
  Calendar,
  ArrowUpRight,
  Video,
  Clock,
  CheckCircle,
  XCircle,
  Radio,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { humanDate } from "@/lib/formatDate";

/* ── Reusable stat card ─────────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      <p className="text-xs font-medium text-[var(--text-secondary)] mt-1">
        {label}
      </p>
      {sub && (
        <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{sub}</p>
      )}
    </motion.div>
  );
}

/* ── Section panel ──────────────────────────────────────────────────────── */
function Panel({
  title,
  icon: Icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-2">
        <Icon className="w-4 h-4 text-[var(--text-tertiary)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  );
}

/* ── Status badge ───────────────────────────────────────────────────────── */
const statusStyles: Record<string, string> = {
  upcoming: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  live: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  ended:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  cancelled: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

/* ── Loading skeleton ───────────────────────────────────────────────────── */
function AnalyticsSkeleton() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function AnalyticsDashboardPage() {
  const { data: coachData, isLoading: loadingCoach } = useCoachAnalytics();
  const { data: sessionData, isLoading: loadingSessions } =
    useSessionAnalytics();

  if (loadingCoach || loadingSessions) return <AnalyticsSkeleton />;

  /* ── Coach stats grid ── */
  const coachStats = [
    {
      label: "Total Clients",
      value: coachData?.total_clients ?? 0,
      icon: Users,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      sub: `${coachData?.new_clients_this_month ?? 0} new this month`,
    },
    {
      label: "Active Clients",
      value: coachData?.active_clients ?? 0,
      icon: UserCheck,
      color:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
      sub: "Worked out in last 7 days",
    },
    {
      label: "Total Workouts",
      value: coachData?.total_workouts ?? 0,
      icon: Dumbbell,
      color:
        "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
      sub: "All time completed",
    },
    {
      label: "Completion Rate",
      value: `${coachData?.completion_rate ?? 0}%`,
      icon: BarChart3,
      color:
        "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
      sub: "Plan days completed",
    },
  ];

  /* ── Session stats grid ── */
  const sessionStats = [
    {
      label: "Total 1-on-1 Sessions",
      value: sessionData?.total ?? 0,
      icon: Video,
      color:
        "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
      sub: `${sessionData?.this_month ?? 0} this month`,
    },
    {
      label: "Upcoming",
      value: sessionData?.by_status?.upcoming ?? 0,
      icon: Calendar,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      sub: "Scheduled ahead",
    },
    {
      label: "Completed",
      value: sessionData?.by_status?.ended ?? 0,
      icon: CheckCircle,
      color:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
      sub: sessionData?.avg_duration_min
        ? `avg ${sessionData.avg_duration_min} min`
        : "All time",
    },
    {
      label: "Cancelled",
      value: sessionData?.by_status?.cancelled ?? 0,
      icon: XCircle,
      color: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
      sub: "Not attended",
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Advanced Analytics
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Business insights across your entire coaching practice.
            </p>
          </div>
          <Link
            href="/coaching-sessions"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            View Sessions
          </Link>
        </div>

        {/* ── Coaching practice stats ── */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
            Coaching Practice
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {coachStats.map((s, i) => (
              <StatCard key={i} {...s} />
            ))}
          </div>
        </section>

        {/* ── 1-on-1 session stats ── */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
            1-on-1 Live Sessions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sessionStats.map((s, i) => (
              <StatCard key={i} {...s} />
            ))}
          </div>
        </section>

        {/* ── Two-column tables ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top workout clients */}
          <Panel
            title="Top Workout Clients (30 days)"
            icon={TrendingUp}
            delay={0.2}
          >
            {coachData?.top_clients?.length > 0 ? (
              <div className="divide-y divide-[var(--border)]">
                {coachData.top_clients.map((client: any, i: number) => (
                  <Link
                    key={client.id}
                    href={`/clients/${client.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[10px] font-bold text-[var(--text-secondary)]">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {client.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {client.sessions} workouts
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Dumbbell className="w-8 h-8 text-[var(--text-tertiary)]/30 mb-2" />
                <p className="text-sm text-[var(--text-secondary)]">
                  No workout activity in the last 30 days.
                </p>
              </div>
            )}
          </Panel>

          {/* Top session clients */}
          <Panel
            title="Top 1-on-1 Session Clients (30 days)"
            icon={Video}
            delay={0.3}
          >
            {sessionData?.top_clients?.length > 0 ? (
              <div className="divide-y divide-[var(--border)]">
                {sessionData.top_clients.map((client: any, i: number) => (
                  <Link
                    key={client.id}
                    href={`/clients/${client.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[10px] font-bold text-[var(--text-secondary)]">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {client.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Video className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {client.sessions} sessions
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Video className="w-8 h-8 text-[var(--text-tertiary)]/30 mb-2" />
                <p className="text-sm text-[var(--text-secondary)]">
                  No 1-on-1 sessions in the last 30 days.
                </p>
              </div>
            )}
          </Panel>
        </div>

        {/* ── Recent 1-on-1 sessions ── */}
        <Panel title="Recent 1-on-1 Sessions" icon={Clock} delay={0.4}>
          {sessionData?.recent?.length > 0 ? (
            <div className="divide-y divide-[var(--border)]">
              {sessionData.recent.map((s: any) => (
                <Link
                  key={s.id}
                  href={`/coaching-sessions/${s.id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${s.status === "live" ? "bg-red-500 animate-pulse" : s.status === "ended" ? "bg-emerald-500" : s.status === "cancelled" ? "bg-zinc-400" : "bg-blue-500"}`}
                    />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {s.title}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {s.client_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.duration_min && (
                      <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {s.duration_min} min
                      </span>
                    )}
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusStyles[s.status] ?? statusStyles.upcoming}`}
                    >
                      {s.status}
                    </span>
                    {s.scheduled_at && (
                      <span className="text-xs text-[var(--text-tertiary)] hidden sm:inline">
                        {humanDate(s.scheduled_at)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Radio className="w-8 h-8 text-[var(--text-tertiary)]/30 mb-2" />
              <p className="text-sm text-[var(--text-secondary)]">
                No coaching sessions yet.
              </p>
              <Link
                href="/coaching-sessions/new"
                className="mt-2 text-xs text-brand hover:underline"
              >
                Schedule your first session →
              </Link>
            </div>
          )}
        </Panel>
      </div>
    </DashboardLayout>
  );
}
