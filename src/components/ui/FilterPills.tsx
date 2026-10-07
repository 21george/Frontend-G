import { cn } from "@/lib/utils";

interface FilterOption {
  key: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface FilterPillsProps {
  filters: FilterOption[];
  activeFilter: string;
  onFilterChange: (key: string) => void;
  className?: string;
}

export function FilterPills({
  filters,
  activeFilter,
  onFilterChange,
  className,
}: FilterPillsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {filters.map((filter) => {
        const isActive = activeFilter === filter.key;
        return (
          <button
            key={filter.key}
            type="button"
            onClick={() => onFilterChange(filter.key)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              isActive
                ? "bg-[var(--energy-light)]/50 border-[var(--energy)]/40 text-[var(--energy-dark)] dark:bg-[var(--energy)]/10 dark:text-[var(--energy-light)]"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-subtle)]",
            )}
          >
            {filter.icon}
            {filter.label}
            {filter.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0 rounded-full text-[10px] font-bold",
                  isActive
                    ? "bg-[var(--energy)]/20 text-[var(--energy-dark)]"
                    : "bg-[var(--bg-subtle)] text-[var(--text-tertiary)]",
                )}
              >
                {filter.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
