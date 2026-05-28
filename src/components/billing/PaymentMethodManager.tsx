'use client';

import { useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  usePaymentMethods,
  useCreateSetupIntent,
  useAddPaymentMethod,
  useDeletePaymentMethod,
  useSetDefaultPaymentMethod,
} from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/Skeleton';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CreditCard,
  Plus,
  Trash2,
  Star,
  Check,
  X,
  Loader2,
} from 'lucide-react';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
);

/* ── Card brand icons ──────────────────────────────────────────────────────── */

function CardBrandIcon({ brand }: { brand: string }) {
  const normalized = brand.toLowerCase();
  const colors: Record<string, string> = {
    visa: '#1A1F71',
    mastercard: '#EB001B',
    amex: '#016FD0',
    discover: '#FF6000',
    jcb: '#0066B3',
    diners: '#004E94',
    unionpay: '#C00',
  };
  const color = colors[normalized] ?? '#64748B';

  return (
    <div
      className="w-10 h-7 rounded-md flex items-center justify-center text-[10px] font-black uppercase tracking-wider text-white shrink-0"
      style={{ backgroundColor: color }}
    >
      {normalized === 'visa' ? 'V' : normalized === 'mastercard' ? 'MC' : brand.slice(0, 2)}
    </div>
  );
}

/* ── Payment form (inside Elements) ──────────────────────────────────────── */

function AddCardForm({
  clientSecret,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const addPaymentMethod = useAddPaymentMethod();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);

    const { setupIntent, error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (error) {
      setIsSubmitting(false);
      return;
    }

    if (setupIntent?.status === 'succeeded' && setupIntent.payment_method) {
      addPaymentMethod.mutate(
        {
          paymentMethodId: setupIntent.payment_method as string,
          isDefault: true,
        },
        {
          onSuccess: () => {
            setIsSubmitting(false);
            onSuccess();
          },
          onError: () => setIsSubmitting(false),
        }
      );
    } else {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: { type: 'tabs', defaultCollapsed: false },
        }}
      />
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={!stripe || isSubmitting || addPaymentMethod.isPending}
          loading={isSubmitting || addPaymentMethod.isPending}
          variant="primary"
          size="sm"
        >
          <Check className="w-4 h-4" />
          Save Card
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting || addPaymentMethod.isPending}
        >
          <X className="w-4 h-4" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

/* ── Main manager ──────────────────────────────────────────────────────────── */

export function PaymentMethodManager() {
  const { data: methods, isLoading } = usePaymentMethods();
  const createSetupIntent = useCreateSetupIntent();
  const deleteMethod = useDeletePaymentMethod();
  const setDefault = useSetDefaultPaymentMethod();

  const [showAddForm, setShowAddForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const startAddingCard = useCallback(() => {
    createSetupIntent.mutate(undefined, {
      onSuccess: (data) => {
        setClientSecret(data.client_secret);
        setShowAddForm(true);
      },
    });
  }, [createSetupIntent]);

  const handleSuccess = () => {
    setShowAddForm(false);
    setClientSecret(null);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setClientSecret(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Saved cards */}
      {methods && methods.length > 0 ? (
        <div className="space-y-2">
          {methods.map((method) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <CardBrandIcon brand={method.brand} />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} •••• {method.last4}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Expires {method.exp_month?.toString().padStart(2, '0') ?? '--'}/
                    {method.exp_year?.toString().slice(-2) ?? '--'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {method.is_default ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Default
                  </span>
                ) : (
                  <button
                    onClick={() => setDefault.mutate(method.id)}
                    disabled={setDefault.isPending}
                    className="px-3 py-1 rounded-full text-xs font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--energy)] hover:text-[var(--energy)] transition-colors disabled:opacity-50"
                  >
                    Set as default
                  </button>
                )}
                <button
                  onClick={() => deleteMethod.mutate(method.id)}
                  disabled={deleteMethod.isPending}
                  className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  title="Remove card"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        !showAddForm && (
          <div className="py-6 text-center rounded-lg border border-dashed border-[var(--border)]">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
            <p className="text-sm text-[var(--text-secondary)]">
              No cards on file
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Add a card to manage billing directly
            </p>
          </div>
        )
      )}

      {/* Add form */}
      <AnimatePresence>
        {showAddForm && clientSecret && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-[var(--bg-subtle)]/60 p-4 border border-[var(--border)]">
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <AddCardForm
                  clientSecret={clientSecret}
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                />
              </Elements>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add new card button */}
      {!showAddForm && (
        <button
          onClick={startAddingCard}
          disabled={createSetupIntent.isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-[var(--border-hover)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)]/30 transition-all disabled:opacity-50"
        >
          {createSetupIntent.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add new card
        </button>
      )}
    </div>
  );
}
