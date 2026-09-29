"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useSubscription,
  useBillingInformation,
  useUpdateBillingInformation,
  usePaymentMethods,
  useManageBilling,
  useSetDefaultPaymentMethod,
  useDeletePaymentMethod,
} from "@/hooks/useSubscription";
import { useInvoices } from "@/hooks/useInvoices";
import { AddPaymentMethodModal } from "./AddPaymentMethodModal";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { AlertTriangle, Download, Receipt, Zap, Plus } from "lucide-react";
import type { BillingInformation, Invoice, SubscriptionTier } from "@/types";
import type { PaymentMethod } from "@/lib/api/services/subscription";

/* ── Formatters ─────────────────────────────────────────────────────────── */

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

function formatRemainingTrialTime(
  trialEndsAt: string | null | undefined,
): string | null {
  if (!trialEndsAt) return null;
  const remainingMs = new Date(trialEndsAt).getTime() - Date.now();
  if (remainingMs <= 0) return "Expired";
  const days = Math.ceil(remainingMs / 86_400_000);
  return days === 1 ? "1 day remaining" : `${days} days remaining`;
}

const PLAN_NAMES: Record<SubscriptionTier, string> = {
  none: "No Plan",
  free: "Free",
  pro: "Personal Trainer",
  business: "Business",
};

/* ── Skeleton ──────────────────────────────────────────────────────────── */

function HubSkeleton() {
  return (
    <div className="space-y-8 max-w-6xl">
      <Skeleton className="h-9 w-48 rounded-md" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
      <Skeleton className="h-56 rounded-lg" />
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}

/* ── Card brand components (match image exactly) ──────────────────────── */

function MastercardLogo() {
  return (
    <div className="flex items-center" style={{ transform: "translateX(4px)" }}>
      <div className="w-8 h-8 rounded-full bg-[#eb001b]" />
      <div className="w-8 h-8 rounded-full bg-[#f79e1b] -ml-4 opacity-90" />
    </div>
  );
}

function VisaLogo() {
  return (
    <span
      className="text-white font-black text-lg tracking-tighter italic"
      style={{ fontFamily: "sans-serif" }}
    >
      VISA
    </span>
  );
}

function AmexLogo() {
  return (
    <div className="text-center" style={{ transform: "translateX(2px)" }}>
      <span
        className="block text-white font-black text-[10px] tracking-tight leading-tight"
        style={{ fontFamily: "sans-serif" }}
      >
        AMERICAN
      </span>
      <span
        className="block text-white font-black text-[10px] tracking-tight leading-tight"
        style={{ fontFamily: "sans-serif" }}
      >
        EXPRESS
      </span>
    </div>
  );
}

/* ── Payment Card (image style) ───────────────────────────────────────── */

function PaymentCard({ pm }: { pm: PaymentMethod }) {
  const brand = pm.brand.toLowerCase();
  const isMastercard = brand === "mastercard" || brand === "master_card";
  const isVisa = brand === "visa";
  const isAmex =
    brand === "amex" ||
    brand === "american_express" ||
    brand === "american express";

  const setDefault = useSetDefaultPaymentMethod();
  const deleteMethod = useDeletePaymentMethod();

  const topBg = isMastercard
    ? "bg-[#1a1a2e]"
    : isVisa
      ? "bg-[#1a1f71]"
      : isAmex
        ? "bg-[#016fd0]"
        : "bg-[#2d2d2d]";

  const isBusy = setDefault.isPending || deleteMethod.isPending;

  return (
    <div
      className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden flex flex-col"
      style={{ minHeight: 160 }}
    >
      <div className={`${topBg} h-20 flex items-center justify-center`}>
        {isMastercard && <MastercardLogo />}
        {isVisa && <VisaLogo />}
        {isAmex && <AmexLogo />}
        {!isMastercard && !isVisa && !isAmex && (
          <span className="text-white font-bold text-sm uppercase">
            {pm.brand}
          </span>
        )}
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <p
            className="text-sm font-medium text-[var(--text-primary)] tracking-widest"
            style={{ fontFamily: "monospace", letterSpacing: "0.1em" }}
          >
            **** **** **** {pm.last4}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Expires {String(pm.exp_month ?? 0).padStart(2, "0")}/
            {String(pm.exp_year ?? 0).slice(-2)}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border)]">
          {pm.is_default ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Default
            </span>
          ) : (
            <button
              onClick={() => setDefault.mutate(pm.id)}
              disabled={isBusy}
              className="text-xs font-medium text-[#0066cc] hover:underline disabled:opacity-50"
            >
              Make Default
            </button>
          )}
          <button
            onClick={() => {
              if (confirm("Remove this card?")) deleteMethod.mutate(pm.id);
            }}
            disabled={isBusy}
            className="text-xs font-medium text-red-500 hover:underline ml-auto disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Add new card placeholder ───────────────────────────────────────────── */

function AddCardPlaceholder({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border-2 border-dashed border-[var(--border)] hover:border-[var(--text-tertiary)] flex flex-col items-center justify-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors disabled:opacity-50"
      style={{ minHeight: 160 }}
    >
      <div className="w-10 h-10 rounded-full border-2 border-[var(--border)] flex items-center justify-center">
        <Plus className="w-5 h-5" />
      </div>
      <span className="font-medium text-xs">Add a new card</span>
    </button>
  );
}

/* ── Main page ─────────────────────────────────────────────────────────── */

export default function BillingHubPage() {
  const {
    data: subscription,
    isLoading: subLoading,
    isError: subscriptionError,
  } = useSubscription();
  const {
    data: invoices = [],
    isLoading: invLoading,
    isError: invoicesError,
  } = useInvoices();
  const {
    data: paymentMethods = [],
    isLoading: pmLoading,
    isError: paymentMethodsError,
  } = usePaymentMethods();
  const {
    data: billingInformation,
    isLoading: billingLoading,
    isError: billingError,
  } = useBillingInformation();
  const manageBilling = useManageBilling();
  const [showBillingInformationModal, setShowBillingInformationModal] =
    useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);

  if (subLoading) return <HubSkeleton />;

  const currentTier = subscription?.tier ?? "none";
  const isTrialing = subscription?.status === "trialing";
  const isCancelling = subscription?.cancel_at_period_end;
  const hasNoPlan = currentTier === "none" || currentTier === "free";
  const trialRemaining = formatRemainingTrialTime(subscription?.trial_ends_at);

  const nextPaymentDateRaw =
    subscription?.next_payment_date || subscription?.current_period_end;
  const nextPaymentDate = nextPaymentDateRaw
    ? formatDate(nextPaymentDateRaw)
    : "—";
  const trialEndDate = subscription?.trial_ends_at
    ? formatDate(subscription.trial_ends_at)
    : "—";
  const hasUpcomingPayment = Boolean(
    subscription?.provider_available && nextPaymentDateRaw && !isCancelling,
  );

  return (
    <div className="space-y-8 ">
      {subscriptionError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Subscription details could not be loaded. Refresh the page to try
            again.
          </p>
        </div>
      )}

      {/* ── Trial Banner ── */}
      {isTrialing && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Free Trial active — ends {trialEndDate}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              {trialRemaining ? `${trialRemaining}. ` : ""}
              {hasUpcomingPayment
                ? "Your scheduled first payment is shown below."
                : "Add a payment method or choose an upgrade option before your trial ends."}
            </p>
          </div>
          <Link
            href="/billing/upgrade"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" /> Upgrade Now
          </Link>
        </div>
      )}

      {/* ── Two-column row: Current Plan + Billing Information ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Current Plan */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <h2 className="text-lg font-normal text-[var(--text-primary)] mb-5">
            Current Plan
          </h2>

          {hasNoPlan ? (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-subtle)] flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                No Active Plan
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-xs">
                Choose a subscription plan to continue with secure checkout.
              </p>
              <Link
                href="/billing/upgrade"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold bg-[var(--btn-bg)] text-white hover:bg-[var(--btn-hover)] transition-colors"
              >
                <Zap className="w-4 h-4" />
                Start Free Trial
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-sm text-[var(--text-secondary)] w-28 shrink-0">
                  Plan Type
                </span>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {isTrialing ? "Free Trial" : PLAN_NAMES[currentTier]}
                </span>
              </div>
              <div className="flex items-start">
                <span className="text-sm text-[var(--text-secondary)] w-28 shrink-0">
                  Plan Pricing
                </span>
                <div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {subscription?.amount != null && subscription.currency
                      ? `${formatCurrency(subscription.amount, subscription.currency)} billed ${subscription.period.replace("_", " ")}`
                      : "Pricing is confirmed by the payment provider"}
                  </span>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-sm text-[var(--text-secondary)] w-28 shrink-0">
                  {isTrialing
                    ? "Trial Ends"
                    : isCancelling
                      ? "Cancels On"
                      : "Next Charge"}
                </span>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {isTrialing ? trialEndDate : nextPaymentDate}
                </span>
              </div>
              <div className="flex items-center gap-3 pt-2">
                {!isCancelling && (
                  <button
                    onClick={() => manageBilling.mutate()}
                    disabled={manageBilling.isPending}
                    className="px-4 py-2 rounded border border-[var(--border)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                  >
                    {manageBilling.isPending
                      ? "Opening..."
                      : "Manage Subscription"}
                  </button>
                )}
                {isCancelling && (
                  <span className="px-4 py-2 rounded border border-amber-200 dark:border-amber-500/30 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10">
                    Cancels on {nextPaymentDate}
                  </span>
                )}
                <span className="text-sm text-[var(--text-tertiary)]">or</span>
                <Link
                  href="/billing/upgrade"
                  className="text-sm font-medium text-[#0066cc] hover:underline"
                >
                  View Other Plans
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Billing Information */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <h2 className="text-lg font-normal text-[var(--text-primary)] mb-5">
            Billing Information
          </h2>
          <div className="space-y-3">
            <div className="flex items-start">
              <span className="text-sm text-[var(--text-secondary)] w-28 shrink-0">
                Name
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {[billingInformation?.first_name, billingInformation?.last_name]
                  .filter(Boolean)
                  .join(" ") || "—"}
              </span>
            </div>
            <div className="flex items-start">
              <span className="text-sm text-[var(--text-secondary)] w-28 shrink-0">
                Email
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {billingLoading
                  ? "Loading..."
                  : billingInformation?.email || "—"}
              </span>
            </div>
            <div className="flex items-start">
              <span className="text-sm text-[var(--text-secondary)] w-28 shrink-0">
                Phone
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {billingInformation?.phone || "—"}
              </span>
            </div>
            <div className="flex items-start">
              <span className="text-sm text-[var(--text-secondary)] w-28 shrink-0">
                Street
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {billingInformation?.address || "—"}
              </span>
            </div>
            <div className="flex items-start">
              <span className="text-sm text-[var(--text-secondary)] w-28 shrink-0">
                City/State
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {[billingInformation?.city, billingInformation?.postal_code]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </span>
            </div>
            <div className="flex items-start">
              <span className="text-sm text-[var(--text-secondary)] w-28 shrink-0">
                Country
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {billingInformation?.country || "—"}
              </span>
            </div>
          </div>
          <div className="pt-4 mt-2">
            <button
              onClick={() => setShowBillingInformationModal(true)}
              className="px-4 py-2 rounded border border-[var(--border)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
            >
              Edit Billing Information
            </button>
          </div>
        </div>
      </div>

      {hasUpcomingPayment && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-normal text-[var(--text-primary)]">
                Upcoming Payment
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {isTrialing ? "First payment" : "Next payment"}{" "}
                {subscription?.amount != null && subscription.currency
                  ? formatCurrency(subscription.amount, subscription.currency)
                  : "amount unavailable"}{" "}
                on {nextPaymentDate}.
              </p>
            </div>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {isTrialing ? "Free Trial" : PLAN_NAMES[currentTier]}
            </span>
          </div>
        </div>
      )}

      {/* ── Payment Methods ── */}
      <div>
        <h2 className="text-lg font-normal text-[var(--text-primary)] mb-4">
          Payment Methods
        </h2>
        {paymentMethodsError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            Payment methods could not be loaded. Please refresh and try again.
          </div>
        ) : pmLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {paymentMethods.map((pm: PaymentMethod) => (
              <PaymentCard key={pm.id} pm={pm} />
            ))}
            <AddCardPlaceholder
              onClick={() => setShowAddPaymentModal(true)}
              disabled={!subscription?.provider_available}
            />
          </div>
        )}
      </div>

      {/* ── Payment History ── */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-normal text-[var(--text-primary)]">
            Payment History
          </h2>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-2xl">
          You can find below your charges from the last 12 months.
        </p>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          {invoicesError ? (
            <div className="flex items-center gap-3 px-5 py-8 text-sm text-red-700 dark:text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0" /> Payment history
              could not be loaded. Please refresh and try again.
            </div>
          ) : invLoading ? (
            <div className="divide-y divide-[var(--border)]">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-5 py-4">
                  <Skeleton className="h-5 w-full rounded" />
                </div>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Receipt className="w-10 h-10 mb-3 text-[var(--text-tertiary)]/40" />
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                No invoices yet
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Billing history will appear here after your first payment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      Date
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      Plan
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      Payment
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      Status
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      Receipt #
                    </th>
                    <th className="px-5 py-3 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {invoices.map((inv: Invoice) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-[var(--bg-subtle)]/30 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-sm text-[var(--text-secondary)] whitespace-nowrap">
                        {formatDate(inv.date)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {inv.description ?? "Subscription"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[var(--text-primary)] whitespace-nowrap">
                        <span className="font-medium">
                          {formatCurrency(inv.amount, inv.currency)}
                        </span>
                        {inv.last4 && (
                          <span className="text-xs text-[var(--text-secondary)] ml-1">
                            (Card ending {inv.last4})
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm capitalize text-[var(--text-secondary)]">
                        {inv.status}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[var(--text-secondary)] font-mono whitespace-nowrap">
                        {inv.number}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {inv.pdf_url && (
                          <a
                            href={inv.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddPaymentMethodModal
        open={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
      />
      {showBillingInformationModal && (
        <BillingInformationModal
          billingInformation={billingInformation}
          error={billingError}
          onClose={() => setShowBillingInformationModal(false)}
        />
      )}
    </div>
  );
}

function BillingInformationModal({
  billingInformation,
  error,
  onClose,
}: {
  billingInformation?: BillingInformation;
  error: boolean;
  onClose: () => void;
}) {
  const updateBillingInformation = useUpdateBillingInformation();
  const [form, setForm] = useState<Partial<BillingInformation>>(
    billingInformation ?? {},
  );

  const fields: Array<[keyof BillingInformation, string, string]> = [
    ["first_name", "First name", "text"],
    ["last_name", "Last name", "text"],
    ["company", "Company", "text"],
    ["email", "Billing email", "email"],
    ["phone", "Phone", "tel"],
    ["address", "Address", "text"],
    ["postal_code", "Postal code", "text"],
    ["city", "City", "text"],
    ["country", "Country code", "text"],
    ["vat_id", "VAT ID", "text"],
  ];

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Edit Billing Information"
      size="lg"
    >
      {error ? (
        <p className="text-sm text-red-500">
          Billing information could not be loaded. Please try again.
        </p>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            updateBillingInformation.mutate(form, { onSuccess: onClose });
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(([key, label, type]) => (
              <label
                key={key}
                className="block text-sm text-[var(--text-secondary)]"
              >
                <span>{label}</span>
                <input
                  type={type}
                  value={form[key] ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/30"
                />
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[var(--text-secondary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateBillingInformation.isPending}
              className="rounded-lg bg-[var(--btn-bg)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {updateBillingInformation.isPending
                ? "Saving..."
                : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
