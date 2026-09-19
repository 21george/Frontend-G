"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useStaffList, useUpdateStaffRole } from "@/hooks/useStaff";
import { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";
import { AnimatedSearch } from "@/components/ui/AnimatedSearch";
import { QueryWrapper } from "@/components/ui/QueryWrapper";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/button";
import FilterBreadcrumb from "@/components/ui/Breadcrumb";
import { motion } from "framer-motion";
import { InviteStaffModal } from "@/components/InviteStaffModal";
import { DeactivateStaffModal } from "@/components/DeactivateStaffModal";
import {
  STAFF_ROLE_LABELS,
  type StaffMember,
  type StaffRole,
  type StaffStatus,
} from "@/types";

const ROLES: StaffRole[] = [
  "admin",
  "manager",
  "front_desk",
  "instructor_coach",
];

const statusConfig: Record<
  StaffStatus,
  { label: string; lightClass: string; darkClass: string }
> = {
  active: {
    label: "Active",
    lightClass:
      "bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-2xl",
    darkClass:
      "dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 rounded-2xl",
  },
  invited: {
    label: "Invited",
    lightClass:
      "bg-blue-50 text-blue-700 border border-blue-200/60 rounded-2xl",
    darkClass:
      "dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 rounded-2xl",
  },
  deactivated: {
    label: "Deactivated",
    lightClass:
      "bg-slate-100 text-slate-600 border border-slate-200 rounded-2xl",
    darkClass:
      "dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-700 rounded-2xl",
  },
};

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

export default function TeamSettingsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toDeactivate, setToDeactivate] = useState<StaffMember | null>(null);
  const PER_PAGE = 10;

  const staffQuery = useStaffList();
  const allStaff = staffQuery.data ?? [];
  const updateRole = useUpdateStaffRole();

  // Client-side search
  const searchedStaff = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allStaff;
    return allStaff.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term),
    );
  }, [allStaff, search]);

  // Filter staff
  const filteredStaff = useMemo(() => {
    let list = searchedStaff;
    if (filter === "active")
      list = searchedStaff.filter((s) => s.status === "active");
    else if (filter === "invited")
      list = searchedStaff.filter((s) => s.status === "invited");
    else if (filter === "deactivated")
      list = searchedStaff.filter((s) => s.status === "deactivated");
    else if (filter === "admin")
      list = searchedStaff.filter((s) => s.role === "admin");
    else if (filter === "manager")
      list = searchedStaff.filter((s) => s.role === "manager");
    else if (filter === "coach")
      list = searchedStaff.filter((s) => s.role === "instructor_coach");
    else if (filter === "front_desk")
      list = searchedStaff.filter((s) => s.role === "front_desk");

    // Sort active first, then by name
    list = [...list].sort((a, b) => {
      const statusOrder = { active: 0, invited: 1, deactivated: 2 };
      const aOrder = statusOrder[a.status];
      const bOrder = statusOrder[b.status];
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (a.name || "").localeCompare(b.name || "");
    });

    return list;
  }, [searchedStaff, filter]);

  // Reset page when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / PER_PAGE));
  const startIndex = (page - 1) * PER_PAGE;
  const paginatedStaff = filteredStaff.slice(startIndex, startIndex + PER_PAGE);

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

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Settings
              </Link>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Team
            </h1>
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

        {/* Search Bar */}
        <AnimatedSearch
          className="relative mb-4"
          iconClassName="left-4 w-4 h-4"
          active={search.length > 0}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff"
            className="w-full sm:w-[12rem] py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] bg-white dark:bg-neutral-900 border border-[var(--border)] rounded-lg placeholder-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-brand-700/30 focus:ring-2 focus:ring-brand-700/20 transition-colors"
          />
        </AnimatedSearch>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <FilterBreadcrumb
            items={[
              { key: "all", label: "All", count: stats.total },
              { key: "active", label: "Active", count: stats.active },
              { key: "invited", label: "Invited", count: stats.invited },
              {
                key: "deactivated",
                label: "Deactivated",
                count: stats.deactivated,
              },
              { key: "admin", label: "Admin", count: stats.admin },
              { key: "manager", label: "Manager", count: stats.manager },
              { key: "coach", label: "Coach", count: stats.coach },
              {
                key: "front_desk",
                label: "Front Desk",
                count: stats.frontDesk,
              },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>

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
          emptyIcon={Users}
          emptyTitle="No staff yet"
          emptyDescription="You're currently the only member of your organization. Invite trainers, managers or front-desk staff to collaborate."
          emptyAction={
            <Button
              onClick={() => setInviteOpen(true)}
              className="bg-brand-600 text-white hover:bg-brand-700"
            >
              <Plus className="w-4 h-4" /> Invite Staff
            </Button>
          }
          isEmpty={() => filteredStaff.length === 0}
        >
          {() => (
            <div className="relative p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      {filter === "all" ? "All Staff" : "Filtered Staff"}
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
                  const status = statusConfig[staff.status];
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
                              <div className="h-10 w-10 bg-gradient-to-br from-[#132e35] to-[#0b1e22] rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                {staff.name?.[0]?.toUpperCase() ??
                                  staff.email?.[0]?.toUpperCase() ??
                                  "S"}
                              </div>
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
                            <span
                              className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight ${status.lightClass} ${status.darkClass}`}
                            >
                              {status.label}
                            </span>
                          </div>

                          {/* Invited */}
                          <div className="col-span-2 hidden lg:block">
                            {staff.invited_at ? (
                              <span className="text-sm text-[var(--text-secondary)]">
                                {new Date(staff.invited_at).toLocaleDateString(
                                  "en-US",
                                )}
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

              {/* Pagination */}
              <div className="mt-4 px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">
                  Showing {startIndex + 1}-
                  {Math.min(startIndex + PER_PAGE, filteredStaff.length)} of{" "}
                  {filteredStaff.length} staff
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-secondary)] mr-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 border rounded-xl border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-50"
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 border rounded-xl border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-50"
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </QueryWrapper>
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
