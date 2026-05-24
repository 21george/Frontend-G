'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { subscriptionApi } from '@/lib/api/services/subscription';
import {
  AlertTriangle,
  CreditCard,
  RefreshCw,
  ArrowRight,
  X,
  Loader2,
} from 'lucide-react';

interface Props {
  alert: 'select_plan' | 'update_payment' | 'resubscribe' | 'renew_subscription';
  onClose: () => void;
}

const alertConfig = {
  select_plan: {
    title: 'Select Your Plan',
    description:
      'Welcome! To start using CoachPro, please select a subscription plan.',
    icon: CreditCard,
    actionLabel: 'Select Plan',
    action: 'navigate' as const,
    actionHref: '/subscription/select-plan',
    severity: 'info' as const,
  },
  update_payment: {
    title: 'Update Payment Method',
    description:
      'Your subscription payment failed. Please update your payment method to avoid interruption.',
    icon: AlertTriangle,
    actionLabel: 'Update Payment',
    action: 'portal' as const,
    severity: 'warning' as const,
  },
  resubscribe: {
    title: 'Resubscribe',
    description:
      'Your subscription has been cancelled. Resubscribe to continue using all features.',
    icon: RefreshCw,
    actionLabel: 'Resubscribe',
    action: 'navigate' as const,
    actionHref: '/subscription/select-plan',
    severity: 'warning' as const,
  },
  renew_subscription: {
    title: 'Renew Subscription',
    description:
      'Your subscription is set to cancel at the end of this billing period. Renew now to keep uninterrupted access.',
    icon: AlertTriangle,
    actionLabel: 'Renew Subscription',
    action: 'portal' as const,
    severity: 'info' as const,
  },
};

const severityStyles = {
  info: {
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    buttonVariant: 'primary' as const,
  },
  warning: {
    iconBg: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    buttonVariant: 'primary' as const,
  },
};

export function SubscriptionAlertModal({ alert, onClose }: Props) {
  const router = useRouter();
  const { coach, updateCoach } = useAuthStore();
  const config = alertConfig[alert];
  const styles = severityStyles[config.severity];
  const Icon = config.icon;
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    if (coach) {
      updateCoach({ ...coach, subscription_alert: null });
    }
    onClose();

    if (config.action === 'portal') {
      setIsLoading(true);
      try {
        const data = await subscriptionApi.portal();
        if (data.portal_url) {
          window.location.href = data.portal_url;
        }
      } catch {
        // Portal failed — fallback to select-plan
        router.push('/subscription/select-plan');
      } finally {
        setIsLoading(false);
      }
    } else {
      router.push(config.actionHref);
    }
  };

  const handleDismiss = () => {
    if (coach) {
      updateCoach({ ...coach, subscription_alert: null });
    }
    onClose();
  };

  return (
    <Modal open={true} onClose={handleDismiss} title={config.title} size="md">
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 shrink-0 rounded-full ${styles.iconBg} flex items-center justify-center`}
          >
            <Icon className={`w-5 h-5 ${styles.iconColor}`} />
          </div>
          <div>
            <p className="text-sm text-[var(--text-primary)]">
              {config.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={handleDismiss}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            <X className="w-4 h-4 mr-1" />
            Dismiss
          </Button>
          <Button
            type="button"
            variant={styles.buttonVariant}
            size="md"
            onClick={handleAction}
            disabled={isLoading}
            loading={isLoading}
          >
            {isLoading ? 'Loading...' : config.actionLabel}
            {!isLoading && <ArrowRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
