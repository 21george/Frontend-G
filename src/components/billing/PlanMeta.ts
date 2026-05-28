import type { SubscriptionTier, SubscriptionPeriod } from "@/types";
import { Zap, Crown, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PeriodPricing {
  price: number;
  priceLabel: string;
  periodLabel: string;
  discountPct: number; // 0–100
}

export interface PlanDefinition {
  tier: SubscriptionTier;
  name: string;
  periods: Record<SubscriptionPeriod, PeriodPricing>;
  icon: LucideIcon;
  accent: string;
  energy: boolean;
  popular: boolean;
  description: string;
  features: string[];
  cta: string;
}

export const PERIOD_LABELS: Record<SubscriptionPeriod, string> = {
  monthly: "Monthly",
  quarterly: "3 Months",
  semi_annual: "6 Months",
  annual: "Yearly",
};

export const PERIOD_ORDER: SubscriptionPeriod[] = [
  "monthly",
  "quarterly",
  "semi_annual",
  "annual",
];

export const PLANS: PlanDefinition[] = [
  {
    tier: "none",
    name: "No Plan",
    periods: {
      monthly: {
        price: 0,
        priceLabel: "$0",
        periodLabel: "/mo",
        discountPct: 0,
      },
      quarterly: {
        price: 0,
        priceLabel: "$0",
        periodLabel: "/3 mo",
        discountPct: 0,
      },
      semi_annual: {
        price: 0,
        priceLabel: "$0",
        periodLabel: "/6 mo",
        discountPct: 0,
      },
      annual: {
        price: 0,
        priceLabel: "$0",
        periodLabel: "/yr",
        discountPct: 0,
      },
    },
    icon: Zap,
    accent: "#94a3b8",
    energy: false,
    popular: false,
    description: "Select a plan to get started",
    features: ["No active subscription", "Limited platform access"],
    cta: "Choose Plan",
  },
  {
    tier: "pro",
    name: "Pro",
    periods: {
      monthly: {
        price: 29,
        priceLabel: "$29",
        periodLabel: "/mo",
        discountPct: 0,
      },
      quarterly: {
        price: 78,
        priceLabel: "$78",
        periodLabel: "/3 mo",
        discountPct: 10,
      },
      semi_annual: {
        price: 147,
        priceLabel: "$147",
        periodLabel: "/6 mo",
        discountPct: 15,
      },
      annual: {
        price: 278,
        priceLabel: "$278",
        periodLabel: "/yr",
        discountPct: 20,
      },
    },
    icon: Crown,
    accent: "#a3e635",
    energy: true,
    popular: false,
    description: "For growing coaches",
    features: [
      "Unlimited clients",
      "Advanced workout builder",
      "Nutrition plans",
      "Live training sessions",
      "Priority support",
      "Client analytics",
      "14-day free trial",
    ],
    cta: "Start Free Trial",
  },
  {
    tier: "business",
    name: "Business",
    periods: {
      monthly: {
        price: 79,
        priceLabel: "$79",
        periodLabel: "/mo",
        discountPct: 0,
      },
      quarterly: {
        price: 213,
        priceLabel: "$213",
        periodLabel: "/3 mo",
        discountPct: 10,
      },
      semi_annual: {
        price: 402,
        priceLabel: "$402",
        periodLabel: "/6 mo",
        discountPct: 15,
      },
      annual: {
        price: 758,
        priceLabel: "$758",
        periodLabel: "/yr",
        discountPct: 20,
      },
    },
    icon: Building2,
    accent: "#8B5CF6",
    energy: false,
    popular: false,
    description: "For established businesses",
    features: [
      "Unlimited clients",
      "Everything in Pro",
      "Advanced analytics",
      "White-label options",
      "Dedicated support manager",
      "Custom integrations",
      "14-day free trial",
    ],
    cta: "Start Free Trial",
  },
];

export function getPlanPricing(
  tier: SubscriptionTier,
  period: SubscriptionPeriod,
): PeriodPricing {
  const plan = PLANS.find((p) => p.tier === tier);
  if (!plan) throw new Error(`getPlanPricing: unknown tier "${tier}"`);
  return plan.periods[period] ?? plan.periods.monthly;
}

export const FEATURE_COMPARISON = [
  { label: "Clients", pro: "Unlimited", business: "Unlimited" },
  { label: "Workout Plans", pro: true, business: true },
  { label: "Nutrition Plans", pro: true, business: true },
  { label: "Live Training", pro: true, business: true },
  { label: "Client Analytics", pro: true, business: true },
  { label: "Group Workouts", pro: true, business: true },
  { label: "Priority Support", pro: true, business: true },
  { label: "White-label", pro: false, business: true },
  { label: "API Access", pro: false, business: true },
  { label: "Custom Integrations", pro: false, business: true },
];
