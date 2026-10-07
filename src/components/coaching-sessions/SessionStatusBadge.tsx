import { StatusBadge } from "@/components/ui/StatusBadge";

const variantMap = {
  live: {
    label: "Live",
    dot: "bg-red-500",
    className:
      "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border-red-200/60 dark:border-red-500/20",
  },
  upcoming: {
    label: "Upcoming",
    dot: "bg-blue-500",
    className:
      "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-500/20",
  },
  ended: {
    label: "Ended",
    dot: "bg-slate-400",
    className:
      "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-white/10",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-slate-400",
    className:
      "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-white/10",
  },
  default: {
    label: "Upcoming",
    dot: "bg-blue-500",
    className:
      "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-500/20",
  },
};

interface SessionStatusBadgeProps {
  status: string;
  className?: string;
}

export function SessionStatusBadge({ status, className }: SessionStatusBadgeProps) {
  return <StatusBadge status={status} variantMap={variantMap} className={className} />;
}
