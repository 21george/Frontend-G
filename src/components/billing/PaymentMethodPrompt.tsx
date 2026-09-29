"use client";

import { useState, useEffect, useMemo } from "react";
import { usePaymentMethods } from "@/lib/hooks";
import { useAuthStore } from "@/store/auth";
import { AddPaymentMethodModal } from "@/app/billing/AddPaymentMethodModal";
import { CreditCard, X, AlertTriangle } from "lucide-react";

const PROMPT_DISMISSED_KEY = "payment_method_prompt_dismissed";

function getDismissedUntil(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PROMPT_DISMISSED_KEY);
  if (!raw) return null;
  const ts = parseInt(raw, 10);
  return isNaN(ts) ? null : ts;
}

function setDismissedUntil(hours: number) {
  if (typeof window === "undefined") return;
  const ts = Date.now() + hours * 60 * 60 * 1000;
  window.localStorage.setItem(PROMPT_DISMISSED_KEY, String(ts));
}

export function PaymentMethodPrompt() {
  const coach = useAuthStore((s) => s.coach);
  const { data: paymentMethods, isLoading } = usePaymentMethods();
  const [showModal, setShowModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissedUntil = getDismissedUntil();
    if (dismissedUntil && Date.now() < dismissedUntil) {
      setIsDismissed(true);
    }
  }, []);

  const shouldShow = useMemo(() => {
    if (!coach?.id) return false;
    if (isLoading) return false;
    if (isDismissed) return false;

    const tier = coach.subscription_tier ?? "none";
    const status = coach.subscription_status ?? "none";

    // Only show for paid/trialing plans that have no payment methods
    const isPaidOrTrialing =
      tier === "pro" || tier === "business" || status === "trialing";
    const hasNoPaymentMethods =
      !paymentMethods || paymentMethods.length === 0;

    return isPaidOrTrialing && hasNoPaymentMethods;
  }, [coach, isLoading, isDismissed, paymentMethods]);

  if (!shouldShow) return null;

  const handleDismiss = () => {
    setDismissedUntil(24); // Dismiss for 24 hours
    setIsDismissed(true);
  };

  return (
    <>
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-800/30 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Payment Method Required
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              You haven&apos;t added a payment method yet. Add one now to avoid
              interruption when your trial ends.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Add Payment Method
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-md text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800/30 transition-colors"
            title="Dismiss for 24 hours"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AddPaymentMethodModal
        open={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
