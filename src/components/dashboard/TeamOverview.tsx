"use client";

import { motion } from "framer-motion";
import { Users, Activity, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useStaffActivities, useStaffList } from "@/hooks/useStaff";
import type { Client, StaffActivity, StaffMember } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";
import { STAFF_ROLE_LABELS } from "@/types";

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    client_created: "Created client",
    client_updated: "Updated client",
    checkin_scheduled: "Scheduled check-in",
    workout_plan_created: "Created workout plan",
    workout_plan_assigned: "Assigned workout plan",
    nutrition_plan_created: "Created nutrition plan",
    nutrition_plan_assigned: "Assigned nutrition plan",
    coaching_session_created: "Created 1-on-1 session",
    message_sent: "Sent message",
  };
  return labels[action] ?? action.replace(/_/g, " ");
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function StatusDot({ status }: { status: StaffMember["status"] }) {
  const color =
    status === "active"
      ? "bg-emerald-500"
      : status === "invited"
      ? "bg-amber-500"
      : "bg-red-500";
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${color}`}
      title={status}
    />
  );
}

export function TeamOverview({ clients }: { clients: Client[] }) {
  const { data: activitiesData, isLoading: activitiesLoading } = useStaffActivities(1);
  const { data: staff, isLoading: staffLoading } = useStaffList();
  const activities: StaffActivity[] = activitiesData?.data ?? [];

  const clientsWithStaff = clients.filter((c) => c.last_staff_id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4"
    >
      {/* Team Members */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Team
            </h3>
          </div>
          <Link
            href="/settings/team"
            className="text-xs text-[var(--accent)] hover:underline flex items-center gap-0.5"
          >
            Manage Team <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {staffLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : (staff ?? []).length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            No team members yet.{" "}
            <Link href="/settings/team" className="text-[var(--accent)] hover:underline">
              Invite staff
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {(staff ?? []).slice(0, 10).map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold flex-shrink-0">
                  {s.name?.[0]?.toUpperCase() ?? s.email?.[0]?.toUpperCase() ?? "S"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate font-medium">
                    {s.name || s.email}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 flex items-center gap-1.5">
                    <StatusDot status={s.status} />
                    {STAFF_ROLE_LABELS[s.role]} · {s.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Staff Activities */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Recent Staff Activity
          </h3>
        </div>

        {activitiesLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            No recent activity.
          </p>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {activities.slice(0, 10).map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold flex-shrink-0">
                  {a.staff_name?.[0]?.toUpperCase() ?? "S"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">
                    <span className="font-medium">{a.staff_name ?? "Staff"}</span>
                    {" "}
                    <span className="text-[var(--text-secondary)]">
                      {actionLabel(a.action)}
                    </span>
                    {a.client_name && (
                      <span className="text-[var(--text-secondary)]">
                        {" "}for{" "}
                        <span className="font-medium text-[var(--text-primary)]">
                          {a.client_name}
                        </span>
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {a.created_at ? formatTimeAgo(a.created_at) : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Client — Last Instructor */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Last Instructor Contact
          </h3>
        </div>

        {clientsWithStaff.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            No instructor activity recorded yet.
          </p>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {clientsWithStaff.slice(0, 10).map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-[var(--text-primary)] text-xs font-bold flex-shrink-0">
                  {c.name?.[0]?.toUpperCase() ?? "C"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate font-medium">
                    {c.name}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    Last worked with{" "}
                    <span className="font-medium text-[var(--text-primary)]">
                      {c.last_staff_name ?? "Unknown"}
                    </span>
                    {" "}·{" "}
                    {c.last_staff_activity
                      ? actionLabel(c.last_staff_activity)
                      : ""}
                    {c.last_staff_activity_at && (
                      <span className="ml-1">
                        · {formatTimeAgo(c.last_staff_activity_at)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
