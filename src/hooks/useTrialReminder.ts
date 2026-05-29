import { useMemo } from "react";
import { useAuthStore } from "@/store/auth";

const STORAGE_KEY = "trial_reminder_dismissed_until";
const THRESHOLD_DAYS = 3;

function getDismissedUntil(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const ts = parseInt(raw, 10);
  return isNaN(ts) ? null : ts;
}

function setDismissedUntil(hours: number) {
  if (typeof window === "undefined") return;
  const ts = Date.now() + hours * 60 * 60 * 1000;
  window.localStorage.setItem(STORAGE_KEY, String(ts));
}

function clearDismissedUntil() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export interface TrialReminderState {
  showReminder: boolean;
  daysLeft: number;
  trialEndsAt: string | null;
  dismiss: (hours?: number) => void;
  clearDismiss: () => void;
}

export function useTrialReminder(): TrialReminderState {
  const coach = useAuthStore((s) => s.coach);

  const { showReminder, daysLeft, trialEndsAt } = useMemo(() => {
    const trialEnds = coach?.trial_ends_at ?? null;
    const status = coach?.subscription_status ?? null;

    if (!trialEnds || status !== "trialing") {
      return { showReminder: false, daysLeft: 0, trialEndsAt: trialEnds };
    }

    const end = new Date(trialEnds);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const dismissedUntil = getDismissedUntil();
    const isDismissed = dismissedUntil !== null && Date.now() < dismissedUntil;

    const shouldShow = diffDays <= THRESHOLD_DAYS && diffDays >= 0 && !isDismissed;

    return {
      showReminder: shouldShow,
      daysLeft: Math.max(0, diffDays),
      trialEndsAt: trialEnds,
    };
  }, [coach?.trial_ends_at, coach?.subscription_status]);

  const dismiss = (hours = 24) => {
    setDismissedUntil(hours);
  };

  const clearDismiss = () => {
    clearDismissedUntil();
  };

  return { showReminder, daysLeft, trialEndsAt, dismiss, clearDismiss };
}
