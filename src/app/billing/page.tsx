'use client'

import { useState, useMemo } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSubscription, useCheckout, useManageBilling, useCancelSubscription, useInvoices } from '@/lib/hooks'
import {
  CreditCard, Check, Zap, Crown, Building2, AlertTriangle,
  ChevronRight, Download, Search, ExternalLink, FileText, X,
  Sparkles, ArrowRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SubscriptionTier } from '@/types'

// ── Design tokens (matching app)
const BRAND = '#132E35'

// ── Plan definitions ─────────────────────────────────────────────────────────

const PLANS = [
  {
    tier: 'free' as SubscriptionTier,
    name: 'Starter',
    price: 0,
    priceLabel: '$0',
    icon: Zap,
    accent: '#888780',
    features: [
      'Workout & nutrition plans',
      'Client messaging',
      'Check-in scheduling',
      'Mobile app access',
    ],
  },
  {
    tier: 'pro' as SubscriptionTier,
    name: 'Pro',
    price: 29,
    priceLabel: '$29',
    icon: Crown,
    accent: '#2A96AD',
    popular: true,
    features: [
      'Everything in Starter',
      'Excel / CSV import',
      'Group workouts',
      'Live training sessions',
      'Client analytics',
      'Priority support',
    ],
  },
  {
    tier: 'business' as SubscriptionTier,
    name: 'Business',
    price: 79,
    priceLabel: '$79',
    icon: Building2,
    accent: '#8B5CF6',
    features: [
      'Everything in Pro',
      'Team management',
      'Advanced analytics',
      'Custom branding',
      'API access',
      'Dedicated support',
    ],
  },
]

// ── Skeleton ──────────────────────────────────────────────────────────────────

function BillingSkeleton() {
  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28 rounded-none" />
          <Skeleton className="h-7 w-48 rounded-none" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px border border-[#E5E5E5] dark:border-white/[0.07]">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 rounded-none" />)}
        </div>
        <Skeleton className="h-10 w-full rounded-none" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-none" />)}
      </div>
    </DashboardLayout>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    paid:          { label: 'Paid',   cls: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' },
    open:          { label: 'Open',   cls: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' },
    void:          { label: 'Void',   cls: 'text-[#888780] bg-slate-100 dark:bg-white/[0.04]' },
    uncollectible: { label: 'Failed', cls: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20' },
  }
  const { label, cls } = cfg[status] ?? cfg.open
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { data: subscription, isLoading: subLoading } = useSubscription()
  const { data: invoices = [], isLoading: invLoading } = useInvoices()
  const checkout      = useCheckout()
  const manageBilling = useManageBilling()
  const cancelSub     = useCancelSubscription()

  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [invoiceSearch,     setInvoiceSearch]     = useState('')
  const [activeTab,         setActiveTab]         = useState<'overview' | 'plans' | 'invoices'>('overview')

  const filteredInvoices = useMemo(() => {
    const q = invoiceSearch.trim().toLowerCase()
    if (!q) return invoices
    return invoices.filter(inv =>
      inv.number.toLowerCase().includes(q) ||
      inv.status.toLowerCase().includes(q)
    )
  }, [invoices, invoiceSearch])

  if (subLoading) return <BillingSkeleton />

  const currentTier   = subscription?.tier   ?? 'free'
  const currentStatus = subscription?.status ?? 'none'
  const isTrialing    = currentStatus === 'trialing'
  const isPastDue     = currentStatus === 'past_due'
  const isCancelling  = subscription?.cancel_at_period_end
  const renewalDate   = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  const currentPlan = PLANS.find(p => p.tier === currentTier) ?? PLANS[0]

  const TABS = [
    { key: 'overview',  label: 'Overview' },
    { key: 'plans',     label: 'Plans'    },
    { key: 'invoices',  label: 'Invoices' },
  ] as const

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <button
            onClick={() => manageBilling.mutate()}
            disabled={manageBilling.isPending}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border border-[#E5E5E5] dark:border-white/[0.07] hover:bg-[#132E35] hover:text-white dark:hover:bg-[#132E35] transition-colors text-[#171717] dark:text-[#FAFAFA] disabled:opacity-50 mt-3 sm:mt-0"
          >
            <CreditCard className="w-3.5 h-3.5" />
            {manageBilling.isPending ? 'Opening…' : 'Manage Billing'}
          </button>
        </div>

        {/* ── Alerts ── */}
        <AnimatePresence>
          {isPastDue && (
            <motion.div key="past-due" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4 border-l-2 border-red-500 bg-red-50 dark:bg-red-900/10">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-300">Payment failed</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Update your payment method to keep features active.</p>
              </div>
              <button onClick={() => manageBilling.mutate()}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 transition-colors">
                Fix now
              </button>
            </motion.div>
          )}
          {isTrialing && (
            <motion.div key="trial" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4 border-l-2 border-[#2A96AD] bg-[#132E35]/5 dark:bg-[#132E35]/20">
              <Sparkles className="w-4 h-4 text-[#2A96AD] shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#132E35] dark:text-[#2A96AD]">Pro Trial Active</p>
                <p className="text-xs text-[#888780] dark:text-[#FAFAFA]/40 mt-0.5">
                  Trial ends {subscription?.trial_ends_at ? new Date(subscription.trial_ends_at).toLocaleDateString() : 'soon'}.
                </p>
              </div>
            </motion.div>
          )}
          {isCancelling && (
            <motion.div key="cancelling" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4 border-l-2 border-amber-500 bg-amber-50 dark:bg-amber-900/10">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Subscription ending</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Access continues until {renewalDate}.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tabs ── */}
        <div className="flex border-b border-[#E5E5E5] dark:border-white/[0.07]">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-[#132E35] dark:border-[#2A96AD] text-[#132E35] dark:text-[#2A96AD]'
                  : 'border-transparent text-[#888780] dark:text-[#FAFAFA]/40 hover:text-[#171717] dark:hover:text-[#FAFAFA]'
              }`}
            >
              {tab.label}
              {tab.key === 'invoices' && invoices.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-[#132E35] text-white dark:bg-[#2A96AD]">
                  {invoices.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ════════════════════════
            OVERVIEW
        ════════════════════════ */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

            {/* Plan hero strip */}
            <div className="relative overflow-hidden border border-[#E5E5E5] dark:border-white/[0.07] bg-white dark:bg-[#1A1A1A] p-6">
              {/* accent left bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: currentPlan.accent }} />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 pl-2">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 flex items-center justify-center" style={{ backgroundColor: `${currentPlan.accent}18` }}>
                    <currentPlan.icon className="w-6 h-6" style={{ color: currentPlan.accent }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#888780] dark:text-[#FAFAFA]/40 mb-0.5">
                      Current Plan
                    </p>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-[#171717] dark:text-[#FAFAFA] tracking-tight">{currentPlan.name}</h2>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5"
                        style={{ backgroundColor: `${currentPlan.accent}18`, color: currentPlan.accent }}>
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key stats */}
                <div className="flex items-center gap-8 pl-2 sm:pl-0 border-t sm:border-t-0 sm:border-l border-[#E5E5E5] dark:border-white/[0.07] pt-4 sm:pt-0 sm:pl-8">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888780] dark:text-[#FAFAFA]/40 mb-1">Price</p>
                    <p className="text-xl font-bold text-[#171717] dark:text-[#FAFAFA]">{currentPlan.priceLabel}</p>
                    <p className="text-[10px] text-[#888780] dark:text-[#FAFAFA]/40">/month</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888780] dark:text-[#FAFAFA]/40 mb-1">Next Billing</p>
                    <p className="text-sm font-bold text-[#171717] dark:text-[#FAFAFA]">{renewalDate}</p>
                    <p className="text-[10px] text-[#888780] dark:text-[#FAFAFA]/40">renewal</p>
                  </div>
                </div>
              </div>

              {/* Cancel row */}
              {!isCancelling && currentTier !== 'free' && currentStatus === 'active' && (
                <div className="mt-5 pt-4 border-t border-[#E5E5E5] dark:border-white/[0.07] pl-2 flex items-center gap-4">
                  {showCancelConfirm ? (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-red-600 dark:text-red-400 font-medium">Cancel subscription?</span>
                      <button onClick={() => { cancelSub.mutate(); setShowCancelConfirm(false) }}
                        disabled={cancelSub.isPending}
                        className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        Yes, cancel
                      </button>
                      <button onClick={() => setShowCancelConfirm(false)}
                        className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-[#E5E5E5] dark:border-white/[0.07] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors text-[#888780] dark:text-[#FAFAFA]/60">
                        Keep plan
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setShowCancelConfirm(true)}
                      className="text-[10px] font-bold uppercase tracking-wider text-[#888780] hover:text-red-500 transition-colors">
                      Cancel subscription
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Features + upgrade prompt side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Features */}
              <div className="lg:col-span-3 border border-[#E5E5E5] dark:border-white/[0.07] bg-white dark:bg-[#1A1A1A] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#888780] dark:text-[#FAFAFA]/40 mb-4">
                  Included in {currentPlan.name}
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentPlan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-xs text-[#171717] dark:text-[#FAFAFA]/80">
                      <div className="w-4 h-4 flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${currentPlan.accent}18` }}>
                        <Check className="w-2.5 h-2.5" style={{ color: currentPlan.accent }} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Upgrade nudge (hidden if business) */}
              {currentTier !== 'business' ? (
                <div className="lg:col-span-2 relative overflow-hidden border border-[#E5E5E5] dark:border-white/[0.07] p-5"
                  style={{ background: `linear-gradient(135deg, #132E35 0%, #1C4A54 100%)` }}>
                  <Sparkles className="absolute right-4 top-4 w-16 h-16 text-white/5" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 mb-2">Level Up</p>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {currentTier === 'free' ? 'Go Pro' : 'Go Business'}
                  </h3>
                  <p className="text-xs text-white/60 mb-5">
                    {currentTier === 'free'
                      ? 'Unlock live training, analytics & more for $29/mo.'
                      : 'Unlimited scale, team tools & dedicated support for $79/mo.'}
                  </p>
                  <button
                    onClick={() => { setActiveTab('plans') }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider bg-white text-[#132E35] hover:bg-[#2A96AD] hover:text-white transition-colors"
                  >
                    View plans <ArrowRight size={11} />
                  </button>
                </div>
              ) : (
                <div className="lg:col-span-2 border border-[#E5E5E5] dark:border-white/[0.07] bg-white dark:bg-[#1A1A1A] p-5 flex flex-col items-center justify-center text-center gap-2">
                  <Crown className="w-8 h-8 text-[#8B5CF6]" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#888780] dark:text-[#FAFAFA]/40">
                    Top tier active
                  </p>
                  <p className="text-xs text-[#888780] dark:text-[#FAFAFA]/60">
                    You have access to every feature.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ════════════════════════
            PLANS
        ════════════════════════ */}
        {activeTab === 'plans' && (
          <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan, idx) => {
              const isCurrent   = currentTier === plan.tier
              const isUpgrade   = (plan.tier === 'pro'      && currentTier === 'free') ||
                                  (plan.tier === 'business' && currentTier !== 'business')
              const isDowngrade = (plan.tier === 'free' && currentTier !== 'free') ||
                                  (plan.tier === 'pro'  && currentTier === 'business')

              return (
                <motion.div
                  key={plan.tier}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className={`relative flex flex-col border ${
                    isCurrent
                      ? 'border-[#132E35] dark:border-[#2A96AD]'
                      : 'border-[#E5E5E5] dark:border-white/[0.07]'
                  } bg-white dark:bg-[#1A1A1A] overflow-hidden`}
                >
                  {/* Top accent */}
                  <div className="h-1 w-full" style={{ backgroundColor: plan.accent }} />

                  {plan.popular && (
                    <div className="absolute top-4 right-4 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: plan.accent }}>
                      Popular
                    </div>
                  )}

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${plan.accent}18` }}>
                        <plan.icon className="w-4 h-4" style={{ color: plan.accent }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#171717] dark:text-[#FAFAFA] uppercase tracking-wide">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-2xl font-bold text-[#171717] dark:text-[#FAFAFA]">{plan.priceLabel}</span>
                          <span className="text-[10px] text-[#888780] dark:text-[#FAFAFA]/40">/mo</span>
                        </div>
                      </div>
                    </div>

                    <ul className="space-y-2 mb-6 flex-1">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-[#888780] dark:text-[#FAFAFA]/60">
                          <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${plan.accent}18` }}>
                            <Check className="w-2 h-2" style={{ color: plan.accent }} />
                          </div>
                          {f}
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <div className="w-full py-2.5 text-center text-[10px] font-bold uppercase tracking-wider border"
                        style={{ borderColor: plan.accent, color: plan.accent, backgroundColor: `${plan.accent}10` }}>
                        Current Plan
                      </div>
                    ) : isUpgrade ? (
                      <button
                        onClick={() => checkout.mutate(plan.tier as 'pro' | 'business')}
                        disabled={checkout.isPending}
                        className="w-full py-2.5 text-[10px] font-bold uppercase tracking-wider text-white transition-opacity disabled:opacity-50 hover:opacity-90"
                        style={{ backgroundColor: plan.accent }}
                      >
                        {checkout.isPending ? 'Redirecting…' : `Upgrade → ${plan.name}`}
                      </button>
                    ) : isDowngrade ? (
                      <button
                        onClick={() => manageBilling.mutate()}
                        disabled={manageBilling.isPending}
                        className="w-full py-2.5 text-[10px] font-bold uppercase tracking-wider border border-[#E5E5E5] dark:border-white/[0.07] text-[#888780] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors disabled:opacity-50"
                      >
                        Manage Plan
                      </button>
                    ) : null}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* ════════════════════════
            INVOICES
        ════════════════════════ */}
        {activeTab === 'invoices' && (
          <motion.div key="invoices" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#888780]" />
                <input
                  value={invoiceSearch}
                  onChange={e => setInvoiceSearch(e.target.value)}
                  placeholder="Search invoices…"
                  className="w-full bg-white dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-white/[0.07] pl-9 pr-4 py-2.5 text-xs text-[#171717] dark:text-[#FAFAFA] placeholder:text-[#888780] focus:outline-none focus:border-[#132E35] dark:focus:border-[#2A96AD] transition-colors"
                />
              </div>
              {subscription?.stripe_customer_id && (
                <button onClick={() => manageBilling.mutate()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider border border-[#E5E5E5] dark:border-white/[0.07] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-[#171717] dark:text-[#FAFAFA] transition-colors">
                  <ExternalLink size={12} />
                  Billing portal
                </button>
              )}
            </div>

            {/* Table */}
            <div className="border border-[#E5E5E5] dark:border-white/[0.07] bg-white dark:bg-[#1A1A1A] overflow-hidden">
              <div className="overflow-x-auto">
                {/* Head */}
                <div className="grid grid-cols-[1.5fr_1fr_1.5fr_1fr_auto] gap-4 px-5 py-3 border-b border-[#E5E5E5] dark:border-white/[0.07] bg-[#FAFAFA] dark:bg-white/[0.02] min-w-[540px]">
                  {['Invoice', 'Status', 'Date', 'Amount', ''].map((h, i) => (
                    <span key={i} className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#888780] dark:text-[#FAFAFA]/40">{h}</span>
                  ))}
                </div>

                {/* Loading */}
                {invLoading && (
                  <div>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="grid grid-cols-[1.5fr_1fr_1.5fr_1fr_auto] gap-4 px-5 py-4 border-b border-[#E5E5E5] dark:border-white/[0.07] last:border-0 min-w-[540px]">
                        <Skeleton className="h-4 w-24 rounded-none" />
                        <Skeleton className="h-4 w-14 rounded-none" />
                        <Skeleton className="h-4 w-28 rounded-none" />
                        <Skeleton className="h-4 w-16 rounded-none" />
                        <Skeleton className="h-5 w-5 rounded-none" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty */}
                {!invLoading && filteredInvoices.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FileText className="w-8 h-8 mb-3 text-[#E5E5E5] dark:text-white/10" />
                    <p className="text-xs font-bold uppercase tracking-wider text-[#888780] dark:text-[#FAFAFA]/40">
                      {invoiceSearch ? 'No matching invoices' : 'No invoices yet'}
                    </p>
                    <p className="text-[11px] text-[#888780] dark:text-[#FAFAFA]/30 mt-1">
                      {invoiceSearch ? '' : 'Billing history will appear here after your first payment.'}
                    </p>
                    {invoiceSearch && (
                      <button onClick={() => setInvoiceSearch('')}
                        className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#132E35] dark:text-[#2A96AD] hover:underline">
                        <X size={10} /> Clear
                      </button>
                    )}
                  </div>
                )}

                {/* Rows */}
                {!invLoading && filteredInvoices.length > 0 && (
                  <div>
                    {filteredInvoices.map((inv, i) => (
                      <motion.div
                        key={inv.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="grid grid-cols-[1.5fr_1fr_1.5fr_1fr_auto] gap-4 px-5 py-4 items-center border-b border-[#E5E5E5] dark:border-white/[0.07] last:border-0 hover:bg-[#FAFAFA] dark:hover:bg-white/[0.02] transition-colors min-w-[540px]"
                      >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-[#888780] shrink-0" />
                        <p className="text-xs font-bold text-[#171717] dark:text-[#FAFAFA] truncate">{inv.number}</p>
                      </div>
                      <StatusBadge status={inv.status} />
                      <p className="text-xs text-[#888780] dark:text-[#FAFAFA]/60">
                        {new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-xs font-bold text-[#171717] dark:text-[#FAFAFA]">
                        ${(inv.amount / 100).toFixed(2)}
                      </p>
                      <div className="flex items-center gap-1">
                        {inv.pdf_url && (
                          <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 text-[#888780] hover:text-[#132E35] dark:hover:text-[#2A96AD] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                            aria-label="Download PDF">
                            <Download size={13} />
                          </a>
                        )}
                        {inv.hosted_invoice_url && (
                          <a href={inv.hosted_invoice_url} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 text-[#888780] hover:text-[#132E35] dark:hover:text-[#2A96AD] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                            aria-label="View invoice">
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              </div>
            </div>

            {!invLoading && filteredInvoices.length > 0 && (
              <p className="text-[10px] uppercase tracking-wider text-[#888780] dark:text-[#FAFAFA]/40">
                {filteredInvoices.length} of {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
              </p>
            )}
          </motion.div>
        )}

      </div>
    </DashboardLayout>
  )
}
