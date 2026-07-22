import { Skeleton } from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] px-6 sm:px-10 py-8 space-y-6">
      {/* Welcome header */}
      <div className="mb-6">
        <Skeleton className="h-3 w-48" />
      </div>

      {/* AI Banner */}
      <Skeleton className="h-16 w-full rounded-xl" />

      {/* Row 1: Heatmap + Upcoming */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="xl:col-span-2">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>

      {/* Row 1b: Coaching Sessions */}
      <Skeleton className="h-24 w-full rounded-xl" />

      {/* Row 2: Client Workload + KPI */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3">
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
        <div className="xl:col-span-2 grid grid-cols-2 gap-4 content-start">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
