"use client";

interface SegmentedProgressBarProps {
  percentage: number;
  segments?: number;
  completedDays?: number;
  totalDays?: number;
  className?: string;
}

export function SegmentedProgressBar({
  percentage,
  segments = 10,
  completedDays,
  totalDays,
  className = "",
}: SegmentedProgressBarProps) {
  const filledSegments = Math.max(
    0,
    Math.min(segments, Math.round((percentage / 100) * segments)),
  );

  // 3-color scheme: green complete, blue in-progress, gray not-started
  let activeColor = "bg-slate-400";
  if (percentage >= 100) {
    activeColor = "bg-emerald-500";
  } else if (percentage > 0) {
    activeColor = "bg-amber-600";
  }

  const inactiveColor = "bg-[var(--bg-subtle)] dark:bg-white/[0.06]";

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex gap-1 flex-1">
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              className={`h-6 flex-1 transition-all duration-500 rounded-4 ${
                i < filledSegments ? activeColor : inactiveColor
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-mono font-semibold text-[var(--text-primary)] min-w-[2.5rem] text-right">
          {percentage}%
        </span>
      </div>
      {completedDays !== undefined && totalDays !== undefined && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-secondary)]">
            {completedDays} of {totalDays} days trained
          </span>
          {percentage >= 100 && (
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Complete
            </span>
          )}
        </div>
      )}
    </div>
  );
}
