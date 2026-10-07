import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Invoice } from "@/types";

const variantMap = {
  paid: {
    label: "Paid",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  },
  open: {
    label: "Pending",
    className:
      "bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  },
  void: {
    label: "Void",
    className:
      "bg-slate-50 text-slate-600 border-slate-200/50 dark:bg-white/5 dark:text-slate-400 dark:border-white/10",
  },
  uncollectible: {
    label: "Failed",
    className:
      "bg-red-50 text-red-700 border-red-200/50 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  },
};

interface InvoiceStatusBadgeProps {
  status: Invoice["status"];
  className?: string;
}

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  return <StatusBadge status={status} variantMap={variantMap} className={className} />;
}
