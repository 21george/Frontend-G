"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  useStaffList,
  useUpdateStaffRole,
  useStaffActivities,
} from "@/hooks/useStaff";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Users,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Ban,
  UserPlus,
  Shield,
  Crown,
  Briefcase,
  User,
  Activity,
  Clock,
  Calendar,
  Dumbbell,
  Video,
  Apple,
} from "lucide-react";
import { QueryWrapper } from "@/components/ui/QueryWrapper";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/Avatar";
import { SearchBar } from "@/components/ui/SearchBar";
import { FilterPills } from "@/components/ui/FilterPills";
import { Pagination } from "@/components/ui/Pagination";
import { StaffStatusBadge } from "@/components/staff/StaffStatusBadge";
import { useClientSideFilter } from "@/hooks/useClientSideFilter";
import { motion } from "framer-motion";
import { InviteStaffModal } from "@/components/InviteStaffModal";
import { DeactivateStaffModal } from "@/components/DeactivateStaffModal";
import {
  STAFF_ROLE_LABELS,
  type StaffMember,
  type StaffRole,
} from "@/types";

const ROLES: StaffRole[] = [
  "admin",
  "manager",
  "front_desk",
  "instructor_coach",
];


const roleIcons: Record<StaffRole, typeof Shield> = {
  admin: Crown,
  manager: Briefcase,
  front_desk: User,
  instructor_coach: Shield,
};

type FilterKey =
  | "all"
  | "active"
  | "invited"
  | "deactivated"
  | "admin"
  | "manager"
  | "coach"
  | "front_desk";

type ActivityCategory =
  | "all"
  | "schedule"
  | "workout"
  | "session"
  | "nutrition";

const CATEGORY_FILTERS: {
  key: ActivityCategory;
  label: string;
  actions: string[];
  icon: typeof Activity;
}[] = [
  { key: "all", label: "All", actions: [], icon: Activity },
  {
    key: "schedule",
    label: "Schedule",
    actions: ["checkin_scheduled"],
    icon: Calendar,
  },
  {
    key: "workout",
    label: "Workout Plans",
    actions: ["workout_plan_created", "workout_plan_assigned"],
    icon: Dumbbell,
  },
  {
    key: "session",
    label: "1-on-1 Sessions",
    actions: ["coaching_session_created"],
    icon: Video,
  },
  {
    key: "nutrition",
    label: "Nutrition Plans",
    actions: ["nutrition_plan_created", "nutrition_plan_assigned"],
    icon: Apple,
  },
];

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

export default function TeamSettingsPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toDeactivate, setToDeactivate] = useState<StaffMember | null>(null);
  const [view, setView] = useState<"members" | "activity">("members");
  const [activityPage, setActivityPage] = useState(1);
  const [activityCategory, setActivityCategory] =
    useState<ActivityCategory>("all");

  const staffQuery = useStaffList();
  const allStaff: StaffMember[] = staffQuery.data?.data ?? [];
  const updateRole = useUpdateStaffRole();
  const { data: activitiesData, isLoading: activitiesLoading } =
    useStaffActivities(activityPage);
  const activities = activitiesData?.data ?? [];
  const activityTotal = activitiesData?.pagination?.total ?? 0;
  const activityPerPage = activitiesData?.pagination?.per_page ?? 50;
  const activityTotalPages = Math.max(
    1,
    Math.ceil(activityTotal / activityPerPage),
  );

  const filteredActivities = useMemo(() => {
    const cat = CATEGORY_FILTERS.find((c) => c.key === activityCategory);
    if (!cat || cat.actions.length === 0) return activities;
    return activities.filter((a) => cat.actions.includes(a.action));
  }, [activities, activityCategory]);

  const staffPhotoMap = useMemo(() => {
    const map = new Map<string, string | undefined>();
    allStaff.forEach((s) => map.set(s.id, s.profile_photo ?? undefined));
    return map;
  }, [allStaff]);

  // Stats
  const stats = useMemo(() => {
    const active = allStaff.filter((s) => s.status === "active").length;
    const invited = allStaff.filter((s) => s.status === "invited").length;
    const deactivated = allStaff.filter(
      (s) => s.status === "deactivated",
    ).length;
    const admin = allStaff.filter((s) => s.role === "admin").length;
    const manager = allStaff.filter((s) => s.role === "manager").length;
    const coach = allStaff.filter((s) => s.role === "instructor_coach").length;
    const frontDesk = allStaff.filter((s) => s.role === "front_desk").length;

    return {
      total: allStaff.length,
      active,
      invited,
      deactivated,
      admin,
      manager,
      coach,
      frontDesk,
    };
  }, [allStaff]);

  // Use shared filter hook
  const {
    paginatedData: paginatedStaff,
    page,
    setPage,
    totalPages,
    totalItems: filteredCount,
    search,
    setSearch,
    activeFilter,
    setActiveFilter,
  } = useClientSideFilter<StaffMember>({
    data: allStaff,
    searchFn: (s, q) =>
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      false,
    filterFn: (s, filter) => {
      if (filter === "all") return true;
      if (["active", "invited", "deactivated"].includes(filter))
        return s.status === filter;
      if (filter === "coach") return s.role === "instructor_coach";
      return s.role === filter;
    },
    perPage: 10,
  });

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Invite trainers, managers and front-desk staff to your
              organization and control what each of them can access.
            </p>
          </div>
          <Button
            onClick={() => setInviteOpen(true)}
            className="bg-brand-600 text-white hover:bg-brand-700"
          >
            <UserPlus className="w-4 h-4" />
            Invite Staff
          </Button>
        </div>

        {/* View Tabs */}
        <div className="flex items-center border-b border-[var(--border)] mb-6">
          <button
            onClick={() => setView("members")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              view === "members"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Team Members
          </button>
          <button
            onClick={() => setView("activity")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              view === "activity"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Activity Log
          </button>
        </div>

        {view === "members" && (
          <>
            {/* Search Bar */}
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search staff"
              className="max-w-xs mb-4"
            />

            {/* Filter Pills */}
            <FilterPills
              filters={[
                { key: "all", label: "All", count: stats.total },
                { key: "active", label: "Active", count: stats.active },
                { key: "invited", label: "Invited", count: stats.invited },
                { key: "deactivated", label: "Deactivated", count: stats.deactivated },
                { key: "admin", label: "Admin", count: stats.admin },
                { key: "manager", label: "Manager", count: stats.manager },
                { key: "coach", label: "Coach", count: stats.coach },
                { key: "front_desk", label: "Front Desk", count: stats.frontDesk },
              ]}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              className="mb-6"
            />

            {/* Staff Table — Card-based grid */}
            <QueryWrapper
              query={staffQuery}
              skeleton={
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-5 border border-[var(--border)] rounded-xl bg-white dark:bg-neutral-900"
                    >
                      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-56" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  ))}
                </div>
              }
              emptyIcon={<Users className="w-8 h-8" />}
              emptyTitle={
                allStaff.length === 0 ? "No staff yet" : "No matching staff"
              }
              emptyDescription={
                allStaff.length === 0
                  ? "You're currently the only member of your organization. Invite trainers, managers or front-desk staff to collaborate."
                  : "Try adjusting your search or filters to find who you're looking for."
              }
              emptyAction={
                allStaff.length === 0 ? (
                  <Button
                    onClick={() => setInviteOpen(true)}
                    className="bg-brand-600 text-white hover:bg-brand-700"
                  >
                    <Plus className="w-4 h-4" /> Invite Staff
                  </Button>
                ) : undefined
              }
              isEmpty={() => filteredCount === 0}
            >
              {() => (
                <div className="relative p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                          {activeFilter === "all" ? "All Staff" : "Filtered Staff"}
                        </h2>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-[var(--text-secondary)]">
                          {paginatedStaff.length} shown
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          Live
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Column Headers */}
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                    <div className="col-span-4 sm:col-span-4">Staff</div>
                    <div className="col-span-2 hidden sm:block">Role</div>
                    <div className="col-span-2 hidden md:block">Status</div>
                    <div className="col-span-2 hidden lg:block">Invited</div>
                    <div className="col-span-8 sm:col-span-4 lg:col-span-2 text-right">
                      Actions
                    </div>
                  </div>

                  {/* Card Rows */}
                  <motion.div
                    className="space-y-2"
                    variants={{
                      visible: {
                        transition: {
                          staggerChildren: 0.06,
                          delayChildren: 0.05,
                        },
                      },
                    }}
                    initial="hidden"
                    animate="visible"
                  >
                    {paginatedStaff.map((staff: StaffMember) => {
                      const RoleIcon = roleIcons[staff.role];
                      const statusGradient =
                        staff.status === "deactivated"
                          ? "from-slate-500/10 to-transparent"
                          : staff.status === "invited"
                            ? "from-blue-500/10 to-transparent"
                            : "from-emerald-500/10 to-transparent";

                      return (
                        <motion.div
                          key={staff.id}
                          variants={{
                            hidden: {
                              opacity: 0,
                              x: -20,
                              scale: 0.97,
                            },
                            visible: {
                              opacity: 1,
                              x: 0,
                              scale: 1,
                              transition: {
                                type: "spring",
                                stiffness: 400,
                                damping: 28,
                                mass: 0.6,
                              },
                            },
                          }}
                          whileHover={{
                            y: -1,
                            transition: {
                              type: "spring",
                              stiffness: 400,
                              damping: 25,
                            },
                          }}
                          className="relative cursor-pointer"
                        >
                          <div className="relative bg-[var(--bg-card)] dark:bg-white/[0.03] p-4 overflow-hidden transition-colors hover:border-[var(--border-hover)]">
                            {/* Status gradient overlay */}
                            <div
                              className={`absolute inset-0 bg-gradient-to-l ${statusGradient} pointer-events-none`}
                              style={{
                                backgroundSize: "25% 100%",
                                backgroundPosition: "right",
                                backgroundRepeat: "no-repeat",
                              }}
                            />

                            <div className="relative grid grid-cols-12 gap-4 items-center">
                              {/* Staff */}
                              <div className="col-span-12 sm:col-span-4">
                                <div className="flex items-center gap-3">
                                  <Avatar
                                    name={staff.name}
                                    photo={staff.profile_photo}
                                    size="h-10 w-10"
                                    variant="colored"
                                    shape="circle"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                        {staff.name || "—"}
                                      </span>
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)]">
                                      {staff.email}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Role */}
                              <div className="col-span-6 sm:col-span-2 hidden sm:block">
                                {staff.status === "deactivated" ? (
                                  <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                                    <RoleIcon className="w-3.5 h-3.5" />
                                    {STAFF_ROLE_LABELS[staff.role]}
                                  </span>
                                ) : (
                                  <select
                                    value={staff.role}
                                    disabled={updateRole.isPending}
                                    onChange={(e) =>
                                      updateRole.mutate({
                                        id: staff.id,
                                        role: e.target.value as StaffRole,
                                      })
                                    }
                                    className="px-2 py-1 text-xs border bg-white dark:bg-white/[0.04] text-[var(--text-primary)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-brand-700/30"
                                  >
                                    {ROLES.map((r) => (
                                      <option key={r} value={r}>
                                        {STAFF_ROLE_LABELS[r]}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>

                              {/* Status */}
                              <div className="col-span-6 sm:col-span-2 hidden md:block">
                                <StaffStatusBadge status={staff.status} />
                              </div>

                              {/* Invited */}
                              <div className="col-span-2 hidden lg:block">
                                {staff.invited_at ? (
                                  <span className="text-sm text-[var(--text-secondary)]">
                                    {new Date(
                                      staff.invited_at,
                                    ).toLocaleDateString("en-US")}
                                  </span>
                                ) : (
                                  <span className="text-sm text-[var(--text-secondary)]">
                                    —
                                  </span>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="col-span-12 sm:col-span-4 lg:col-span-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Link
                                    href={`/settings/team/${staff.id}`}
                                    className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                                    title="View staff"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Link>
                                  {staff.status !== "deactivated" && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setToDeactivate(staff);
                                      }}
                                      className="inline-flex items-center gap-1.5 p-2 rounded-lg text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                      title="Deactivate"
                                    >
                                      <Ban className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    totalItems={filteredCount}
                    perPage={10}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </QueryWrapper>
          </>
        )}

        {view === "activity" && (
          <>
            <FilterPills
              filters={CATEGORY_FILTERS.map((cat) => {
                const Icon = cat.icon;
                return {
                  key: cat.key,
                  label: cat.label,
                  icon: <Icon className="w-3 h-3" />,
                };
              })}
              activeFilter={activityCategory}
              onFilterChange={(key) => setActivityCategory(key as ActivityCategory)}
              className="mb-6"
            />

            {/* Activity List */}
            {activitiesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-5 border border-[var(--border)] rounded-xl bg-white dark:bg-neutral-900"
                  >
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)]">
                <Activity className="w-8 h-8 mb-3" />
                <p className="text-sm font-medium">No activities found</p>
                <p className="text-xs mt-1">
                  {activityCategory !== "all"
                    ? "Try selecting a different category."
                    : "Team activity will appear here as staff perform actions."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredActivities.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-4 p-4 border border-[var(--border)] rounded-xl bg-white dark:bg-neutral-900 hover:bg-[var(--bg-subtle)] transition-colors"
                  >
                    <Avatar
                      name={a.staff_name}
                      photo={
                        a.staff_id ? staffPhotoMap.get(a.staff_id) : undefined
                      }
                      size="h-10 w-10"
                      variant="colored"
                      shape="circle"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)]">
                        <span className="font-medium">
                          {a.staff_name ?? "Staff"}
                        </span>{" "}
                        <span className="text-[var(--text-secondary)]">
                          {actionLabel(a.action)}
                        </span>
                        {a.client_name && (
                          <>
                            {" "}
                            <span className="text-[var(--text-secondary)]">
                              {" "}
                              for{" "}
                            </span>
                            <Link
                              href={`/clients/${a.client_id}`}
                              className="font-medium text-[var(--text-primary)] hover:underline"
                            >
                              {a.client_name}
                            </Link>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {a.created_at ? formatTimeAgo(a.created_at) : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Activity Pagination */}
            {!activitiesLoading &&
              filteredActivities.length > 0 &&
              activityTotalPages > 1 && (
                <div className="mt-4 px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">
                    Page {activityPage} of {activityTotalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 border rounded-xl border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-50"
                      disabled={activityPage <= 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setActivityPage((p) =>
                          Math.min(activityTotalPages, p + 1),
                        )
                      }
                      className="p-1.5 border rounded-xl border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-50"
                      disabled={activityPage >= activityTotalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
          </>
        )}
      </div>

      <InviteStaffModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
      <DeactivateStaffModal
        staff={toDeactivate}
        allStaff={allStaff}
        onClose={() => setToDeactivate(null)}
      />
    </DashboardLayout>
  );
}
