'use client';

import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  useSubscription,
  useInvoices,
  useManageBilling,
  usePaymentMethods,
} from '@/lib/hooks';
import { PLANS, getPlanPricing, PERIOD_LABELS } from '@/components/billing/PlanMeta';
import { SubscriptionAlerts } from '@/components/billing/SubscriptionAlerts';
import { Skeleton } from '@/components/ui/Skeleton';
import { motion } from 'framer-motion';
import {
  CreditCard,
  ArrowRight,
  Receipt,
  FileText,
  ExternalLink,
  Download,
  Zap,
  ShieldCheck,
  CalendarDays,
  Users,
  Landmark,
  Clock,
  ChevronRight,
} from 'lucide-react';

/* ── Skeleton ──────────────────────────────────────────────────────────────── */

function HubSkeleton() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </DashboardLayout>
  );
}

/* ── Helper ───────────────────────────────────────────────────────────────── */

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

/* ── Main hub page ───────────────────────────────────────────────────────── */

export default function BillingHubPage() {
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: invoices = [], isLoading: invLoading } = useInvoices();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const manageBilling = useManageBilling();

  if (subLoading) return <HubSkeleton />;

  const currentTier = subscription?.tier ?? 'none';
  const currentPeriod = subscription?.period ?? 'monthly';
  const currentPlan = PLANS.find((p) => p.tier === currentTier) ?? PLANS[0];
  const currentPricing = getPlanPricing(currentTier, currentPeriod);
  const isTrialing = subscription?.status === 'trialing';
  const isCancelling = subscription?.cancel_at_period_end;
  const hasNoPlan = currentTier === 'none' || currentTier === 'free';

  const nextPaymentDateRaw = subscription?.next_payment_date || subscription?.current_period_end;
  const nextPaymentDate = formatDate(nextPaymentDateRaw);
  const trialEndDate = formatDate(subscription?.trial_ends_at);

  const recentInvoices = invoices.slice(0, 5);
  const defaultMethod = paymentMethods.find((m) => m.is_default) ?? paymentMethods[0];

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-5xl"
      >
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Billing
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Manage your subscription, payment methods, and invoices.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Payments secured by Stripe</span>
          </div>
        </div>

        {/* Alerts */}
        <SubscriptionAlerts
          subscription={subscription}
          onManageBilling={() => manageBilling.mutate()}
        />

        {/* Plan Hero Card */}
        <div
          className="relative overflow-hidden rounded-2xl border"
          style={{
            borderColor: `${currentPlan.accent}25`,
            background: `linear-gradient(135deg, ${currentPlan.accent}08 0%, var(--bg-card) 60%)`,
          }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.07] pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${currentPlan.accent} 0%, transparent 70%)`,
              transform: 'translate(30%, -30%)',
            }}
          />

          <div className="relative p-6 sm:p-8">
            {hasNoPlan ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-500/10">
                    <Zap className="w-7 h-7 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">No Active Plan</h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Start your 14-day free trial to unlock all features.
                    </p>
                  </div>
                </div>
                <Link
                  href="/billing/upgrade"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--btn-bg)] text-white hover:bg-[var(--btn-hover)] transition-all shrink-0"
                >
                  <Zap className="w-4 h-4" />
                  Start Free Trial
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left: Plan info */}
              <div className="flex items-center gap-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${currentPlan.accent}18` }}
                >
                  <currentPlan.icon className="w-7 h-7" style={{ color: currentPlan.accent }} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                      {currentPlan.name} Plan
                    </h2>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: isTrialing
                          ? `${currentPlan.accent}18`
                          : isCancelling
                          ? 'rgba(245,158,11,0.15)'
                          : `${currentPlan.accent}15`,
                        color: isTrialing
                          ? currentPlan.accent
                          : isCancelling
                          ? '#F59E0B'
                          : currentPlan.accent,
                      }}
                    >
                      {isTrialing ? 'Trialing' : isCancelling ? 'Ending Soon' : 'Active'}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/60 dark:bg-white/10 text-[var(--text-tertiary)] border border-[var(--border)]"
                    >
                      {PERIOD_LABELS[currentPeriod]}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {currentPlan.description}
                  </p>
                </div>
              </div>

              {/* Right: Price + Date */}
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-0.5">
                    Current Price
                  </p>
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-2xl font-black text-[var(--text-primary)]">
                      {currentPricing.priceLabel}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {currentPricing.periodLabel}
                    </span>
                  </div>
                  {currentPricing.discountPct > 0 && (
                    <p className="text-[11px] font-semibold mt-0.5" style={{ color: currentPlan.accent }}>
                      You save {currentPricing.discountPct}%
                    </p>
                  )}
                </div>

                <div className="h-12 w-px bg-[var(--border)]" />

                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-0.5">
                    {isTrialing ? 'Trial Ends' : isCancelling ? 'Cancels On' : 'Next Payment'}
                  </p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">
                    {isTrialing ? trialEndDate : nextPaymentDate}
                  </p>
                  {isTrialing && (
                    <p className="text-[11px] font-semibold mt-0.5" style={{ color: currentPlan.accent }}>
                      First charge after trial
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action bar */}
            <div className="mt-6 pt-5 border-t border-[var(--border)]/60 flex flex-wrap items-center gap-3">
              <Link
                href="/billing/manage"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-black/10"
                style={{ backgroundColor: currentPlan.accent }}
              >
                <CreditCard className="w-4 h-4" />
                Manage Billing
              </Link>
              {!isCancelling && (
                <Link
                  href="/billing/upgrade"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-all"
                >
                  <Zap className="w-4 h-4" />
                  Change Plan
                </Link>
              )}
              {isCancelling && (
                <Link
                  href="/billing/upgrade"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all"
                >
                  <Zap className="w-4 h-4" />
                  Resubscribe
                </Link>
              )}
            </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Clients */}
          <div className="rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-[var(--border)] p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                Active Clients
              </p>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {subscription?.client_count ?? 0}
                <span className="text-sm font-normal text-[var(--text-tertiary)] ml-1">
                  {(subscription?.client_limit ?? null) === null ? 'unlimited' : `/ ${subscription?.client_limit}`}
                </span>
              </p>
            </div>
          </div>

          {/* Payment method preview */}
          <div className="rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-[var(--border)] p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                Payment Method
              </p>
              {defaultMethod ? (
                <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                  {defaultMethod.brand?.toUpperCase()} •••• {defaultMethod.last4}
                </p>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">No card on file</p>
              )}
            </div>
            <Link href="/billing/manage" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Billing history count */}
          <div className="rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-[var(--border)] p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                Invoices
              </p>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {invoices.length}
                <span className="text-sm font-normal text-[var(--text-tertiary)] ml-1">
                  total
                </span>
              </p>
            </div>
            <Link href="/billing/manage" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Recent Invoices */}
        {recentInvoices.length > 0 && (
          <div className="rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[var(--text-tertiary)]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Recent Invoices
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                  {invoices.length}
                </span>
              </div>
              <Link
                href="/billing/manage"
                className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {recentInvoices.map((inv, i) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-[var(--bg-subtle)]/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-center shrink-0 group-hover:bg-white dark:group-hover:bg-white/10 transition-colors">
                      <FileText className="w-4 h-4 text-[var(--text-tertiary)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                          {inv.number}
                        </span>
                        <StatusPill status={inv.status} />
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                        {inv.description ?? 'Plan subscription'} · {formatDate(inv.date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                      {formatCurrency(inv.amount, inv.currency)}
                    </span>
                    <div className="flex items-center gap-1">
                      {inv.pdf_url && (
                        <a
                          href={inv.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-all"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      {inv.hosted_invoice_url && (
                        <a
                          href={inv.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-all"
                          title="View on Stripe"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {invoices.length > 5 && (
              <div className="px-6 py-3 border-t border-[var(--border)] bg-[var(--bg-subtle)]/30">
                <Link
                  href="/billing/manage"
                  className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1"
                >
                  View {invoices.length - 5} older invoices
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!invLoading && recentInvoices.length === 0 && (
          <div className="rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[var(--text-tertiary)]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Invoices</h3>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg-subtle)] flex items-center justify-center mb-4">
                <CalendarDays className="w-6 h-6 text-[var(--text-tertiary)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                No invoices yet
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1 max-w-xs">
                Billing history will appear here after your first payment. Your trial is active until {trialEndDate}.
              </p>
            </div>
          </div>
        )}

        {/* Trust footer */}
        <div className="flex items-center justify-center gap-6 text-[var(--text-tertiary)] py-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">14-day free trial</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-[var(--border)]" />
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-xs">Stripe secured</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-[var(--border)]" />
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span className="text-xs">Cancel anytime</span>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

/* ── Status Pill ─────────────────────────────────────────────────────────── */

function StatusPill({ status }: { status: string }) {
  const configs: Record<string, { bg: string; text: string; border: string; label: string }> = {
    paid: {
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200/50 dark:border-emerald-500/20',
      label: 'Paid',
    },
    open: {
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200/50 dark:border-amber-500/20',
      label: 'Pending',
    },
    void: {
      bg: 'bg-slate-50 dark:bg-white/5',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200/50 dark:border-white/10',
      label: 'Void',
    },
    uncollectible: {
      bg: 'bg-red-50 dark:bg-red-500/10',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-200/50 dark:border-red-500/20',
      label: 'Failed',
    },
  };
  const c = configs[status] ?? configs.open;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
}
