'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useSubscription, useCheckout, useUpgradeSubscription, useManageBilling } from '@/lib/hooks';
import { PLANS, FEATURE_COMPARISON } from '@/components/billing/PlanMeta';
import { GlowingCard } from '@/components/billing/GlowingCard';
import { SubscriptionAlerts } from '@/components/billing/SubscriptionAlerts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/Skeleton';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  Zap,
  ArrowRight,
  ShieldCheck,
  Infinity,
  CreditCard,
} from 'lucide-react';
import type { SubscriptionTier } from '@/types';

/* ── Animation variants ──────────────────────────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const heroVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

/* ── Loading skeleton ─────────────────────────────────────────────────────── */

function UpgradeSkeleton() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center space-y-3 py-8">
          <Skeleton className="h-10 w-64 mx-auto rounded-lg" />
          <Skeleton className="h-5 w-96 mx-auto rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-[520px] rounded-2xl" />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ── Feature cell renderer ───────────────────────────────────────────────── */

function FeatureValue({
  value,
  highlight,
}: {
  value: boolean | string;
  highlight?: boolean;
}) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check
        className={`w-4 h-4 mx-auto ${
          highlight ? 'text-[var(--energy)]' : 'text-emerald-400'
        }`}
      />
    ) : (
      <X className="w-4 h-4 mx-auto text-[var(--text-tertiary)]" />
    );
  }
  return (
    <span
      className={`text-sm font-semibold ${
        highlight ? 'text-[var(--energy)]' : 'text-[var(--text-primary)]'
      }`}
    >
      {value}
    </span>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */

export default function BillingUpgradePage() {
  const { data: subscription, isLoading } = useSubscription();
  const checkout = useCheckout();
  const upgradeSub = useUpgradeSubscription();
  const manageBilling = useManageBilling();

  const PERIOD_OPTIONS: { key: 'monthly' | 'quarterly' | 'semi_annual' | 'annual'; label: string; discount?: string }[] = [
    { key: 'monthly', label: 'Monthly' },
    { key: 'quarterly', label: 'Quarterly', discount: 'Save 10%' },
    { key: 'semi_annual', label: '6 Months', discount: 'Save 15%' },
    { key: 'annual', label: 'Yearly', discount: 'Save 20%' },
  ];

  const [selectedPeriod, setSelectedPeriod] = useState<typeof PERIOD_OPTIONS[number]['key']>('monthly');

  const currentTier = subscription?.tier ?? 'none';
  const currentStatus = subscription?.status ?? 'none';

  const getPrice = (tier: SubscriptionTier) => {
    const plan = PLANS.find((p) => p.tier === tier)!;
    const pricing = plan.periods[selectedPeriod];
    return {
      label: pricing.priceLabel,
      period: pricing.periodLabel,
      save: pricing.discountPct > 0,
    };
  };

  const handlePlanAction = (tier: SubscriptionTier) => {
    if (currentStatus === 'active' || currentStatus === 'trialing') {
      upgradeSub.mutate({ tier: tier as 'pro' | 'business', period: selectedPeriod });
    } else {
      checkout.mutate({ tier: tier as 'pro' | 'business', period: selectedPeriod });
    }
  };

  const visiblePlans = PLANS.filter((p) => p.tier === 'pro' || p.tier === 'business');

  if (isLoading) return <UpgradeSkeleton />;

  return (
    <DashboardLayout>
      <div className="relative -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 min-h-[calc(100vh-4rem)]">
        {/* Page background */}
        <div className="absolute inset-0 bg-[var(--bg-page)]" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 80% 20%, rgba(163,230,53,0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 20% 80%, rgba(34,211,238,0.06) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10 px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 space-y-12">
          {/* Alerts */}
          <SubscriptionAlerts
            subscription={subscription}
            onManageBilling={() => manageBilling.mutate()}
          />

          {/* Hero */}
          <motion.div
            variants={heroVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--energy)]/20 bg-[var(--energy)]/5 mb-6">
              <Zap className="w-3.5 h-3.5 text-[var(--energy)]" />
              <span className="text-xs font-semibold text-[var(--energy)] uppercase tracking-wider">
                360fit Power Plans
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--text-primary)] mb-4">
              Choose Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--energy)] to-[#22d3ee]">
                Power Level
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-lg mx-auto">
              Unlock the tools that turn clients into champions. No contracts.
              Cancel anytime.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] mt-8 flex-wrap justify-center">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSelectedPeriod(opt.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    selectedPeriod === opt.key
                      ? 'bg-[var(--energy)] text-black'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {opt.label}
                  {opt.discount && (
                    <span className="ml-1.5 text-[10px] font-bold uppercase">
                      {opt.discount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Plan Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          >
            {visiblePlans.map((plan) => {
              const isCurrent = currentTier === plan.tier;
              const isPro = plan.tier === 'pro';
              const price = getPrice(plan.tier);
              const Icon = plan.icon;

              return (
                <motion.div
                  key={plan.tier}
                  variants={cardVariants}
                  whileHover={
                    !isCurrent
                      ? { y: -12, scale: 1.02, transition: { duration: 0.25 } }
                      : undefined
                  }
                  className="relative"
                >
                  {isPro ? (
                    <GlowingCard active className="h-full">
                      <PlanCardContent
                        plan={plan}
                        isCurrent={isCurrent}
                        isPro={true}
                        price={price}
                        Icon={Icon}
                        onAction={() => handlePlanAction(plan.tier)}
                        isPending={upgradeSub.isPending || checkout.isPending}
                      />
                    </GlowingCard>
                  ) : (
                    <div className="h-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] transition-colors">
                      <PlanCardContent
                        plan={plan}
                        isCurrent={isCurrent}
                        isPro={false}
                        price={price}
                        Icon={Icon}
                        onAction={() => handlePlanAction(plan.tier)}
                        isPending={upgradeSub.isPending || checkout.isPending}
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          {/* Feature Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="rounded-2xl bg-[var(--bg-card)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Feature Comparison
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                        Feature
                      </th>
                      {(['pro', 'business'] as const).map((tier) => (
                        <th
                          key={tier}
                          className={`text-center px-6 py-3 text-xs font-bold uppercase tracking-wider ${
                            tier === 'pro'
                              ? 'text-[var(--energy)]'
                              : 'text-[var(--text-tertiary)]'
                          }`}
                        >
                          {PLANS.find((p) => p.tier === tier)?.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {FEATURE_COMPARISON.map((row, i) => (
                      <motion.tr
                        key={row.label}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 + i * 0.03 }}
                        className="hover:bg-[var(--bg-subtle)] transition-colors"
                      >
                        <td className="px-6 py-3 text-sm text-[var(--text-secondary)]">{row.label}</td>
                        <td className="px-6 py-3 text-center">
                          <FeatureValue value={row.pro} highlight />
                        </td>
                        <td className="px-6 py-3 text-center">
                          <FeatureValue value={row.business} />
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Trust footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center space-y-4 pt-4"
          >
            <div className="flex items-center justify-center gap-6 text-[var(--text-tertiary)]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs">SSL Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span className="text-xs">Stripe Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <Infinity className="w-4 h-4" />
                <span className="text-xs">Cancel Anytime</span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              14-day free trial on Pro and Business plans. No credit card required for signup.
            </p>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ── Plan Card Content (extracted to avoid duplication) ─────────────────── */

function PlanCardContent({
  plan,
  isCurrent,
  isPro,
  price,
  Icon,
  onAction,
  isPending,
}: {
  plan: (typeof PLANS)[0];
  isCurrent: boolean;
  isPro: boolean;
  price: { label: string; period: string; save: boolean };
  Icon: React.ElementType;
  onAction: () => void;
  isPending: boolean;
}) {
  return (
    <div className="p-6 sm:p-8 flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">

        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: isPro
                ? 'rgba(163,230,53,0.12)'
                : `${plan.accent}18`,
            }}
          >
            <Icon
              className="w-5 h-5"
              style={{ color: isPro ? 'var(--energy)' : plan.accent }}
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{plan.name}</h3>
            <p className="text-xs text-[var(--text-tertiary)]">{plan.description}</p>
          </div>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-4xl sm:text-5xl font-black text-[var(--text-primary)]">
            {price.label}
          </span>
          <span className="text-sm text-[var(--text-tertiary)]">{price.period}</span>
        </div>
        {price.save && (
          <p className="text-xs text-[var(--energy)] mt-1 font-medium">
            Save 20% with yearly billing
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
              style={{
                backgroundColor: isPro
                  ? 'rgba(163,230,53,0.12)'
                  : `${plan.accent}18`,
              }}
            >
              <Check
                className="w-3 h-3"
                style={{ color: isPro ? 'var(--energy)' : plan.accent }}
              />
            </div>
            <span className="text-sm text-[var(--text-secondary)]">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isCurrent ? (
        <div className="w-full py-3 rounded-xl text-center text-sm font-semibold border border-[var(--border)] text-[var(--text-tertiary)] bg-[var(--bg-subtle)]">
          Current Plan
        </div>
      ) : (
        <Button
          onClick={onAction}
          disabled={isPending}
          loading={isPending}
          variant="primary"
          size="lg"
          className={`w-full ${
            isPro
              ? 'bg-[var(--energy)] text-black hover:bg-[var(--energy-dark)]'
              : ''
          }`}
        >
          {plan.cta}
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
