"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useClients, useCheckins, useWorkoutPlans } from "@/lib/hooks";
import { useMemo } from "react";
import { Users, Calendar, TrendingUp, Briefcase } from "lucide-react";
import { parseDateValue } from "@/lib/utils";
import type {
  Client,
  CheckinMeeting,
  WorkoutPlan,
  PaginatedResponse,
} from "@/types";
import { isToday, startOfWeek, endOfWeek } from "date-fns";
import { motion } from "framer-motion";
import { AISuggestionBanner } from "@/components/dashboard/AISuggestionBanner";
import { SessionVolumeHeatmap } from "@/components/dashboard/SessionVolumeHeatmap";
import { UpcomingSessions } from "@/components/dashboard/UpcomingSessions";
import { UpcomingCoachingSessions } from "@/components/dashboard/UpcomingCoachingSessions";
import { ClientWorkload } from "@/components/dashboard/ClientWorkload";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TeamOverview } from "@/components/dashboard/TeamOverview";
import { DashboardSkeleton } from "@/components/ui/skeletons";
import { useAuthStore } from "@/store/auth";
import { PaymentMethodPrompt } from "@/components/billing/PaymentMethodPrompt";

function useTodayString() {
  return useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [],
  );
}

export default function DashboardPage() {
  const { data: clientsData, isLoading: clientsLoading } = useClients();
  const { data: checkinsData, isLoading: checkinsLoading } = useCheckins();
  const { data: workoutData, isLoading: plansLoading } = useWorkoutPlans();
  const { isStaff, staffRole } = useAuthStore();
  const kpiLoading = clientsLoading || checkinsLoading || plansLoading;
  const todayStr = useTodayString();
  // Instructors, managers, and admins (plus the owner coach) can see the team
  // overview on the dashboard. Front-desk staff do not need this view.
  const canViewTeamOverview =
    !isStaff || staffRole === "admin" || staffRole === "manager";

  const clients: Client[] = useMemo(
    () => (clientsData as PaginatedResponse<Client> | undefined)?.data ?? [],
    [clientsData],
  );

  const checkins: CheckinMeeting[] = useMemo(
    () => (checkinsData as CheckinMeeting[] | undefined) ?? [],
    [checkinsData],
  );

  const workoutPlans: WorkoutPlan[] = useMemo(
    () =>
      (workoutData as PaginatedResponse<WorkoutPlan> | undefined)?.data ??
      (Array.isArray(workoutData) ? (workoutData as WorkoutPlan[]) : []),
    [workoutData],
  );

  const clientMap = useMemo(
    () => new Map<string, Client>(clients.map((c) => [c.id, c])),
    [clients],
  );

  const activeClients = useMemo(
    () => clients.filter((c) => c.active && !c.is_blocked).length,
    [clients],
  );

  const inactiveCount = useMemo(
    () => clients.filter((c) => !c.active || !!c.is_blocked).length,
    [clients],
  );

  const todaySessions = useMemo(
    () =>
      checkins.filter((c) => {
        const d = parseDateValue(c.scheduled_at);
        return d && isToday(d);
      }).length,
    [checkins],
  );

  const thisWeekSessions = useMemo(() => {
    const ws = startOfWeek(new Date(), { weekStartsOn: 1 });
    const we = endOfWeek(new Date(), { weekStartsOn: 1 });
    return checkins.filter((c) => {
      const d = parseDateValue(c.scheduled_at);
      return d && d >= ws && d <= we;
    }).length;
  }, [checkins]);

  const activePlans = useMemo(
    () => workoutPlans.filter((p) => p.status === "active").length,
    [workoutPlans],
  );

  if (kpiLoading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[var(--bg-page)] px-6 sm:px-10 py-8">
        {/* Welcome header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="flex items-start justify-between mb-6" >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#888780] dark:text-[#FAFAFA]/40 mb-1">
              {todayStr}
            </p>
          </div>
        </motion.div>

        {/* Payment Method Prompt */}
        <PaymentMethodPrompt />

        {/* AI Insight Banner */}
        <AISuggestionBanner
          inactiveCount={inactiveCount}
          todayCount={todaySessions}
        />
        <div className="mb-4 border-[#132E35]/20 dark:border-[#132E35]/60">
          <SessionVolumeHeatmap checkins={checkins} />
        </div>

        {/* Row 1b: Upcoming 1-on-1 Coaching Sessions */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <UpcomingCoachingSessions />
          <UpcomingSessions checkins={checkins} clientMap={clientMap} />
        </div>

        {/* Team Overview — owner / admin only */}
        {canViewTeamOverview && <TeamOverview clients={clients} />}

        {/* Row 2: Client Workload + KPI 2x2 Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <ClientWorkload clients={clients} checkins={checkins} />

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="xl:col-span-2 grid grid-cols-2 gap-4 content-start">
            <KpiCard
              label="Total Clients"
              value={(clientsData as PaginatedResponse<Client> | undefined)?.pagination?.total ?? clients.length}
              icon={Users}
              trend={{ value: `${activeClients} active`, up: true }}
              delay={0.24}
            />

            <KpiCard
              label="Active Plans"
              value={activePlans}
              icon={Briefcase}
              trend={{
                value: `${workoutPlans.length > 0 ? Math.round((activePlans / workoutPlans.length) * 100) : 0}% of total`,
                up: activePlans > 0,
              }}
              delay={0.3}
            />
            <KpiCard
              label="Today's Sessions"
              value={todaySessions}
              icon={Calendar}
              trend={{
                value: String(todaySessions),
                up: todaySessions > 0,
              }}
              delay={0.36}
            />
            <KpiCard
              label="This Week"
              value={thisWeekSessions}
              icon={TrendingUp}
              trend={{
                value: `${todaySessions} today`,
                up: thisWeekSessions > 0,
              }}
              delay={0.42}
            />
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
