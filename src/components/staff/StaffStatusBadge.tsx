import { StatusBadge } from "@/components/ui/StatusBadge";

const variantMap = {
  active: {
    label: "Active",
    dot: "bg-emerald-500",
    className:
      "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-500/20",
  },
  invited: {
    label: "Invited",
    dot: "bg-blue-500",
    className:
      "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-500/20",
  },
  deactivated: {
    label: "Deactivated",
    dot: "bg-slate-400",
    className:
      "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-white/10",
  },
  default: {
    label: "Active",
    dot: "bg-emerald-500",
    className:
      "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-500/20",
  },
};

interface StaffStatusBadgeProps {
  status: string;
  className?: string;
}

export function StaffStatusBadge({ status, className }: StaffStatusBadgeProps) {
  return <StatusBadge status={status} variantMap={variantMap} className={className} />;
}
