"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  useSubscription,
  useBillingInformation,
  useUpdateBillingInformation,
  useManageBilling,
  useCancelSubscription,
  useUpgradeSubscription,
} from "@/lib/hooks";
import { useInvoices, useDownloadInvoice } from "@/hooks/useInvoices";
import { PaymentMethodManager } from "@/components/billing/PaymentMethodManager";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import {
  Download,
  AlertTriangle,
  Receipt,
  Zap,
  Eye,
  CalendarClock,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Pencil,
  Users,
} from "lucide-react";
import { InvoiceStatusBadge } from "@/components/billing/InvoiceStatusBadge";
import { SubscriptionStatusBadge } from "@/components/billing/SubscriptionStatusBadge";
import type { Invoice, SubscriptionInfo, BillingInformation } from "@/types";

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function fmtCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateLong(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/* ── Status config ─────────────────────────────────────────────────────── */

type StatusCfg = {
  label: string;
  dot: string;
  bg: string;
  text: string;
  border: string;
};

function getStatusCfg(
  status: SubscriptionInfo["status"],
  isCancelling?: boolean,
): StatusCfg {
  if (isCancelling)
    return {
      label: "Cancelling",
      dot: "bg-amber-500",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-200/60 dark:border-amber-500/20",
    };
  switch (status) {
    case "trialing":
      return {
        label: "Free trial",
        dot: "bg-[var(--energy-dark)]",
        bg: "bg-[var(--energy-light)]/40 dark:bg-[var(--energy)]/10",
        text: "text-[var(--energy-dark)] dark:text-[var(--energy-light)]",
        border: "border-[var(--energy)]/30 dark:border-[var(--energy)]/20",
      };
    case "active":
      return {
        label: "Active",
        dot: "bg-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        text: "text-emerald-700 dark:text-emerald-300",
        border: "border-emerald-200/60 dark:border-emerald-500/20",
      };
    case "past_due":
      return {
        label: "Payment failed",
        dot: "bg-red-500",
        bg: "bg-red-50 dark:bg-red-500/10",
        text: "text-red-700 dark:text-red-300",
        border: "border-red-200/60 dark:border-red-500/20",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        dot: "bg-slate-400",
        bg: "bg-slate-50 dark:bg-white/5",
        text: "text-slate-600 dark:text-slate-400",
        border: "border-slate-200/60 dark:border-white/10",
      };
    default:
      return {
        label: "No plan",
        dot: "bg-slate-400",
        bg: "bg-slate-50 dark:bg-white/5",
        text: "text-slate-600 dark:text-slate-400",
        border: "border-slate-200/60 dark:border-white/10",
      };
  }
}

/* ── Invoice Status Badge (now imported from @/components/billing/InvoiceStatusBadge) ── */

/* ── Skeleton ──────────────────────────────────────────────────────────── */

function BillingSkeleton() {
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6 sm:p-8 space-y-8">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </DashboardLayout>
  );
}

/* ── Subscription Status Card ───────────────────────────────────────────── */

function SubscriptionStatusCard({
  subscription,
}: {
  subscription: SubscriptionInfo | undefined;
}) {
  if (!subscription) {
    return (
      <Card>
        <CardBody>
          <Skeleton className="h-20 rounded-xl" />
        </CardBody>
      </Card>
    );
  }

  const cfg = getStatusCfg(subscription.status, subscription.cancel_at_period_end);
  const isTrialing = subscription.status === "trialing";
  const isActive = subscription.status === "active";
  const hasPlan = subscription.tier !== "none" && subscription.tier !== "free";
  const isPaying = hasPlan && (isActive || isTrialing);
  const isFreePlan = subscription.tier === "free";
  const isCancelling = subscription.cancel_at_period_end;

  const amount = subscription.amount ?? 0;
  const priceDisplay =
    isTrialing
      ? "Free"
      : isPaying && amount > 0
        ? fmtCurrency(amount, subscription.currency ?? undefined)
        : isFreePlan
          ? "Free"
          : null;

  const daysLeft = daysUntil(subscription.trial_ends_at ?? subscription.current_period_end);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <Card className="overflow-hidden">
        {/* Subtle top accent */}
        <div
          className="h-1"
          style={{
            background:
              isActive
                ? "linear-gradient(90deg, #10b981 0%, #34d399 100%)"
                : isTrialing
                  ? "linear-gradient(90deg, var(--energy) 0%, var(--energy-light) 100%)"
                  : "linear-gradient(90deg, #94a3b8 0%, #cbd5e1 100%)",
          }}
        />

        <CardBody className="space-y-6">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div
                className={`w-11 h-11 rounded-lg ${cfg.bg} ${cfg.border} border flex items-center justify-center shrink-0`}
              >
                {isActive ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                ) : isTrialing ? (
                  <Sparkles className="w-5 h-5 text-[var(--energy-dark)]" />
                ) : (
                  <Zap className="w-5 h-5 text-slate-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-[22px] font-bold text-[var(--text-primary)] tracking-tight">
                    {subscription.tier === "none"
                      ? "Choose a plan"
                      : subscription.tier === "free"
                        ? "Free Plan"
                        : `${subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}`}
                  </h1>
                  <SubscriptionStatusBadge
                    status={subscription.status}
                    isCancelling={subscription.cancel_at_period_end}
                  />
                </div>
                <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                  {isTrialing
                    ? `Trial ends ${fmtDateLong(subscription.trial_ends_at)}${daysLeft !== null && daysLeft > 0 ? ` · ${daysLeft} days remaining` : ""}`
                    : subscription.cancel_at_period_end
                      ? `Subscription ends ${fmtDateLong(subscription.current_period_end)}`
                      : subscription.next_payment_date
                        ? `Next payment ${fmtDateLong(subscription.next_payment_date)}`
                        : "Manage your subscription below"}
                </p>
              </div>
            </div>

            {isPaying && priceDisplay && (
              <div className="text-right sm:pl-6">
                <p className="text-[32px] font-bold text-[var(--text-primary)] tracking-tight leading-none">
                  {priceDisplay}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  per {subscription.period.replace("_", " ")}
                </p>
              </div>
            )}
          </div>

          {/* Timeline */}
          {(isTrialing || isActive) && (
            <div className="pt-5 border-t border-[var(--border)]">
              <div className="flex items-center gap-3 text-sm">
                {subscription.trial_starts_at && (
                  <div className="text-center min-w-[72px]">
                    <p className="text-[10px] text-[var(--text-tertiary)] leading-tight">
                      Trial started
                    </p>
                    <p className="text-xs font-semibold text-[var(--text-primary)] mt-0.5">
                      {fmtDate(subscription.trial_starts_at)}
                    </p>
                  </div>
                )}
                {subscription.trial_starts_at && subscription.trial_ends_at && (
                  <div className="flex-1 h-px bg-[var(--border)] relative mx-1">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--energy)]" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-400" />
                  </div>
                )}
                {subscription.trial_ends_at && (
                  <div className="text-center min-w-[72px]">
                    <p className="text-[10px] text-[var(--text-tertiary)] leading-tight">
                      Trial ends
                    </p>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mt-0.5">
                      {fmtDate(subscription.trial_ends_at)}
                    </p>
                  </div>
                )}
                {subscription.next_payment_date && (
                  <>
                    <div className="flex-1 h-px bg-[var(--border)] relative mx-1">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="text-center min-w-[72px]">
                      <p className="text-[10px] text-[var(--text-tertiary)] leading-tight">
                        Next payment
                      </p>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-0.5">
                        {fmtDate(subscription.next_payment_date)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* CTA for no plan */}
          {(subscription.tier === "none" || subscription.tier === "free") && (
            <div className="pt-5 border-t border-[var(--border)] flex flex-wrap items-center gap-3">
              <Link
                href="/billing/upgrade"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--btn-bg)] text-white hover:bg-[var(--btn-hover)] transition-colors"
              >
                <Zap className="w-4 h-4" />
                Explore plans
              </Link>
              <p className="text-xs text-[var(--text-tertiary)]">
                Unlock unlimited clients and advanced features.
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
}

/* ── Usage Bar ───────────────────────────────────────────────────────────── */

function UsageBar({
  subscription,
}: {
  subscription: SubscriptionInfo | undefined;
}) {
  if (!subscription) return null;

  const count = subscription.client_count ?? 0;
  const limit = subscription.client_limit;
  const unlimited = limit === null;
  const pct = unlimited
    ? 0
    : Math.min(100, (count / Math.max(1, limit ?? 1)) * 100);

  if (unlimited) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <Users className="w-4 h-4" />
        <span>
          {count} client{count !== 1 ? "s" : ""} · Unlimited
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-secondary)]">Client usage</span>
        <span className="font-semibold text-[var(--text-primary)]">
          {count} / {limit}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor:
              pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "var(--energy)",
          }}
        />
      </div>
      {pct > 90 && (
        <p className="text-xs text-red-600 dark:text-red-400">
          You are near your client limit. Consider upgrading.
        </p>
      )}
    </div>
  );
}

/* ── Billing Info ───────────────────────────────────────────────────────── */

function BillingInfoSection() {
  const { data: billing, isLoading } = useBillingInformation();
  const updateBilling = useUpdateBillingInformation();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<BillingInformation>>({});

  const openEdit = () => {
    setForm(billing ?? {});
    setIsEditing(true);
  };

  const save = () => {
    updateBilling.mutate(form, {
      onSuccess: () => setIsEditing(false),
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardBody>
          <Skeleton className="h-6 w-32 rounded" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
        </CardBody>
      </Card>
    );
  }

  const fields: { key: keyof BillingInformation; label: string }[] = [
    { key: "first_name", label: "First name" },
    { key: "last_name", label: "Last name" },
    { key: "company", label: "Company" },
    { key: "address", label: "Address" },
    { key: "postal_code", label: "Postal code" },
    { key: "city", label: "City" },
    { key: "country", label: "Country" },
    { key: "vat_id", label: "VAT ID" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
  ];

  const hasAny = fields.some((f) => billing?.[f.key]);

  return (
    <>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Billing details
          </h2>
          <Button variant="ghost" size="sm" onClick={openEdit} className="text-xs">
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardBody className="pt-0">
          {!hasAny ? (
            <div className="py-4 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                No billing information on file.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={openEdit}
                className="mt-2 text-xs"
              >
                Add billing details
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {fields.map(({ key, label }) => {
                const value = billing?.[key];
                if (!value) return null;
                return (
                  <div key={key}>
                    <p className="text-[11px] text-[var(--text-tertiary)] mb-0.5">
                      {label}
                    </p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {value}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={isEditing}
        onClose={() => setIsEditing(false)}
        title="Edit billing details"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {fields.slice(0, 2).map(({ key, label }) => (
              <Input
                key={key}
                label={label}
                value={form[key] ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
              />
            ))}
          </div>
          {fields.slice(2).map(({ key, label }) => (
            <Input
              key={key}
              label={label}
              value={form[key] ?? ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, [key]: e.target.value }))
              }
            />
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="md" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={updateBilling.isPending}
              onClick={save}
            >
              Save changes
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ── Invoice Detail Modal ──────────────────────────────────────────────── */

function InvoiceDetailModal({
  invoice,
  open,
  onClose,
  onDownload,
  isDownloading,
}: {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
  onDownload: (id: string) => void;
  isDownloading: boolean;
}) {
  if (!invoice) return null;

  return (
    <Modal open={open} onClose={onClose} title="Payment Details" size="md">
      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-[var(--text-tertiary)] font-medium">
              Invoice number
            </p>
            <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
              {invoice.number}
            </p>
          </div>
          <InvoiceStatusBadge status={invoice.status} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[var(--text-tertiary)] font-medium">Date</p>
            <p className="text-sm font-medium text-[var(--text-primary)] mt-0.5">
              {fmtDateLong(invoice.date)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-tertiary)] font-medium">Amount</p>
            <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
              {fmtCurrency(invoice.amount, invoice.currency)}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-[var(--text-tertiary)] font-medium">
            Description
          </p>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {invoice.description ?? "Subscription"}
          </p>
        </div>

        {invoice.last4 && (
          <div>
            <p className="text-xs text-[var(--text-tertiary)] font-medium">
              Payment method
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Card ending in {invoice.last4}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" size="md" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="md"
            loading={isDownloading}
            onClick={() => onDownload(invoice.id)}
          >
            {!isDownloading && <Download className="w-4 h-4" />}
            {isDownloading ? "Downloading…" : "Download invoice"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

export default function BillingPage() {
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: invoices = [], isLoading: invLoading } = useInvoices();
  const manageBilling = useManageBilling();
  const cancelSub = useCancelSubscription();
  const upgradeSub = useUpgradeSubscription();
  const downloadInvoice = useDownloadInvoice();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const currentTier = subscription?.tier ?? "none";
  const currentPeriod = subscription?.period ?? "monthly";
  const currentStatus = subscription?.status ?? "none";
  const isTrialing = currentStatus === "trialing";
  const isCancelling = subscription?.cancel_at_period_end ?? false;
  const hasNoPlan = currentTier === "none";
  const isFreePlan = currentTier === "free";
  const isPaying = !hasNoPlan && !isFreePlan;

  const nextPaymentDateRaw =
    subscription?.next_payment_date || subscription?.current_period_end;
  const nextPaymentDate = fmtDateLong(nextPaymentDateRaw);

  const handleDownload = useCallback(
    async (id: string) => {
      try {
        const data = await downloadInvoice.mutateAsync(id);
        const url = data?.download_url || data?.hosted_invoice_url;
        if (url) window.open(url, "_blank");
      } catch {
        // handled by mutation toast
      }
    },
    [downloadInvoice],
  );

  const invoiceColumns: Column<Invoice>[] = useMemo(
    () => [
      {
        key: "description",
        header: "Description",
        render: (inv) => (
          <span className="font-medium text-[var(--text-primary)]">
            {inv.description ?? "Subscription"}
          </span>
        ),
      },
      {
        key: "date",
        header: "Date",
        sortable: true,
        sortFn: (a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
        render: (inv) => (
          <span className="text-[var(--text-secondary)]">{fmtDate(inv.date)}</span>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        sortable: true,
        sortFn: (a, b) => a.amount - b.amount,
        render: (inv) => (
          <span className="font-bold text-[var(--text-primary)]">
            {fmtCurrency(inv.amount, inv.currency)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (inv) => <InvoiceStatusBadge status={inv.status} />,
      },
      {
        key: "actions",
        header: "Actions",
        render: (inv) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedInvoice(inv)}
              className="inline-flex items-center gap-1 border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
              title="View details"
            >
              <Eye className="w-3.5 h-3.5" />
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(inv.id)}
              className="inline-flex items-center gap-1 border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--energy-dark)] hover:bg-[var(--energy-light)]/30 hover:border-[var(--energy)]/20"
              title="Download invoice"
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [handleDownload],
  );

  if (subLoading) return <BillingSkeleton />;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6 sm:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Billing
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Manage your subscription, payment methods, and invoices.
          </p>
        </div>

        {/* Subscription Status */}
        <SubscriptionStatusCard subscription={subscription} />

        {/* Plan actions, usage, period selector */}
        {!(hasNoPlan && !isTrialing) && (
          <Card>
            <CardBody className="space-y-6">
              {/* Price */}
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-[var(--text-primary)] tracking-tight">
                  {isTrialing
                    ? "Free"
                    : subscription?.amount && subscription.amount > 0
                      ? fmtCurrency(subscription.amount, subscription.currency ?? undefined)
                      : isFreePlan
                        ? "Free"
                        : "—"}
                </span>
                {!isFreePlan && (
                  <span className="text-sm text-[var(--text-tertiary)] mb-1">
                    /{subscription?.period.replace("_", " ")}
                  </span>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isTrialing && subscription?.trial_ends_at && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/15">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarClock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        Trial ends
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {fmtDateLong(subscription.trial_ends_at)}
                    </p>
                  </div>
                )}
                {nextPaymentDateRaw && (
                  <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarClock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                      <p className="text-[11px] text-[var(--text-tertiary)] font-medium">
                        {isTrialing ? "First payment" : "Next payment"}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {nextPaymentDate}
                    </p>
                  </div>
                )}
              </div>

              {/* Usage */}
              <UsageBar subscription={subscription} />

              {/* Period selector */}
              {isPaying && !isCancelling && (
                <div className="pt-4 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--text-secondary)] mb-3">
                    Billing period
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      ["monthly", "quarterly", "semi_annual", "annual"] as const
                    ).map((period) => (
                      <button
                        key={period}
                        onClick={() => {
                          if (period === currentPeriod) return;
                          upgradeSub.mutate({
                            tier: currentTier as "pro" | "business",
                            period,
                          });
                        }}
                        disabled={upgradeSub.isPending}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          currentPeriod === period
                            ? "bg-[var(--energy-light)]/50 border-[var(--energy)]/40 text-[var(--energy-dark)] dark:bg-[var(--energy)]/10 dark:text-[var(--energy-light)]"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-subtle)]"
                        }`}
                      >
                        {period === "monthly"
                          ? "Monthly"
                          : period === "quarterly"
                            ? "Quarterly"
                            : period === "semi_annual"
                              ? "6 Months"
                              : "Yearly"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center gap-3">
                {isFreePlan && (
                  <Link
                    href="/billing/upgrade"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--btn-bg)] text-white hover:bg-[var(--btn-hover)] transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    Upgrade
                  </Link>
                )}
                {isPaying && !isCancelling && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => manageBilling.mutate()}
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1" />
                      Manage billing
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCancelModal(true)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      Cancel plan
                    </Button>
                  </>
                )}
                {isCancelling && (
                  <span className="text-sm text-amber-600 dark:text-amber-400">
                    Cancels on {nextPaymentDate}
                  </span>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Payment method
            </h2>
          </CardHeader>
          <CardBody className="pt-0">
            <PaymentMethodManager />
          </CardBody>
        </Card>

        {/* Billing Details */}
        <BillingInfoSection />

        {/* Payment History */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-4 h-4 text-[var(--text-tertiary)]" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Payment history
            </h2>
            {invoices.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                {invoices.length}
              </span>
            )}
          </div>

          {invLoading ? (
            <Card>
              <CardBody>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-28 rounded" />
                      <Skeleton className="h-4 w-20 rounded" />
                      <Skeleton className="h-4 w-24 rounded" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ) : (
            <DataTable
              data={invoices}
              columns={invoiceColumns}
              keyExtractor={(inv) => inv.id}
              searchable
              paginated
              perPage={8}
              searchPlaceholder="Search invoices…"
              searchFn={(inv, q) =>
                inv.number.toLowerCase().includes(q) ||
                inv.status.toLowerCase().includes(q) ||
                (inv.description ?? "").toLowerCase().includes(q)
              }
              emptyMessage="No invoices yet"
              className="rounded-2xl"
            />
          )}
        </div>

        {/* Cancel Modal */}
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
                account will downgrade to no active plan. This action cannot be
                undone early.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setShowCancelModal(false)}
              >
                Keep plan
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
                {cancelSub.isPending ? "Cancelling…" : "Yes, cancel"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Invoice Detail Modal */}
        <InvoiceDetailModal
          invoice={selectedInvoice}
          open={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onDownload={handleDownload}
          isDownloading={downloadInvoice.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
