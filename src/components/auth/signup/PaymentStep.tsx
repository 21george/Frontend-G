"use client";

import React, { useState } from "react";
import { Loader2, AlertCircle, ChevronLeft, CreditCard } from "lucide-react";
import api from "@/lib/api";
import { useSignupStore } from "@/store/signup";
import { safeRedirect } from "@/lib/validateUrl";

const PERIOD_LABELS: Record<string, string> = {
  monthly: "Monthly — $29/mo",
  semi_annual: "6 Months — $144 ($24/mo)",
  annual: "Yearly — $228 ($19/mo)",
};

export function PaymentStep() {
  const { setupToken, period, prevStep, reset } = useSignupStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!setupToken) {
      setError("Session expired. Please start over.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post(
        "/subscription/select-plan",
        { plan_tier: "pro", period },
        { headers: { Authorization: `Bearer ${setupToken}` } },
      );

      const data = res.data?.data;
      if (data?.redirect) {
        // Free plan — already activated, redirect to dashboard
        reset();
        safeRedirect(data.redirect);
        return;
      }

      if (data?.checkout_url) {
        reset();
        safeRedirect(data.checkout_url);
        return;
      }

      setError("Could not start checkout. Please try again.");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(
        err?.response?.data?.message ?? "Checkout failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Plan summary */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
        <p className="text-xs font-medium text-[var(--text-tertiary)] mb-1">
          Selected plan
        </p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {PERIOD_LABELS[period] ?? period}
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          14-day free trial included · Cancel anytime
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-3 py-2.5 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Redirecting to
            checkout…
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" /> Proceed to Checkout
          </>
        )}
      </button>

      <button
        type="button"
        onClick={prevStep}
        disabled={loading}
        className="w-full flex items-center justify-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
      >
        <ChevronLeft className="w-4 h-4" /> Change plan
      </button>

      <p className="text-center text-xs text-[var(--text-tertiary)]">
        Secured by Stripe · 256-bit encryption
      </p>
    </div>
  );
}
