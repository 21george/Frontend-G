'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  useSubscription,
  useManageBilling,
  useCancelSubscription,
  useUpgradeSubscription,
  useInvoices,
} from '@/lib/hooks';
import { PLANS, getPlanPricing, PERIOD_LABELS } from '@/components/billing/PlanMeta';
import { SubscriptionAlerts } from '@/components/billing/SubscriptionAlerts';
import { PaymentMethodManager } from '@/components/billing/PaymentMethodManager';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { motion } from 'framer-motion';
import {
  CreditCard,
  ArrowLeft,
  Download,
  ExternalLink,
  Search,
  X,
  Users,
  AlertTriangle,
  Receipt,
  Zap,
} from 'lucide-react';
import type { Invoice, SubscriptionPeriod } from '@/types';

/* ── Status badge with dot ───────────────────────────────────────────────── */

function StatusBadge({ status }: { status: Invoice['status'] }) {
  const configs: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
    paid: {
      label: 'Paid',
      dot: 'bg-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200/50 dark:border-emerald-500/20',
    },
    open: {
      label: 'Pending',
      dot: 'bg-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200/50 dark:border-amber-500/20',
    },
    void: {
      label: 'Void',
      dot: 'bg-slate-400',
      bg: 'bg-slate-50 dark:bg-white/5',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200/50 dark:border-white/10',
    },
    uncollectible: {
      label: 'Failed',
      dot: 'bg-red-500',
      bg: 'bg-red-50 dark:bg-red-500/10',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-200/50 dark:border-red-500/20',
    },
  };
  const c = configs[status] ?? configs.open;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

/* ── Skeleton ────────────────────────────────────────────────────────────── */

function ManageSkeleton() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </DashboardLayout>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */

export default function BillingManagePage() {
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: invoices = [], isLoading: invLoading } = useInvoices();
  const manageBilling = useManageBilling();
  const cancelSub = useCancelSubscription();
  const upgradeSub = useUpgradeSubscription();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');

  const currentTier = subscription?.tier ?? 'none';
  const currentPeriod = subscription?.period ?? 'monthly';
  const currentStatus = subscription?.status ?? 'none';
  const isTrialing = currentStatus === 'trialing';
  const isCancelling = subscription?.cancel_at_period_end;
  const hasNoPlan = currentTier === 'none' || currentTier === 'free';

  const currentPlan = PLANS.find((p) => p.tier === currentTier) ?? PLANS[0];
  const currentPricing = getPlanPricing(currentTier, currentPeriod);

  const nextPaymentDateRaw = subscription?.next_payment_date || subscription?.current_period_end;
  const nextPaymentDate = nextPaymentDateRaw
    ? new Date(nextPaymentDateRaw).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  const trialEndDate = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  const filteredInvoices = useMemo(() => {
    const q = invoiceSearch.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(
      (inv) =>
        inv.number.toLowerCase().includes(q) ||
        inv.status.toLowerCase().includes(q) ||
        (inv.description ?? '').toLowerCase().includes(q)
    );
  }, [invoices, invoiceSearch]);

  const clientCount = subscription?.client_count ?? 0;
  const clientLimit = subscription?.client_limit;
  const isUnlimited = clientLimit === null;
  const progressPct = isUnlimited ? 0 : Math.min(100, (clientCount / Math.max(1, clientLimit ?? 1)) * 100);

  if (subLoading) return <ManageSkeleton />;

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-5xl"
      >
        {/* Back link */}
        <div className="flex items-center gap-3">
          <Link
            href="/billing"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Billing
          </Link>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Subscription
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage your plan details and payment methods.
          </p>
        </div>

        {/* Alerts */}
        <SubscriptionAlerts
          subscription={subscription}
          onManageBilling={() => manageBilling.mutate()}
        />

        {/* Two-column top: Plan + Payment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plan Details */}
          <div className="rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-[var(--border)] p-6 sm:p-8">
            <p className="text-base font-semibold text-[var(--text-primary)] mb-5">
              Plan Details
            </p>

            {hasNoPlan ? (
              <div className="flex flex-col items-center text-center py-6">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-subtle)] flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-[var(--text-tertiary)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                  No Active Plan
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-xs">
                  Start your 14-day free trial to unlock all platform features.
                </p>
                <Link
                  href="/billing/upgrade"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[var(--energy)] text-black hover:bg-[var(--energy-dark)] transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Start Free Trial
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Current Plan
                    </span>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mt-1">
                      {currentPlan.name} Plan
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {currentPricing.priceLabel}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">{currentPricing.periodLabel}</p>
                  </div>
                </div>

                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Client limit: {isUnlimited ? 'Unlimited' : clientLimit}
                </p>

                {/* Client usage */}
                {!isUnlimited && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex -space-x-2">
                        {[...Array(Math.min(3, clientCount))].map((_, i) => (
                          <div
                            key={i}
                            className="w-7 h-7 rounded-full bg-[var(--bg-subtle)] border-2 border-white dark:border-[var(--bg-card)] flex items-center justify-center text-[10px] font-bold text-[var(--text-tertiary)]"
                          >
                            <Users className="w-3 h-3" />
                          </div>
                        ))}
                        {clientCount > 3 && (
                          <div className="w-7 h-7 rounded-full bg-[var(--bg-subtle)] border-2 border-white dark:border-[var(--bg-card)] flex items-center justify-center text-[10px] font-bold text-[var(--text-tertiary)]">
                            +{clientCount - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        {clientCount}/{clientLimit}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${progressPct}%`,
                          backgroundColor: currentPlan.accent,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Billing Period */}
                <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                  <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Billing Period
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['monthly', 'quarterly', 'semi_annual', 'annual'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => {
                          if (period === currentPeriod) return;
                          upgradeSub.mutate({
                            tier: currentTier as 'pro' | 'business',
                            period,
                          });
                        }}
                        disabled={upgradeSub.isPending}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                          currentPeriod === period
                            ? 'bg-[var(--energy)]/10 border-[var(--energy)]/30 text-[var(--energy)]'
                            : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                        }`}
                      >
                        {PERIOD_LABELS[period]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2.5">
                  {!isCancelling && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border border-[var(--border)] text-[var(--text-secondary)] hover:text-red-500 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-500/5 transition-colors"
                    >
                      Cancel Plan
                    </button>
                  )}
                  {isCancelling && (
                    <div className="w-full text-center py-2.5 rounded-lg text-sm font-medium text-amber-600 bg-amber-50 border border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                      Cancels on {nextPaymentDate}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Payment Method */}
          <div className="rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-[var(--border)] p-6 sm:p-8">
            <div className="flex items-center justify-between mb-5">
              <p className="text-base font-semibold text-[var(--text-primary)]">
                Payment Method
              </p>
              <span className="text-sm font-semibold text-[#635BFF]">
                stripe
              </span>
            </div>

            <PaymentMethodManager />

            {/* Next payment */}
            {!isCancelling && (
              <p className="text-sm text-[var(--text-secondary)] mt-4 pt-4 border-t border-[var(--border)]">
                <span className="font-medium text-[var(--text-primary)]">
                  Next payment:
                </span>{' '}
                {isTrialing ? trialEndDate : nextPaymentDate}
              </p>
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[var(--text-tertiary)]" />
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Payment History
              </h3>
              {invoices.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                  {invoices.length}
                </span>
              )}
            </div>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search invoices…"
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30 transition-all"
              />
              {invoiceSearch && (
                <button
                  onClick={() => setInvoiceSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {invLoading ? (
              <div className="divide-y divide-[var(--border)]">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center min-w-[640px]"
                  >
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Receipt className="w-10 h-10 mb-3 text-[var(--text-tertiary)]/30" />
                <p className="text-sm font-semibold text-[var(--text-secondary)]">
                  {invoiceSearch ? 'No matching invoices' : 'No invoices yet'}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  {invoiceSearch
                    ? ''
                    : 'Billing history appears after your first payment.'}
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {['Description', 'Payment Method', 'Date', 'Amount', 'Status'].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredInvoices.map((inv, i) => (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-[var(--bg-subtle)]/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {inv.description ?? 'Plan subscription'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-[var(--text-secondary)]">
                          Card ending {inv.number.slice(-4)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                        {new Date(inv.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-[var(--text-primary)]">
                        ${inv.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={inv.status} />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!invLoading && filteredInvoices.length > 0 && (
            <div className="px-6 py-3 border-t border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
              Showing {filteredInvoices.length} of {invoices.length} invoice
              {invoices.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        {!hasNoPlan && !isCancelling && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-500/[0.03] border border-red-200/50 dark:border-red-500/10 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-600 dark:text-red-400">
                  Cancel Subscription
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-lg">
                  Your subscription will remain active until {nextPaymentDate}. After
                  that, you will be downgraded to no active plan.
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancel Subscription
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Cancel Confirmation Modal */}
      <Modal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel subscription?"
        size="md"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
              You will keep full access until {nextPaymentDate}. After that, your
              account will downgrade to no active plan. This action
              cannot be undone early.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              size="md"
              onClick={() => setShowCancelModal(false)}
            >
              Keep Plan
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={cancelSub.isPending}
              onClick={() => {
                cancelSub.mutate();
                setShowCancelModal(false);
              }}
            >
              {cancelSub.isPending ? 'Cancelling…' : 'Yes, Cancel'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
