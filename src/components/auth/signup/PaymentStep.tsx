"use client";

import { useState } from "react";
import { Loader2, AlertCircle, ChevronLeft, CreditCard, CheckCircle2 } from "lucide-react";
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
      {/* Plan summary panel */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-24 h-24 opacity-10"
          style={{
            background: "radial-gradient(circle at top right, #a3e635, transparent 70%)",
          }}
          aria-hidden
        />
        <p
          className="text-[10px] font-bold tracking-widest uppercase text-white/30 mb-1"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Selected Plan
        </p>
        <p className="text-sm font-semibold text-white">
          {PERIOD_LABELS[period] ?? period}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#a3e635]" />
          <p className="text-xs text-[#a3e635]/80">14-day free trial included</p>
        </div>
        <p className="text-[11px] text-white/20 mt-1">Cancel anytime before billing starts.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-[#a3e635] hover:bg-[#bef264] active:bg-[#8bc52f] text-[#0a1114] font-bold text-sm py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> PROCESSING...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" /> PROCEED TO CHECKOUT
          </>
        )}
      </button>

      <button
        type="button"
        onClick={prevStep}
        disabled={loading}
        className="w-full flex items-center justify-center gap-1 text-sm text-white/30 hover:text-white/60 transition-colors disabled:opacity-50"
      >
        <ChevronLeft className="w-4 h-4" /> Change plan
      </button>

      <div className="flex items-center justify-center gap-2 pt-1">
        <span className="text-[10px] text-white/20 tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)" }}>
          Secured by Stripe
        </span>
        <span className="text-white/10">·</span>
        <span className="text-[10px] text-white/20 tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)" }}>
          256-bit encryption
        </span>
      </div>
    </div>
  );
}
