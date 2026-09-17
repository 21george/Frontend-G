"use client";

import { useSyncExternalStore } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Activity,
  Calendar,
  Dumbbell,
  Briefcase,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/store/auth";
import { useStaffMember, useStaffActivities } from "@/hooks/useStaff";
import { useClients, useCheckins, useWorkoutPlans } from "@/lib/hooks";
import { STAFF_ROLE_LABELS, type Client, type StaffActivity } from "@/types";
import type { PaginatedResponse, WorkoutPlan, CheckinMeeting } from "@/types";

function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

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

export default function StaffMemberPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = typeof params.id === "string" ? params.id : "";
  const isClient = useIsClient();
  const { isStaff, staffRole } = useAuthStore();

  const { data: staff, isLoading: staffLoading } = useStaffMember(staffId);
  const { data: activitiesData, isLoading: activitiesLoading } =
    useStaffActivities(1);
  const { data: clientsData, isLoading: clientsLoading } = useClients();
  const { data: checkinsData, isLoading: checkinsLoading } = useCheckins();
  const { data: plansData, isLoading: plansLoading } = useWorkoutPlans();

  const allClients: Client[] =
    (clientsData as PaginatedResponse<Client> | undefined)?.data ?? [];
  const allCheckins: CheckinMeeting[] =
    (checkinsData as CheckinMeeting[] | undefined) ?? [];
  const allPlans: WorkoutPlan[] =
    (plansData as PaginatedResponse<WorkoutPlan> | undefined)?.data ??
    (Array.isArray(plansData) ? (plansData as WorkoutPlan[]) : []);

  // Staff member's clients: primary assignment or last interaction.
  const staffClients = allClients.filter(
    (c) =>
      c.primary_staff_id === staffId ||
      c.last_staff_id === staffId,
  );

  // Activities performed by this staff member.
  const staffActivities: StaffActivity[] =
    ((activitiesData as { data: StaffActivity[] } | undefined)?.data ?? []).filter(
      (a) => a.staff_id === staffId,
    );

  // Today's schedule for this staff member (check-ins they created).
  const today = new Date().toISOString().split("T")[0];
  const todaySchedule = allCheckins.filter((c) => {
    const scheduled = new Date(c.scheduled_at).toISOString().split("T")[0];
    return scheduled === today;
  });

  // Workout / nutrition plans created by this staff member. We approximate
  // this by plans whose assigned clients list this staff member as primary.
  const staffPlans = allPlans.filter((p) =>
    p.client_ids?.some((cid) =>
      staffClients.some((c) => c.id === cid),
    ),
  );

  if (!isClient) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Skeleton className="w-12 h-12 rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  // Front-desk staff should not access other staff profiles.
  if (isStaff && staffRole === "front_desk") {
    router.replace("/dashboard");
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/settings/team"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Team
          </Link>
        </div>

        {staffLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-24 rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          </div>
        ) : !staff ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
            <p className="text-[var(--text-secondary)]">Staff member not found.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 flex items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center text-2xl font-bold">
                {staff.name?.[0]?.toUpperCase() ??
                  staff.email?.[0]?.toUpperCase() ??
                  "S"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  {staff.name || "Unnamed staff"}
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  {staff.email} · {STAFF_ROLE_LABELS[staff.role]}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1 capitalize">
                  {staff.status}
                </p>
              </div>
            </motion.div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Clients"
                value={staffClients.length}
                isLoading={clientsLoading}
              />
              <StatCard
                icon={Briefcase}
                label="Plans"
                value={staffPlans.length}
                isLoading={plansLoading}
              />
              <StatCard
                icon={Calendar}
                label="Today"
                value={todaySchedule.length}
                isLoading={checkinsLoading}
              />
              <StatCard
                icon={Activity}
                label="Activities"
                value={staffActivities.length}
                isLoading={activitiesLoading}
              />
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Clients */}
              <Panel
                title="Clients"
                icon={Users}
                isLoading={clientsLoading}
                empty={staffClients.length === 0}
                emptyText="No clients assigned or recently handled."
              >
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {staffClients.slice(0, 20).map((c) => (
                    <Link
                      key={c.id}
                      href={`/clients/${c.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-[var(--text-primary)] text-xs font-bold flex-shrink-0">
                        {c.name?.[0]?.toUpperCase() ?? "C"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {c.name}
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)]">
                          {c.primary_staff_id === staffId
                            ? "Primary trainer"
                            : "Last interaction"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </Panel>

              {/* Schedule for today */}
              <Panel
                title="Plan for Today"
                icon={Calendar}
                isLoading={checkinsLoading}
                empty={todaySchedule.length === 0}
                emptyText="Nothing scheduled for today."
              >
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {todaySchedule.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold flex-shrink-0">
                        {new Date(s.scheduled_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {s.type === "call"
                            ? "Call"
                            : s.type === "video"
                            ? "Video"
                            : "Chat"}
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)]">
                          {clientName(allClients, s.client_id)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Plans */}
              <Panel
                title="Programs"
                icon={Dumbbell}
                isLoading={plansLoading}
                empty={staffPlans.length === 0}
                emptyText="No active programs for this staff member's clients."
              >
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {staffPlans.slice(0, 20).map((p) => (
                    <Link
                      key={p.id}
                      href={`/workout-plans/${p.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-[var(--text-primary)] text-xs font-bold flex-shrink-0">
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {p.title}
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)]">
                          {p.status} · {p.days?.length ?? 0} days
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </Panel>

              {/* Recent activity */}
              <Panel
                title="Recent Activity"
                icon={Activity}
                isLoading={activitiesLoading}
                empty={staffActivities.length === 0}
                emptyText="No recent activity recorded."
              >
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {staffActivities.slice(0, 20).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold flex-shrink-0">
                        {a.client_name?.[0]?.toUpperCase() ?? "A"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] truncate">
                          {actionLabel(a.action)}
                          {a.client_name && (
                            <span className="text-[var(--text-secondary)]">
                              {" "}
                              for{" "}
                              <span className="font-medium text-[var(--text-primary)]">
                                {a.client_name}
                              </span>
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                          {a.created_at ? formatTimeAgo(a.created_at) : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function clientName(clients: Client[], clientId: string): string {
  return clients.find((c) => c.id === clientId)?.name ?? "Unknown client";
}

function StatCard({
  icon: Icon,
  label,
  value,
  isLoading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="flex items-center gap-2 mb-2 text-[var(--text-secondary)]">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-12" />
      ) : (
        <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      )}
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
  isLoading,
  empty,
  emptyText,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  isLoading: boolean;
  empty: boolean;
  emptyText: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-[var(--accent)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
      </div>

      {isLoading ? (
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
      ) : empty ? (
        <p className="text-sm text-[var(--text-secondary)]">{emptyText}</p>
      ) : (
        children
      )}
    </div>
  );
}
