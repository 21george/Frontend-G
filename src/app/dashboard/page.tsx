"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/Skeleton";
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
import { ClientWorkload } from "@/components/dashboard/ClientWorkload";
import { KpiCard } from "@/components/dashboard/KpiCard";

export default function DashboardPage() {
  const { data: clientsData, isLoading: clientsLoading } = useClients();
  const { data: checkinsData, isLoading: checkinsLoading } = useCheckins();
  const { data: workoutData, isLoading: plansLoading } = useWorkoutPlans();
  const kpiLoading = clientsLoading || checkinsLoading || plansLoading;

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

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[var(--bg-page)] px-6 sm:px-10 py-8">
        {/* Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="flex items-start justify-between mb-6"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#888780] dark:text-[#FAFAFA]/40 mb-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </motion.div>

        {/* AI Insight Banner */}
        <AISuggestionBanner
          inactiveCount={inactiveCount}
          todayCount={todaySessions}
        />

        {/* Row 1: Session Volume Heatmap + Upcoming Sessions */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mb-4">
          <SessionVolumeHeatmap checkins={checkins} />
          <UpcomingSessions checkins={checkins} clientMap={clientMap} />
        </div>

        {/* Row 2: Client Workload + KPI 2x2 Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <ClientWorkload clients={clients} checkins={checkins} />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="xl:col-span-2 grid grid-cols-2 gap-4 content-start"
          >
            {kpiLoading ? (
              [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3"
                >
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))
            ) : (
              <>
                <KpiCard
                  label="Total Clients"
                  value={
                    (clientsData as PaginatedResponse<Client> | undefined)
                      ?.pagination?.total ?? clients.length
                  }
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
              </>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
