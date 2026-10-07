"use client";

import { useSyncExternalStore, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Activity,
  Calendar,
  Dumbbell,
  Briefcase,
  Ban,
  Loader2,
  Menu,
  Shield,
  Crown,
  User,
  Pencil,
  Check,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { DeactivateStaffModal } from "@/components/DeactivateStaffModal";
import { useAuthStore } from "@/store/auth";
import {
  useStaffMember,
  useStaffActivities,
  useStaffList,
  useDeactivateStaff,
  useUpdateStaffRole,
  useUpdateStaff,
} from "@/hooks/useStaff";
import { useClients, useCheckins, useWorkoutPlans } from "@/lib/hooks";
import {
  STAFF_ROLE_LABELS,
  type StaffRole,
  type StaffMember,
  type Client,
  type StaffActivity,
} from "@/types";
import type { PaginatedResponse, WorkoutPlan, CheckinMeeting } from "@/types";

const ROLES: StaffRole[] = [
  "admin",
  "manager",
  "front_desk",
  "instructor_coach",
];

const TABS = [
  { key: "clients", label: "Clients" },
  { key: "assignments", label: "Assignments" },
  { key: "schedule", label: "Schedule" },
  { key: "programs", label: "Programs" },
  { key: "activity", label: "Activity" },
];

const roleIcons: Record<StaffRole, typeof Shield> = {
  admin: Crown,
  manager: Briefcase,
  front_desk: User,
  instructor_coach: Shield,
};

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
    client_taken_on: "Took on client",
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

function computeAge(dob?: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export default function StaffMemberPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = typeof params.id === "string" ? params.id : "";
  const isClient = useIsClient();
  const { isStaff, staffRole } = useAuthStore();

  const [tab, setTab] = useState("clients");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toDeactivate, setToDeactivate] = useState<StaffMember | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<StaffRole>("instructor_coach");

  const { data: staff, isLoading: staffLoading } = useStaffMember(staffId);
  const { data: activitiesData, isLoading: activitiesLoading } =
    useStaffActivities(1);
  const { data: allStaffData } = useStaffList();
  const { data: clientsData, isLoading: clientsLoading } = useClients();
  const { data: checkinsData, isLoading: checkinsLoading } = useCheckins();
  const { data: plansData, isLoading: plansLoading } = useWorkoutPlans();

  const deactivateStaff = useDeactivateStaff();
  const updateRole = useUpdateStaffRole();
  const updateStaff = useUpdateStaff();

  useEffect(() => {
    if (staff) {
      setEditName(staff.name ?? "");
      setEditRole(staff.role);
    }
  }, [staff]);

  const handleSave = () => {
    if (!staff) return;
    updateStaff.mutate(
      { id: staff.id, name: editName, role: editRole },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      },
    );
  };

  const allStaff: StaffMember[] = allStaffData?.data ?? [];

  const allClients: Client[] =
    (clientsData as PaginatedResponse<Client> | undefined)?.data ?? [];
  const allCheckins: CheckinMeeting[] =
    (checkinsData as CheckinMeeting[] | undefined) ?? [];
  const allPlans: WorkoutPlan[] =
    (plansData as PaginatedResponse<WorkoutPlan> | undefined)?.data ??
    (Array.isArray(plansData) ? (plansData as WorkoutPlan[]) : []);

  const staffClients = allClients.filter(
    (c) => c.primary_staff_id === staffId || c.last_staff_id === staffId,
  );

  const primaryClients = allClients.filter(
    (c) => c.primary_staff_id === staffId,
  );

  const staffActivities: StaffActivity[] = (
    (activitiesData as { data: StaffActivity[] } | undefined)?.data ?? []
  ).filter((a) => a.staff_id === staffId);

  const today = new Date().toISOString().split("T")[0];
  const todaySchedule = allCheckins.filter((c) => {
    const scheduled = new Date(c.scheduled_at).toISOString().split("T")[0];
    return scheduled === today;
  });

  const staffPlans = allPlans.filter((p) =>
    p.client_ids?.some((cid) => staffClients.some((c) => c.id === cid)),
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

  if (isStaff && staffRole === "front_desk") {
    router.replace("/dashboard");
    return null;
  }

  const statusColor =
    staff?.status === "active"
      ? {
          text: "text-emerald-400",
          bg: "bg-emerald-400",
          border: "border-emerald-500/25",
          bgSoft: "bg-emerald-500/5",
          label: "Active",
        }
      : staff?.status === "invited"
        ? {
            text: "text-blue-400",
            bg: "bg-blue-400",
            border: "border-blue-500/25",
            bgSoft: "bg-blue-500/5",
            label: "Invited",
          }
        : {
            text: "text-slate-400",
            bg: "bg-slate-400",
            border: "border-slate-500/25",
            bgSoft: "bg-slate-500/5",
            label: "Deactivated",
          };

  if (staffLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col bg-[var(--bg-page)] dark:bg-[var(--bg-page)] min-h-[calc(100vh-4rem)]">
          <Skeleton className="h-11 w-full rounded-none border-b border-[var(--border)] dark:border-white/[0.06]" />
          <div className="flex flex-1">
            <Skeleton className="hidden md:block w-[300px] rounded-none border-r border-[var(--border)] dark:border-white/[0.06]" />
            <div className="flex-1 p-4 sm:p-6 space-y-4">
              <Skeleton className="h-7 w-52" />
              <Skeleton className="h-72 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!staff) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center bg-[var(--bg-page)] dark:bg-[var(--bg-page)] min-h-[calc(100vh-4rem)]">
          <p className="text-slate-500 text-sm">Staff member not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  const RoleIcon = roleIcons[staff.role];

  return (
    <DashboardLayout>
      <div className="flex flex-col bg-[var(--bg-page)] dark:bg-[var(--bg-page)] min-h-[calc(100vh-4rem)]">
        {/* Breadcrumb bar */}
        <div className="flex items-center justify-between px-3 sm:px-5 h-11 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1 -ml-1 text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              <Menu size={16} />
            </button>
            <Link
              href="/settings/team"
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Team</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline" />
            <span className="text-slate-700 dark:text-slate-300 truncate">
              {staff.name || staff.email}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {staff.status !== "deactivated" && (
              <button
                onClick={() => setToDeactivate(staff)}
                disabled={deactivateStaff.isPending}
                title="Deactivate staff member"
                className="inline-flex items-center gap-1.5 border border-red-200 dark:border-red-900/40 rounded-lg px-2 sm:px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {deactivateStaff.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Ban size={13} />
                )}
                <span className="hidden sm:inline">Deactivate</span>
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Mobile backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Left panel sidebar */}
          <aside
            className={`fixed inset-y-0 left-0 z-40 w-[85vw] max-w-[320px] sm:w-[300px] transform transition-transform duration-200 ease-out
              md:relative md:inset-auto md:z-auto md:translate-x-0 md:w-[300px] md:top-auto md:bottom-auto
              bg-[var(--bg-card)] dark:bg-[#0f1416] border-r border-[var(--border)] dark:border-white/[0.06]
              flex flex-col overflow-hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
          >
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-4 h-11 border-b border-[var(--border)] dark:border-white/[0.06] flex-shrink-0">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                Staff Profile
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                <ArrowLeft size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Avatar + name */}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#132e35] to-[#0b1e22] flex items-center justify-center text-white text-2xl font-bold">
                    {staff.name?.[0]?.toUpperCase() ??
                      staff.email?.[0]?.toUpperCase() ??
                      "S"}
                  </div>
                  {staff.status === "active" && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{
                        boxShadow: [
                          "0 0 0 0px rgba(163,230,53,0)",
                          "0 0 0 3px rgba(163,230,53,0.2)",
                          "0 0 0 0px rgba(163,230,53,0)",
                        ],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  {staff.name || "Unnamed staff"}
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {staff.email}
                </p>
                <div
                  className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight border ${statusColor.border} ${statusColor.bgSoft} ${statusColor.text}`}
                >
                  <span
                    className={`relative flex h-1.5 w-1.5 rounded-full ${statusColor.bg}`}
                  >
                    {staff.status === "active" && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
                  </span>
                  {statusColor.label}
                </div>
              </div>

              {/* Info section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <User size={12} className="text-[var(--text-secondary)]" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                      Details
                    </span>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#132E35] dark:text-[#2A96AD] hover:underline"
                    >
                      <Pencil size={10} /> Edit
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-[var(--text-tertiary)] mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-[12px] bg-[var(--bg-subtle)] dark:bg-[#FAFAFA]/[0.05] border border-[var(--border)] dark:border-white/[0.08] text-[var(--text-primary)] dark:text-[#FAFAFA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#132E35]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[var(--text-tertiary)] mb-1">
                        Role
                      </label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as StaffRole)}
                        className="w-full px-2.5 py-1.5 text-[12px] bg-[var(--bg-subtle)] dark:bg-[#FAFAFA]/[0.05] border border-[var(--border)] dark:border-white/[0.08] text-[var(--text-primary)] dark:text-[#FAFAFA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#132E35]"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {STAFF_ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleSave}
                        disabled={updateStaff.isPending}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold bg-[#132E35] dark:bg-[#2A96AD] text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {updateStaff.isPending ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          if (staff) {
                            setEditName(staff.name ?? "");
                            setEditRole(staff.role);
                          }
                        }}
                        disabled={updateStaff.isPending}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold border border-[var(--border)] dark:border-white/[0.08] text-[var(--text-secondary)] dark:text-[#FAFAFA]/60 rounded-md hover:bg-[var(--bg-subtle)] dark:hover:bg-[#FAFAFA]/[0.05] transition-colors disabled:opacity-50"
                      >
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[var(--text-tertiary)]">
                        Role
                      </span>
                      <span className="text-[12px] text-[var(--text-secondary)] dark:text-slate-300 flex items-center gap-1">
                        <RoleIcon className="w-3 h-3" />
                        {STAFF_ROLE_LABELS[staff.role]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[var(--text-tertiary)]">
                        Email
                      </span>
                      <span className="text-[12px] text-[var(--text-secondary)] dark:text-slate-300 truncate max-w-[140px]">
                        {staff.email}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[var(--text-tertiary)]">
                        Invited
                      </span>
                      <span className="text-[12px] text-[var(--text-secondary)] dark:text-slate-300">
                        {staff.invited_at
                          ? new Date(staff.invited_at).toLocaleDateString("en-US")
                          : "—"}
                      </span>
                    </div>
                    {staff.activated_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[var(--text-tertiary)]">
                          Activated
                        </span>
                        <span className="text-[12px] text-[var(--text-secondary)] dark:text-slate-300">
                          {new Date(staff.activated_at).toLocaleDateString(
                            "en-US",
                          )}
                        </span>
                      </div>
                    )}
                    {staff.date_of_birth && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[var(--text-tertiary)]">Age</span>
                        <span className="text-[12px] text-[var(--text-secondary)] dark:text-slate-300">
                          {computeAge(staff.date_of_birth)} years
                        </span>
                      </div>
                    )}
                    {staff.nationality && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[var(--text-tertiary)]">Nationality</span>
                        <span className="text-[12px] text-[var(--text-secondary)] dark:text-slate-300">
                          {staff.nationality}
                        </span>
                      </div>
                    )}
                    {staff.years_of_profession && staff.years_of_profession > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[var(--text-tertiary)]">Experience</span>
                        <span className="text-[12px] text-[var(--text-secondary)] dark:text-slate-300">
                          {staff.years_of_profession} years
                        </span>
                      </div>
                    )}
                    {staff.bio && (
                      <div className="pt-1">
                        <span className="text-[11px] text-[var(--text-tertiary)] block mb-0.5">About</span>
                        <p className="text-[12px] text-[var(--text-secondary)] dark:text-slate-300 leading-relaxed">
                          {staff.bio}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick stats in sidebar */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Activity
                    size={12}
                    className="text-[var(--text-secondary)]"
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                    Overview
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <SidebarStat
                    label="Clients"
                    value={staffClients.length}
                    isLoading={clientsLoading}
                  />
                  <SidebarStat
                    label="Plans"
                    value={staffPlans.length}
                    isLoading={plansLoading}
                  />
                  <SidebarStat
                    label="Today"
                    value={todaySchedule.length}
                    isLoading={checkinsLoading}
                  />
                  <SidebarStat
                    label="Activities"
                    value={staffActivities.length}
                    isLoading={activitiesLoading}
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT PANEL */}
          <main className="flex-1 flex flex-col overflow-hidden relative bg-[var(--bg-page)] dark:bg-[#060d10]">
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-[0.04]"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse 80% 50% at 20% 40%, #a3e635 0%, transparent 60%), radial-gradient(ellipse 60% 70% at 80% 80%, #22d3ee 0%, transparent 55%)",
              }}
            />

            <div className="flex-1 overflow-y-auto relative z-10">
              {/* Tab navigation */}
              <div className="sticky top-0 z-20 flex items-center border-b border-[var(--border)] dark:border-white/[0.06] bg-[var(--bg-card)]/90 dark:bg-[#0a1114]/90 backdrop-blur-xl px-2 sm:px-5 overflow-x-auto scrollbar-hide shadow-[0_2px_16px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_24px_-6px_rgba(0,0,0,0.4)]">
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--energy)]/30 dark:via-[#a3e635]/20 to-transparent"
                />
                {TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`relative px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-[12px] font-bold whitespace-nowrap transition-all ${
                      tab === key
                        ? "text-[var(--energy)] dark:text-[#a3e635]"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] dark:text-white/30 dark:hover:text-white/60"
                    }`}
                    style={{
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {label}
                    {tab === key && (
                      <motion.div
                        layoutId="activeStaffTab"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--energy)] dark:bg-[#a3e635] rounded-full"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-3 sm:p-6 space-y-4">
                <AnimatePresence mode="wait">
                  {tab === "clients" && (
                    <motion.div
                      key="clients"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ContentPanel
                        title="Clients"
                        icon={Users}
                        isLoading={clientsLoading}
                        empty={staffClients.length === 0}
                        emptyText="No clients assigned or recently handled."
                      >
                        <div className="space-y-2">
                          {staffClients.map((c) => (
                            <Link
                              key={c.id}
                              href={`/clients/${c.id}`}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                            >
                              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-[#132e35] to-[#0b1e22] text-white text-xs font-bold flex-shrink-0">
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
                      </ContentPanel>
                    </motion.div>
                  )}

                  {tab === "assignments" && (
                    <motion.div
                      key="assignments"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ContentPanel
                        title="Primary Assignments"
                        icon={Users}
                        isLoading={clientsLoading}
                        empty={primaryClients.length === 0}
                        emptyText="No clients currently assigned as primary coach."
                      >
                        <div className="space-y-2">
                          {primaryClients.map((c) => (
                            <Link
                              key={c.id}
                              href={`/clients/${c.id}`}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                            >
                              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-[#132e35] to-[#0b1e22] text-white text-xs font-bold flex-shrink-0">
                                {c.name?.[0]?.toUpperCase() ?? "C"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                  {c.name}
                                </p>
                                <p className="text-[11px] text-[var(--text-secondary)]">
                                  {c.last_staff_activity_at
                                    ? `Last activity ${formatTimeAgo(c.last_staff_activity_at)}`
                                    : "Assigned"}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </ContentPanel>
                    </motion.div>
                  )}

                  {tab === "schedule" && (
                    <motion.div
                      key="schedule"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ContentPanel
                        title="Plan for Today"
                        icon={Calendar}
                        isLoading={checkinsLoading}
                        empty={todaySchedule.length === 0}
                        emptyText="Nothing scheduled for today."
                      >
                        <div className="space-y-2">
                          {todaySchedule.map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                            >
                              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold flex-shrink-0">
                                {new Date(s.scheduled_at).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
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
                      </ContentPanel>
                    </motion.div>
                  )}

                  {tab === "programs" && (
                    <motion.div
                      key="programs"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ContentPanel
                        title="Programs"
                        icon={Dumbbell}
                        isLoading={plansLoading}
                        empty={staffPlans.length === 0}
                        emptyText="No active programs for this staff member's clients."
                      >
                        <div className="space-y-2">
                          {staffPlans.map((p) => (
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
                      </ContentPanel>
                    </motion.div>
                  )}

                  {tab === "activity" && (
                    <motion.div
                      key="activity"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ContentPanel
                        title="Recent Activity"
                        icon={Activity}
                        isLoading={activitiesLoading}
                        empty={staffActivities.length === 0}
                        emptyText="No recent activity recorded."
                      >
                        <div className="space-y-2">
                          {staffActivities.map((a) => (
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
                                  {a.created_at
                                    ? formatTimeAgo(a.created_at)
                                    : ""}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ContentPanel>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </main>
        </div>
      </div>

      <DeactivateStaffModal
        staff={toDeactivate}
        allStaff={allStaff}
        onClose={() => setToDeactivate(null)}
      />
    </DashboardLayout>
  );
}

function clientName(clients: Client[], clientId: string): string {
  return clients.find((c) => c.id === clientId)?.name ?? "Unknown client";
}

function SidebarStat({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: number;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white/[0.02] p-2.5 text-center">
      <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-1">
        {label}
      </div>
      {isLoading ? (
        <Skeleton className="h-5 w-8 mx-auto" />
      ) : (
        <div className="text-lg font-bold text-[var(--text-primary)]">
          {value}
        </div>
      )}
    </div>
  );
}

function ContentPanel({
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
