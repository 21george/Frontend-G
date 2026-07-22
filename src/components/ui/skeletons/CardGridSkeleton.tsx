import { Skeleton } from "@/components/ui/Skeleton";

interface CardGridSkeletonProps {
  count?: number;
  columns?: number;
  showSearch?: boolean;
}

export function CardGridSkeleton({
  count = 8,
  columns = 4,
  showSearch = true,
}: CardGridSkeletonProps) {
  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      )}

      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {[...Array(count)].map((_, i) => (
          <div
            key={i}
            className="bg-[var(--bg-card)] border border-[var(--border)] dark:border-white/[0.06] rounded-xl overflow-hidden"
          >
            <Skeleton className="h-32 w-full rounded-none" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-3 w-12 rounded-full" />
                <Skeleton className="h-3 w-10 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
