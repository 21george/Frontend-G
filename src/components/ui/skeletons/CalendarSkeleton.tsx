import { Skeleton } from "@/components/ui/Skeleton";

export function CalendarSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-page)]">
      {/* Header */}
      <header className="px-6 sm:px-10 pt-8 pb-6">
        <div className="space-y-2 mb-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden px-6 sm:px-10 pb-8">
        <div className="flex-1 flex flex-col gap-8 overflow-auto">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Mini calendar */}
            <div className="flex-shrink-0">
              <Skeleton className="h-72 w-72 rounded-xl" />
            </div>

            {/* Event filter */}
            <div className="flex-1">
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>

            {/* Today's schedule */}
            <div className="flex-shrink-0">
              <Skeleton className="h-72 w-64 rounded-xl" />
            </div>
          </div>

          {/* Month view */}
          <div className="flex-1">
            <Skeleton className="h-[28rem] w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
