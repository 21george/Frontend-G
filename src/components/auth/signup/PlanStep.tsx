"use client";

import { Check, Shield, Lock, CreditCard } from "lucide-react";
import { useSignupStore } from "@/store/signup";
import type { SubscriptionPeriod } from "@/types";

interface PlanCard {
  period: SubscriptionPeriod;
  tier: string;
  name: string;
  price: number;
  unit: string;
  tag: string;
  badge?: string;
  features: string[];
  recommended?: boolean;
}

const FEATURES = [
  "Up to 50 clients",
  "Workout plan builder",
  "Nutrition plans",
  "Live training sessions",
  "Client check-ins & analytics",
  "In-app messaging",
  "Media uploads",
  "14-day free trial included",
];

const PLANS: PlanCard[] = [
  {
    period: "monthly",
    tier: "Starter",
    name: "Monthly",
    price: 29,
    unit: "/mo",
    tag: "Flexibility for starters.",
    features: FEATURES.slice(0, 4),
  },
  {
    period: "annual",
    tier: "Professional",
    name: "Yearly",
    price: 228,
    unit: "/year",
    tag: "Best value for serious coaches.",
    badge: "SAVE 34%",
    features: FEATURES,
    recommended: true,
  },
  {
    period: "semi_annual",
    tier: "Growth",
    name: "6 Months",
    price: 144,
    unit: "/bi-annual",
    tag: "Perfect for scaling your practice.",
    badge: "SAVE 17%",
    features: FEATURES.slice(0, 5),
  },
];

export function PlanStep() {
  const { setPeriod, nextStep } = useSignupStore();

  const handleSelect = (period: SubscriptionPeriod) => {
    setPeriod(period);
    nextStep();
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--text-secondary)] text-center">
        Get full access to all coaching features. Cancel anytime.
      </p>

      <div className="space-y-3">
        {PLANS.map((plan) => (
          <button
            key={plan.period}
            type="button"
            onClick={() => handleSelect(plan.period)}
            className={`w-full text-left rounded-xl border p-4 transition-all active:scale-[0.99] ${
              plan.recommended
                ? "border-blue-600 bg-blue-50 dark:bg-blue-950/20 ring-1 ring-blue-600"
                : "border-[var(--border)] bg-white dark:bg-[#111] hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/10"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-bold uppercase tracking-wide ${plan.recommended ? "text-blue-600" : "text-[var(--text-tertiary)]"}`}
                  >
                    {plan.tier}
                  </span>
                  {plan.badge && (
                    <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {plan.name}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  {plan.tag}
                </p>
                <ul className="mt-2 space-y-1">
                  {plan.features.slice(0, 3).map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]"
                    >
                      <Check
                        className="w-3 h-3 text-blue-600 shrink-0"
                        strokeWidth={3}
                      />
                      {f}
                    </li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="text-xs text-blue-600 font-medium">
                      +{plan.features.length - 3} more features
                    </li>
                  )}
                </ul>
              </div>
              <div className="text-right shrink-0">
                <span className="text-2xl font-bold text-[var(--text-primary)]">
                  ${plan.price}
                </span>
                <span className="text-xs text-[var(--text-tertiary)] block">
                  {plan.unit}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 pt-2 border-t border-[var(--border)]">
        {[
          { icon: Lock, label: "Cancel anytime" },
          { icon: Shield, label: "Stripe secured" },
          { icon: CreditCard, label: "PCI compliant" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <Icon className="w-4 h-4 text-[var(--text-tertiary)]" />
            <span className="text-[10px] text-[var(--text-tertiary)]">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
