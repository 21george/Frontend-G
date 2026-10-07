import { StatusBadge } from "@/components/ui/StatusBadge";

const variantMap = {
  scheduled: {
    label: "Scheduled",
    dot: "bg-blue-500",
    className:
      "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-500/20",
  },
  completed: {
    label: "Completed",
    dot: "bg-emerald-500",
    className:
      "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-500/20",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-slate-400",
    className:
      "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-white/10",
  },
  overdue: {
    label: "Overdue",
    dot: "bg-red-500",
    className:
      "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border-red-200/60 dark:border-red-500/20",
  },
  default: {
    label: "Scheduled",
    dot: "bg-blue-500",
    className:
      "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-500/20",
  },
};

interface CheckinStatusBadgeProps {
  status: string;
  className?: string;
}

export function CheckinStatusBadge({ status, className }: CheckinStatusBadgeProps) {
  return <StatusBadge status={status} variantMap={variantMap} className={className} />;
}
