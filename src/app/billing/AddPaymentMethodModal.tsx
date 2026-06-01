"use client";

import { useState, useEffect, useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Modal } from "@/components/ui/Modal";
import { Loader2 } from "lucide-react";
import { useCreateSetupIntent, useAddPaymentMethod } from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

/* ── Dark mode hook ──────────────────────────────────────────────────────── */

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const check = () => setIsDark(el.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

/* ── Stripe appearance for our theme ────────────────────────────────────── */

function getStripeAppearance(isDark: boolean) {
  return {
    theme: isDark ? ("night" as const) : ("stripe" as const),
    variables: {
      colorPrimary: "#0066cc",
      colorBackground: isDark ? "#1a1a1a" : "#ffffff",
      colorText: isDark ? "#ffffff" : "#121212",
      colorTextSecondary: isDark ? "#a1a1aa" : "#64748b",
      colorTextPlaceholder: isDark ? "#71717a" : "#a1a1aa",
      colorDanger: "#ef4444",
      colorIcon: isDark ? "#a1a1aa" : "#64748b",
      borderRadius: "8px",
      fontFamily: '"Geist", system-ui, sans-serif',
      fontSizeBase: "14px",
      spacingUnit: "4px",
    },
    rules: {
      ".Input": {
        border: isDark
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid #cdcfd2",
        backgroundColor: isDark ? "#27272a" : "#f5f5f5",
        color: isDark ? "#ffffff" : "#121212",
        boxShadow: "none",
        padding: "12px 16px",
      },
      ".Input:focus": {
        border: "1px solid #0066cc",
        boxShadow: "0 0 0 3px rgba(0,102,204,0.15)",
      },
      ".Input--invalid": {
        border: "1px solid #ef4444",
      },
      ".Label": {
        color: isDark ? "#a1a1aa" : "#64748b",
        fontWeight: "500",
        marginBottom: "6px",
      },
      ".Tab": {
        border: isDark
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid #cdcfd2",
        backgroundColor: isDark ? "#27272a" : "#f5f5f5",
        color: isDark ? "#a1a1aa" : "#64748b",
      },
      ".Tab--selected": {
        border: "1px solid #0066cc",
        backgroundColor: isDark
          ? "rgba(0,102,204,0.12)"
          : "rgba(0,102,204,0.06)",
        color: isDark ? "#ffffff" : "#121212",
      },
      ".Tab:hover": {
        backgroundColor: isDark ? "#3f3f46" : "#e4e4e7",
      },
      ".TabIcon--selected": {
        color: "#0066cc",
      },
      ".TabIcon": {
        color: isDark ? "#a1a1aa" : "#64748b",
      },
    },
  };
}

/* ── Stripe form (inside Elements) ───────────────────────────────────────── */

function AddCardForm({
  onSuccess,
  isDark,
}: {
  onSuccess: () => void;
  isDark: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const addPaymentMethod = useAddPaymentMethod();
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canSubmit =
    stripe != null && !isSubmitting && !addPaymentMethod.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const { setupIntent, error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMsg(
        error.message ??
          "Payment setup failed. Please verify your card details.",
      );
      setIsSubmitting(false);
      return;
    }

    if (setupIntent?.status === "succeeded" && setupIntent.payment_method) {
      addPaymentMethod.mutate(
        {
          paymentMethodId: setupIntent.payment_method as string,
          isDefault: true,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
            setIsSubmitting(false);
            onSuccess();
          },
          onError: () => setIsSubmitting(false),
        },
      );
    } else {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Add Payment Method
        </h2>

        <PaymentElement
          options={{
            layout: { type: "tabs", defaultCollapsed: false },
          }}
        />

        {errorMsg && <p className="text-xs text-red-500 mt-3">{errorMsg}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full mt-4 py-3 rounded-lg bg-[#0066cc] hover:bg-[#0052a3] text-white text-sm font-semibold uppercase tracking-wide transition-colors disabled:opacity-50"
        >
          {isSubmitting || addPaymentMethod.isPending ? (
            <span className="inline-flex items-center gap-2 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing…
            </span>
          ) : (
            "Save Card"
          )}
        </button>
      </div>
    </form>
  );
}

/* ── Main modal ──────────────────────────────────────────────────────────── */

export function AddPaymentMethodModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createSetupIntent = useCreateSetupIntent();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isDark = useDarkMode();

  const appearance = useMemo(() => getStripeAppearance(isDark), [isDark]);

  useEffect(() => {
    if (open && !clientSecret && !isLoading) {
      setIsLoading(true);
      createSetupIntent.mutate(undefined, {
        onSuccess: (data) => {
          setClientSecret(data.client_secret);
          setIsLoading(false);
        },
        onError: () => setIsLoading(false),
      });
    }
    if (!open) {
      setClientSecret(null);
      setIsLoading(false);
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} size="xl" title="">
      {isLoading ? (
        <div
          className="flex flex-col items-center justify-center gap-3"
          style={{ minHeight: 520 }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-[#0066cc]" />
          <p className="text-sm text-[var(--text-secondary)]">
            Initializing secure payment form…
          </p>
        </div>
      ) : clientSecret ? (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret, appearance }}
          key={isDark ? "dark" : "light"} /* force remount on theme switch */
        >
          <AddCardForm onSuccess={onClose} isDark={isDark} />
        </Elements>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-3"
          style={{ minHeight: 520 }}
        >
          <p className="text-sm text-[var(--text-secondary)]">
            Unable to load payment form.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </Modal>
  );
}
