'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader } from '@/components/ui/FormField'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useSubscription, useCheckout, useManageBilling, useCancelSubscription } from '@/lib/hooks'
import { CreditCard, Check, Zap, Crown, Building2, AlertTriangle } from 'lucide-react'
import type { SubscriptionTier } from '@/types'

const PLANS = [
  {
    tier: 'free' as SubscriptionTier,
    name: 'Free',
    price: '$0',
    period: 'forever',
    icon: Zap,
    features: ['Up to 3 clients', 'Workout plans', 'Nutrition plans', 'Messaging', 'Check-in scheduling'],
    color: 'bg-slate-100 dark:bg-white/5',
    accent: 'text-slate-600 dark:text-slate-400',
  },
  {
    tier: 'pro' as SubscriptionTier,
    name: 'Pro',
    price: '$29',
    period: '/month',
    icon: Crown,
    features: ['Up to 25 clients', 'Everything in Free', 'Excel/CSV import', 'Group workouts', 'Live training', 'Client analytics', 'Priority support'],
    color: 'bg-cyan-50 dark:bg-cyan-950/30',
    accent: 'text-cyan-600 dark:text-cyan-400',
    popular: true,
  },
  {
    tier: 'business' as SubscriptionTier,
    name: 'Business',
    price: '$79',
    period: '/month',
    icon: Building2,
    features: ['Unlimited clients', 'Everything in Pro', 'Team management', 'Advanced analytics', 'Custom branding', 'API access', 'Dedicated support'],
    color: 'bg-purple-50 dark:bg-purple-950/30',
    accent: 'text-purple-600 dark:text-purple-400',
  },
]

export default function BillingPage() {
  const { data: subscription, isLoading } = useSubscription()
  const checkout = useCheckout()
  const manageBilling = useManageBilling()
  const cancelSub = useCancelSubscription()
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

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
      <PageHeader
        title="Billing & Plans"
        subtitle="Manage your subscription and billing"
        icon={CreditCard}
      />

      {/* Current Status Banner */}
      {isPastDue && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-200">Payment failed</p>
            <p className="text-sm text-red-600 dark:text-red-400">Please update your payment method to continue using Pro features.</p>
          </div>
          <button
            onClick={() => manageBilling.mutate()}
            className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Update payment
          </button>
        </div>
      )}

      {isTrialing && (
        <div className="mb-6 p-4 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-xl flex items-center gap-3">
          <Zap className="w-5 h-5 text-cyan-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-cyan-800 dark:text-cyan-200">Pro Trial Active</p>
            <p className="text-sm text-cyan-600 dark:text-cyan-400">
              Your free trial ends {subscription?.trial_ends_at ? new Date(subscription.trial_ends_at).toLocaleDateString() : 'soon'}.
              Subscribe to keep Pro features.
            </p>
          </div>
        </div>
      )}

      {isCancelling && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">Subscription ending</p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Your subscription will end on {subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'the end of the billing period'}.
            </p>
          </div>
        </div>
      )}

      {/* Usage */}
      <div className="mb-8 p-5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Usage</h3>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-3xl font-bold text-slate-900 dark:text-white">{subscription?.client_count ?? 0}</span>
          <span className="text-slate-500 dark:text-slate-400 pb-1">/ {subscription?.client_limit ?? 3} clients</span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 rounded-full transition-all"
            style={{ width: `${Math.min(((subscription?.client_count ?? 0) / (subscription?.client_limit ?? 3)) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {PLANS.map((plan) => {
          const isCurrent = currentTier === plan.tier
          const isUpgrade = (plan.tier === 'pro' && currentTier === 'free') || (plan.tier === 'business' && currentTier !== 'business')
          const isDowngrade = (plan.tier === 'free' && currentTier !== 'free') || (plan.tier === 'pro' && currentTier === 'business')

          return (
            <div
              key={plan.tier}
              className={`relative p-6 rounded-2xl border-2 transition-all ${
                isCurrent
                  ? 'border-cyan-500 dark:border-cyan-400 shadow-lg shadow-cyan-500/10'
                  : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-cyan-500 text-white text-xs font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              <div className={`w-10 h-10 ${plan.color} rounded-lg flex items-center justify-center mb-4`}>
                <plan.icon className={`w-5 h-5 ${plan.accent}`} />
              </div>

              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{plan.name}</h3>
              <div className="mt-1 mb-4">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                <span className="text-slate-500 dark:text-slate-400">{plan.period}</span>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full py-2.5 text-center text-sm font-medium text-cyan-600 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-700 rounded-lg">
                  Current Plan
                </div>
              ) : isUpgrade ? (
                <button
                  onClick={() => checkout.mutate(plan.tier as 'pro' | 'business')}
                  disabled={checkout.isPending}
                  className="w-full py-2.5 text-center text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {checkout.isPending ? 'Redirecting...' : `Upgrade to ${plan.name}`}
                </button>
              ) : isDowngrade ? (
                <button
                  onClick={() => manageBilling.mutate()}
                  disabled={manageBilling.isPending}
                  className="w-full py-2.5 text-center text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-white/20 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Manage Plan
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Manage Section */}
      {(currentTier !== 'free' || subscription?.stripe_customer_id) && (
        <div className="p-5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Manage Subscription</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => manageBilling.mutate()}
              disabled={manageBilling.isPending}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-white/20 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
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
                      className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      Yes, cancel
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="px-3 py-1.5 text-sm font-medium text-slate-500 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
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
    </DashboardLayout>
  )
}
