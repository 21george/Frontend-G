"use client";

import { Check, Shield, Lock, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" as const },
  }),
};

export function PlanStep() {
  const { setPeriod, nextStep } = useSignupStore();

  const handleSelect = (period: SubscriptionPeriod) => {
    setPeriod(period);
    nextStep();
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/40 text-center tracking-wide">
        Get full access to all coaching features. Cancel anytime.
      </p>

      <div className="space-y-3">
        {PLANS.map((plan, i) => (
          <motion.button
            key={plan.period}
            type="button"
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            onClick={() => handleSelect(plan.period)}
            className={`w-full text-left rounded-xl border p-4 transition-all duration-200 active:scale-[0.99] group ${
              plan.recommended
                ? "border-[#a3e635]/40 bg-[#a3e635]/[0.04] ring-1 ring-[#a3e635]/20 shadow-[0_0_20px_rgba(163,230,53,0.08)]"
                : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      plan.recommended ? "text-[#a3e635]" : "text-white/30"
                    }`}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {plan.tier}
                  </span>
                  {plan.badge && (
                    <span
                      className="text-[10px] font-bold bg-[#a3e635] text-[#0a1114] px-2 py-0.5 rounded-sm"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {plan.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-white">{plan.name}</p>
                <p className="text-xs text-white/30 mt-0.5">{plan.tag}</p>
                <ul className="mt-3 space-y-1.5">
                  {plan.features.slice(0, 3).map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-1.5 text-xs text-white/40"
                    >
                      <Check
                        className={`w-3 h-3 shrink-0 ${
                          plan.recommended ? "text-[#a3e635]" : "text-white/20"
                        }`}
                        strokeWidth={3}
                      />
                      {f}
                    </li>
                  ))}
                  {plan.features.length > 3 && (
                    <li
                      className="text-[10px] text-[#a3e635]/80 tracking-wide font-medium"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      +{plan.features.length - 3} more features
                    </li>
                  )}
                </ul>
              </div>
              <div className="text-right shrink-0">
                <span
                  className="text-2xl font-bold text-white block"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  ${plan.price}
                </span>
                <span
                  className="text-[10px] text-white/30 tracking-widest uppercase"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {plan.unit}
                </span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 pt-2 border-t border-white/[0.06]">
        {[
          { icon: Lock, label: "Cancel anytime" },
          { icon: Shield, label: "Stripe secured" },
          { icon: CreditCard, label: "PCI compliant" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <Icon className="w-4 h-4 text-white/20" />
            <span
              className="text-[10px] text-white/25 tracking-widest uppercase"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
