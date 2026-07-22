import { Skeleton } from "@/components/ui/Skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showSearch?: boolean;
  showFilters?: boolean;
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  showSearch = true,
  showFilters = true,
}: TableSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Search + filters */}
      {(showSearch || showFilters) && (
        <div className="flex flex-wrap items-center gap-3">
          {showSearch && <Skeleton className="h-10 w-52 rounded-lg" />}
          {showFilters && (
            <>
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </>
          )}
        </div>
      )}

      {/* Table header */}
      <div className="hidden md:grid gap-4 px-5 py-3 bg-[var(--bg-subtle)] dark:bg-white/[0.03] border-b border-[var(--border)] dark:border-white/[0.06] rounded-t-xl">
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
          }}
        >
          {[...Array(columns)].map((_, i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
      </div>

      {/* Table rows */}
      <div className="space-y-2">
        {[...Array(rows)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 border border-[var(--border)] dark:border-white/[0.06] rounded-xl bg-white dark:bg-neutral-900"
          >
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <div className="hidden sm:block flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="hidden md:block flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full flex-shrink-0" />
            <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
