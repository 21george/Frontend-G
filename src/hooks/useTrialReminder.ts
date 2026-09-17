import { useMemo, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth";
import toast from "react-hot-toast";

const MODAL_STORAGE_KEY = "trial_reminder_modal_dismissed_until";
const TOAST_STORAGE_KEY = "trial_reminder_toast_shown_for_trial";
const MODAL_THRESHOLD_DAYS = 3;
const TOAST_THRESHOLD_DAYS = 14;

function getDismissedUntil(key: string): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  const ts = parseInt(raw, 10);
  return isNaN(ts) ? null : ts;
}

function setDismissedUntil(key: string, hours: number) {
  if (typeof window === "undefined") return;
  const ts = Date.now() + hours * 60 * 60 * 1000;
  window.localStorage.setItem(key, String(ts));
}

function getToastShownForTrial(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOAST_STORAGE_KEY);
}

function setToastShownForTrial(trialEndIso: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOAST_STORAGE_KEY, trialEndIso);
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
  const toastFiredRef = useRef(false);

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

    const modalDismissedUntil = getDismissedUntil(MODAL_STORAGE_KEY);
    const isModalDismissed =
      modalDismissedUntil !== null && now.getTime() < modalDismissedUntil;

    const shouldShowModal =
      diffDays <= MODAL_THRESHOLD_DAYS && diffDays >= 0 && !isModalDismissed;

    return {
      showReminder: shouldShowModal,
      daysLeft: Math.max(0, diffDays),
      trialEndsAt: trialEnds,
    };
  }, [coach?.trial_ends_at, coach?.subscription_status]);

  // Toast notification: fires once per trial period when user enters the 14-day window
  useEffect(() => {
    const trialEnds = coach?.trial_ends_at ?? null;
    const status = coach?.subscription_status ?? null;
    if (!trialEnds || status !== "trialing" || toastFiredRef.current) return;

    const end = new Date(trialEnds);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > TOAST_THRESHOLD_DAYS || diffDays < 0) return;

    // Only show once for this specific trial end date
    if (getToastShownForTrial() === trialEnds) return;

    toastFiredRef.current = true;
    setToastShownForTrial(trialEnds);

    const formattedDate = end.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const heading =
      diffDays === 0
        ? "Your free trial ends today"
        : diffDays === 1
          ? "Your free trial ends tomorrow"
          : `Your free trial ends in ${diffDays} days`;

    toast.success(
      `${heading}\nOn ${formattedDate} your saved payment method will be charged automatically to keep your subscription active.`,
      {
        duration: 8000,
        icon: "🔔",
        style: {
          background: "#1e293b",
          color: "#f8fafc",
          border: "1px solid rgba(163,230,53,0.2)",
          whiteSpace: "pre-line",
        },
      },
    );
  }, [coach?.trial_ends_at, coach?.subscription_status]);

  const dismiss = (hours = 24) => {
    setDismissedUntil(MODAL_STORAGE_KEY, hours);
  };

  const clearDismiss = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(MODAL_STORAGE_KEY);
    window.localStorage.removeItem(TOAST_STORAGE_KEY);
  };

  return { showReminder, daysLeft, trialEndsAt, dismiss, clearDismiss };
}
