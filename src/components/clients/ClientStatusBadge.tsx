import { StatusBadge } from "@/components/ui/StatusBadge";

const variantMap = {
  active: {
    label: "Active",
    dot: "bg-emerald-500",
    className:
      "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-500/20",
  },
  blocked: {
    label: "Blocked",
    dot: "bg-red-500",
    className:
      "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border-red-200/60 dark:border-red-500/20",
  },
  "on-track": {
    label: "On Track",
    dot: "bg-blue-500",
    className:
      "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-500/20",
  },
  attention: {
    label: "Attention",
    dot: "bg-amber-500",
    className:
      "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-500/20",
  },
  completed: {
    label: "Completed",
    dot: "bg-emerald-500",
    className:
      "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-500/20",
  },
  "new-client": {
    label: "New",
    dot: "bg-sky-500",
    className:
      "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-500/20",
  },
  default: {
    label: "Active",
    dot: "bg-emerald-500",
    className:
      "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-500/20",
  },
};

interface ClientStatusBadgeProps {
  status: string;
  className?: string;
}

export function ClientStatusBadge({ status, className }: ClientStatusBadgeProps) {
  return <StatusBadge status={status} variantMap={variantMap} className={className} />;
}
