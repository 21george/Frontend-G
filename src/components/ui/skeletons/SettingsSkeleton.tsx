import { Skeleton } from "@/components/ui/Skeleton";

export function SettingsSkeleton() {
  return (
    <div className="mx-auto pb-8">
      {/* Page header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-40" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile card */}
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <Skeleton className="h-5 w-36" />
              </div>
              <Skeleton className="h-4 w-10" />
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-5">
                <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <div className="flex gap-2 pt-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Account & Security */}
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)]">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="divide-y divide-[var(--border)]">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3.5 px-6"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="w-5 h-5" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-[var(--bg-card)] rounded-xl border border-red-200 dark:border-red-900/30 overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)]">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)]">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="divide-y divide-[var(--border)]">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3.5 px-6"
                >
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Billing */}
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)]">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
