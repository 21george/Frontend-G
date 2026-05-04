'use client'

import { useState, useMemo } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useSubscription, useCheckout, useManageBilling, useCancelSubscription } from '@/lib/hooks'
import {
  CreditCard, Check, Zap, Crown, Building2, AlertTriangle,
  ChevronRight, DollarSign, Users, TrendingUp, Calendar,
  ArrowUpRight, Sparkles
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { SubscriptionTier } from '@/types'

const PLANS = [
  {
    tier: 'free' as SubscriptionTier,
    name: 'Free',
    price: '$0',
    period: 'forever',
    icon: Zap,
    gradient: 'bg-brand-600',
    features: ['Up to 3 clients', 'Workout plans', 'Nutrition plans', 'Messaging', 'Check-in scheduling'],
  },
  {
    tier: 'pro' as SubscriptionTier,
    name: 'Pro',
    price: '$29',
    period: '/month',
    icon: Crown,
    gradient: 'bg-brand-600',
    features: ['Up to 25 clients', 'Everything in Free', 'Excel/CSV import', 'Group workouts', 'Live training', 'Client analytics', 'Priority support'],
    popular: true,
  },
  {
    tier: 'business' as SubscriptionTier,
    name: 'Business',
    price: '$79',
    period: '/month',
    icon: Building2,
    gradient: 'bg-brand-600',
    features: ['Unlimited clients', 'Everything in Pro', 'Team management', 'Advanced analytics', 'Custom branding', 'API access', 'Dedicated support'],
  },
]

export default function BillingPage() {
  const { data: subscription, isLoading } = useSubscription()
  const checkout = useCheckout()
  const manageBilling = useManageBilling()
  const cancelSub = useCancelSubscription()
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Calculate billing stats
  const stats = useMemo(() => {
    const sub = subscription
    const clientCount = sub?.client_count ?? 0
    const clientLimit = sub?.client_limit ?? 3
    const usagePercent = Math.min((clientCount / clientLimit) * 100, 100)
    return {
      mrr: sub?.tier === 'pro' ? 29 : sub?.tier === 'business' ? 79 : 0,
      activeSubs: 1,
      outstanding: 0, // amount_due not tracked in current type
      usagePercent,
      clientCount,
      clientLimit,
    }
  }, [subscription])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    )
  }

  const currentTier = subscription?.tier ?? 'free'
  const isTrialing = subscription?.status === 'trialing'
  const isPastDue = subscription?.status === 'past_due'
  const isCancelling = subscription?.cancel_at_period_end

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400 mb-3 uppercase tracking-tighter">
              <span>Dashboard</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-brand-600 dark:text-brand-300">Billing</span>
            </nav>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Billing & Plans
            </h1>
            <p className="text-slate-500 dark:text-neutral-400 mt-2 max-w-lg text-sm">
              Manage your subscription, billing history, and payment methods.
            </p>
          </div>
          <button
            onClick={() => manageBilling.mutate()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-brand-950 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-brand-900 transition-colors text-sm font-medium"
          >
            <CreditCard className="w-4 h-4" />
            Manage Billing
          </button>
        </div>

        {/* ── ALERTS ── */}
        {isPastDue && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-brand-600/10 dark:bg-brand-600/30 border border-brand-600/20 dark:border-brand-800 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-brand-700 dark:text-brand-200">Payment failed</p>
              <p className="text-sm text-brand-700 dark:text-brand-400">Please update your payment method to continue using Pro features.</p>
            </div>
            <button
              onClick={() => manageBilling.mutate()}
              className="ml-auto px-4 py-2 bg-brand-600 text-white hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              Update payment
            </button>
          </motion.div>
        )}

        {isTrialing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-brand-600/10 dark:bg-brand-600/30 border border-brand-600/20 dark:border-brand-800 flex items-center gap-3"
          >
            <Zap className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-brand-700 dark:text-brand-200">Pro Trial Active</p>
              <p className="text-sm text-brand-700 dark:text-brand-400">
                Your free trial ends {subscription?.trial_ends_at ? new Date(subscription.trial_ends_at).toLocaleDateString() : 'soon'}.
                Subscribe to keep Pro features.
              </p>
            </div>
          </motion.div>
        )}

        {isCancelling && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-brand-600/10 dark:bg-brand-600/30 border border-brand-600/20 dark:border-brand-800 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-brand-700 dark:text-brand-200">Subscription ending</p>
              <p className="text-sm text-brand-700 dark:text-brand-400">
                Your subscription will end on {subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'the end of the billing period'}.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── BENTO STATS GRID ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-white dark:bg-surface-card-dark p-4 lg:p-5 border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between "
          >
            <span className="text-slate-500 dark:text-neutral-400 text-[10px] lg:text-xs font-semibold uppercase tracking-wider">Monthly Revenue</span>
            <div className="mt-3 lg:mt-4 flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">${stats.mrr}</span>
              <span className="text-slate-500 dark:text-neutral-500 text-xs">MRR</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white dark:bg-surface-card-dark p-4 lg:p-5 border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between "
          >
            <span className="text-slate-500 dark:text-neutral-400 text-[10px] lg:text-xs font-semibold uppercase tracking-wider">Active Subs</span>
            <div className="mt-3 lg:mt-4 flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-bold text-brand-600 dark:text-brand-400">{stats.activeSubs}</span>
              <TrendingUp className="w-4 h-4 text-brand-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-surface-card-dark p-4 lg:p-5 border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between "
          >
            <span className="text-slate-500 dark:text-neutral-400 text-[10px] lg:text-xs font-semibold uppercase tracking-wider">Outstanding</span>
            <div className="mt-3 lg:mt-4 flex items-baseline gap-2">
              <span className={`text-2xl lg:text-3xl font-bold ${stats.outstanding > 0 ? 'text-brand-600 dark:text-brand-400' : 'text-slate-900 dark:text-white'}`}>
                ${stats.outstanding}
              </span>
              <DollarSign className={`w-4 h-4 ${stats.outstanding > 0 ? 'text-brand-500' : 'text-slate-400'}`} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-surface-card-dark p-4 lg:p-5 border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between "
          >
            <span className="text-slate-500 dark:text-neutral-400 text-[10px] lg:text-xs font-semibold uppercase tracking-wider">Plan Usage</span>
            <div className="mt-3 lg:mt-4 flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">{stats.clientCount}</span>
              <span className="text-slate-500 dark:text-neutral-500 text-xs">/ {stats.clientLimit} clients</span>
            </div>
          </motion.div>
        </div>

        {/* ── USAGE CARD ── */}
        <div className="bg-white dark:bg-surface-card-dark border border-slate-200/80 dark:border-white/[0.08] p-5 ">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Current Usage</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {stats.clientLimit - stats.clientCount} clients remaining on your plan
              </p>
            </div>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.clientCount}</span>
            <span className="text-slate-500 dark:text-slate-400 pb-1">/ {stats.clientLimit} clients</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-white/10 overflow-hidden">
            <div
              className={`h-full transition-all ${
                stats.usagePercent > 80 ? 'bg-brand-600' : stats.usagePercent > 50 ? 'bg-brand-500' : 'bg-brand-400'
              }`}
              style={{ width: `${stats.usagePercent}%` }}
            />
          </div>
          {stats.usagePercent > 80 && (
            <p className="text-xs text-brand-600 dark:text-brand-400 mt-2 flex items-center gap-1">
              <AlertTriangle size={12} />
              You're approaching your plan limit
            </p>
          )}
        </div>

        {/* ── PLANS GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = currentTier === plan.tier
            const isUpgrade = (plan.tier === 'pro' && currentTier === 'free') || (plan.tier === 'business' && currentTier !== 'business')
            const isDowngrade = (plan.tier === 'free' && currentTier !== 'free') || (plan.tier === 'pro' && currentTier === 'business')

            return (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: plan.tier === 'free' ? 0 : plan.tier === 'pro' ? 0.1 : 0.2 }}
                className={`relative p-6 border transition-all ${
                  isCurrent
                    ? 'border-brand-500 dark:border-brand-400 -500/10'
                    : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20'
                } bg-white dark:bg-surface-card-dark`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand-600 text-white text-xs font-semibold ">
                    Most Popular
                  </div>
                )}

                <div className={`w-12 h-12 ${plan.gradient} flex items-center justify-center mb-4 `}>
                  <plan.icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                <div className="mt-1 mb-4">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                  <span className="text-slate-500 dark:text-slate-400">{plan.period}</span>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Check className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full py-2.5 text-center text-sm font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-600/20 border border-brand-200 dark:border-brand-800 ">
                    Current Plan
                  </div>
                ) : isUpgrade ? (
                  <button
                    onClick={() => checkout.mutate(plan.tier as 'pro' | 'business')}
                    disabled={checkout.isPending}
                    className="w-full py-2.5 text-center text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 transition-all disabled:opacity-50 -600/25"
                  >
                    {checkout.isPending ? 'Redirecting...' : `Upgrade to ${plan.name}`}
                  </button>
                ) : isDowngrade ? (
                  <button
                    onClick={() => manageBilling.mutate()}
                    disabled={manageBilling.isPending}
                    className="w-full py-2.5 text-center text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-white/20 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    Manage Plan
                  </button>
                ) : null}
              </motion.div>
            )
          })}
        </div>

        {/* ── INSIGHT CARD ── */}
        {currentTier !== 'free' && (
          <div className="bg-gradient-to-br from-brand-600/10 to-brand-700/10 dark:from-brand-950/70 dark:to-slate-950 p-6 border border-brand-600/20 dark:border-brand-800/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-brand-600 flex items-center justify-center flex-shrink-0 ">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Plan Benefits Active
                </h3>
                <p className="text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                  You're currently on the {currentTier === 'pro' ? 'Pro' : 'Business'} plan.
                  {currentTier === 'pro' && ' Enjoy up to 25 clients and all premium features including Excel import and live training.'}
                  {currentTier === 'business' && ' Enjoy unlimited clients and all enterprise features including team management and API access.'}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-brand-500" />
                    <span className="text-slate-500 dark:text-neutral-400">All features unlocked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-brand-600" />
                    <span className="text-slate-500 dark:text-neutral-400">Priority support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MANAGE SECTION ── */}
        {(currentTier !== 'free' || subscription?.stripe_customer_id) && (
          <div className="bg-white dark:bg-surface-card-dark border border-slate-200/80 dark:border-white/[0.08] p-5 ">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Manage Subscription</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => manageBilling.mutate()}
                disabled={manageBilling.isPending}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-white/20 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                {manageBilling.isPending ? 'Opening...' : 'Manage billing'}
              </button>
              {!isCancelling && currentTier !== 'free' && subscription?.status === 'active' && (
                <>
                  {showCancelConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-red-600 dark:text-red-400">Are you sure?</span>
                      <button
                        onClick={() => { cancelSub.mutate(); setShowCancelConfirm(false) }}
                        disabled={cancelSub.isPending}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        Yes, cancel
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="px-3 py-1.5 text-sm font-medium text-slate-500 border border-slate-300 hover:bg-slate-50 transition-colors"
                      >
                        Keep plan
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="px-4 py-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                    >
                      Cancel subscription
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
