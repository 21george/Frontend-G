import { Skeleton } from "@/components/ui/Skeleton";

export function PageSkeleton() {
  return (
    <div className="min-h-screen flex bg-[var(--bg-page)]">
      {/* Desktop sidebar placeholder */}
      <div
        className="hidden lg:block flex-shrink-0 border-r"
        style={{
          width: 256,
          backgroundColor: "var(--sidebar-bg)",
          borderColor: "var(--sidebar-bdr)",
        }}
      >
        <div className="p-4 space-y-6">
          {/* Brand */}
          <div className="flex items-center gap-3 px-2">
            <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
            <Skeleton className="h-5 w-24 flex-shrink-0" />
          </div>
          {/* Nav items */}
          <div className="space-y-2 px-2">
            {[...Array(9)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-9 w-full rounded-lg"
              />
            ))}
          </div>
          {/* Bottom user */}
          <div className="px-2 pt-6">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-h-screen overflow-x-hidden">
        <div className="px-3 sm:px-5 md:px-8 lg:px-10 pt-16 sm:pt-12 lg:pt-8 pb-6 sm:pb-10">
          {/* Header placeholder */}
          <div className="mb-6 flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          </div>

          {/* Content blocks */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
              <div className="xl:col-span-3 space-y-4">
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
              <div className="xl:col-span-2 space-y-4">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-72 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
