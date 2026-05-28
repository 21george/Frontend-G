'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Sparkles } from 'lucide-react';
import type { SubscriptionInfo } from '@/types';

interface SubscriptionAlertsProps {
  subscription?: SubscriptionInfo;
  onManageBilling: () => void;
}

export function SubscriptionAlerts({ subscription, onManageBilling }: SubscriptionAlertsProps) {
  if (!subscription) return null;

  const { status, trial_ends_at, current_period_end, cancel_at_period_end } = subscription;
  const isPastDue = status === 'past_due';
  const isTrialing = status === 'trialing';
  const isCancelling = cancel_at_period_end;

  const renewalDate = current_period_end
    ? new Date(current_period_end).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  return (
    <AnimatePresence mode="popLayout">
      {isPastDue && (
        <motion.div
          key="past-due"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-950/30"
        >
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-300">Payment failed</p>
            <p className="text-xs text-red-400/70 mt-0.5">
              Update your payment method to keep features active.
            </p>
          </div>
          <button
            onClick={onManageBilling}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors shrink-0"
          >
            Fix now
          </button>
        </motion.div>
      )}

      {isTrialing && (
        <motion.div
          key="trial"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl border border-[var(--energy)]/20 bg-[var(--energy)]/5"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--energy)]/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[var(--energy)]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--energy)]">Pro Trial Active</p>
            <p className="text-xs text-[var(--energy)]/60 mt-0.5">
              Trial ends {trial_ends_at ? new Date(trial_ends_at).toLocaleDateString() : 'soon'}.
            </p>
          </div>
        </motion.div>
      )}

      {isCancelling && (
        <motion.div
          key="cancelling"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-950/30"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-300">Subscription ending</p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              Access continues until {renewalDate}.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
