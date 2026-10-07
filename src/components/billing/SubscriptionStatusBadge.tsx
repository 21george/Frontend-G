import { StatusBadge } from "@/components/ui/StatusBadge";
import type { SubscriptionInfo } from "@/types";

const variantMap = {
  trialing: {
    label: "Free trial",
    dot: "bg-[var(--energy-dark)]",
    className:
      "bg-[var(--energy-light)]/40 dark:bg-[var(--energy)]/10 text-[var(--energy-dark)] dark:text-[var(--energy-light)] border-[var(--energy)]/30 dark:border-[var(--energy)]/20",
  },
  active: {
    label: "Active",
    dot: "bg-emerald-500",
    className:
      "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-500/20",
  },
  past_due: {
    label: "Payment failed",
    dot: "bg-red-500",
    className:
      "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border-red-200/60 dark:border-red-500/20",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-slate-400",
    className:
      "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-white/10",
  },
  default: {
    label: "No plan",
    dot: "bg-slate-400",
    className:
      "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-white/10",
  },
};

interface SubscriptionStatusBadgeProps {
  status: SubscriptionInfo["status"];
  isCancelling?: boolean;
  className?: string;
}

export function SubscriptionStatusBadge({
  status,
  isCancelling,
  className,
}: SubscriptionStatusBadgeProps) {
  if (isCancelling) {
    return (
      <StatusBadge
        status="cancelling"
        variantMap={{
          cancelling: {
            label: "Cancelling",
            dot: "bg-amber-500",
            className:
              "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-500/20",
          },
        }}
        className={className}
      />
    );
  }
  return <StatusBadge status={status} variantMap={variantMap} className={className} />;
}
