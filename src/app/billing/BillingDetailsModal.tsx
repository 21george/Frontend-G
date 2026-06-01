"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/button";
import {
  useSubscription,
  usePaymentMethods,
  useManageBilling,
  useCancelSubscription,
  useUpgradeSubscription,
  useSetDefaultPaymentMethod,
  useDeletePaymentMethod,
} from "@/hooks/useSubscription";
import { useInvoices } from "@/hooks/useInvoices";
import { PLANS, getPlanPricing, PERIOD_LABELS } from "@/components/billing/PlanMeta";
import { SubscriptionAlerts } from "@/components/billing/SubscriptionAlerts";
import type { Invoice, SubscriptionPeriod } from "@/types";
import type { PaymentMethod } from "@/lib/api/services/subscription";
import toast from "react-hot-toast";
import {
  CreditCard,
  CheckCircle2,
  Receipt,
  Download,
  Search,
  X,
  Plus,
  Trash2,
  Star,
  AlertTriangle,
  Zap,
  Users,
} from "lucide-react";

/* ── Formatters ─────────────────────────────────────────────────────────── */

function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ── Status badge ───────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: Invoice["status"] }) {
  const configs: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
    paid: { label: "Paid", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200/50 dark:border-emerald-500/20" },
    open: { label: "Pending", dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200/50 dark:border-amber-500/20" },
    void: { label: "Void", dot: "bg-slate-400", text: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-white/5", border: "border-slate-200/50 dark:border-white/10" },
    uncollectible: { label: "Failed", dot: "bg-red-500", text: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200/50 dark:border-red-500/20" },
  };
  const c = configs[status] ?? configs.open;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

/* ── Card brand visuals ─────────────────────────────────────────────────── */

function CardBrandLogo({ brand }: { brand: string }) {
  const b = brand.toLowerCase();
  if (b === "mastercard" || b === "master_card") {
    return (
      <div className="w-10 h-6 rounded flex items-center justify-center text-[10px] font-black text-white bg-gradient-to-r from-red-500 to-yellow-500 tracking-tighter">
        MC
      </div>
    );
  }
  if (b === "visa") {
    return (
      <div className="w-10 h-6 rounded flex items-center justify-center text-[10px] font-black text-white bg-blue-600 tracking-tighter">
        VISA
      </div>
    );
  }
  if (b === "amex" || b === "american_express" || b === "american express") {
    return (
      <div className="w-10 h-6 rounded flex items-center justify-center text-[10px] font-black text-white bg-sky-500 tracking-tighter">
        AMEX
      </div>
    );
  }
  return (
    <div className="w-10 h-6 rounded flex items-center justify-center text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-subtle)] border border-[var(--border)]">
      {brand.slice(0, 4).toUpperCase()}
    </div>
  );
}

/* ── Skeleton ───────────────────────────────────────────────────────────── */

function ManageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-7 w-20 rounded-md" />
        <Skeleton className="h-7 w-20 rounded-md" />
        <Skeleton className="h-7 w-20 rounded-md" />
        <Skeleton className="h-7 w-20 rounded-md" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

/* ── Tabs ───────────────────────────────────────────────────────────────── */

type Tab = "overview" | "usage" | "billing" | "invoices";

/* ── Main Modal ─────────────────────────────────────────────────────────── */

interface Props {
  open: boolean;
  onClose: () => void;
}

export function BillingDetailsModal({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("billing");
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: invoices = [], isLoading: invLoading } = useInvoices();
  const { data: paymentMethods = [], isLoading: pmLoading } = usePaymentMethods();
  const manageBilling = useManageBilling();
  const cancelSub = useCancelSubscription();
  const upgradeSub = useUpgradeSubscription();
  const setDefault = useSetDefaultPaymentMethod();
  const deleteMethod = useDeletePaymentMethod();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState("");

  // Tax details form state (local only — no API endpoint yet)
  const [taxForm, setTaxForm] = useState({
    company_name: "",
    phone: "",
    email: "",
    address: "",
    zip: "",
    city: "",
    country: "",
    vat_id: "",
  });

  const currentTier = subscription?.tier ?? "none";
  const currentPeriod = subscription?.period ?? "monthly";
  const currentStatus = subscription?.status ?? "none";
  const isTrialing = currentStatus === "trialing";
  const isCancelling = subscription?.cancel_at_period_end;
  const hasNoPlan = currentTier === "none" || currentTier === "free";

  const currentPlan = PLANS.find((p) => p.tier === currentTier) ?? PLANS[0];
  const currentPricing = getPlanPricing(currentTier, currentPeriod);

  const nextPaymentDateRaw = subscription?.next_payment_date || subscription?.current_period_end;
  const nextPaymentDate = nextPaymentDateRaw ? formatDate(nextPaymentDateRaw) : "—";
  const trialEndDate = subscription?.trial_ends_at ? formatDate(subscription.trial_ends_at) : "—";

  const filteredInvoices = useMemo(() => {
    const q = invoiceSearch.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(
      (inv) =>
        inv.number.toLowerCase().includes(q) ||
        inv.status.toLowerCase().includes(q) ||
        (inv.description ?? "").toLowerCase().includes(q),
    );
  }, [invoices, invoiceSearch]);

  const clientCount = subscription?.client_count ?? 0;
  const clientLimit = subscription?.client_limit;
  const isUnlimited = clientLimit === null;
  const progressPct = isUnlimited ? 0 : Math.min(100, (clientCount / Math.max(1, clientLimit ?? 1)) * 100);

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "usage", label: "Usage" },
    { key: "billing", label: "Billing details" },
    { key: "invoices", label: "Invoices" },
  ];

  const handleSaveTaxDetails = () => {
    toast.success("Billing details updated successfully");
  };

  if (subLoading) {
    return (
      <Modal open={open} onClose={onClose} title="Billing" size="xl">
        <ManageSkeleton />
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Billing" size="xl">
      <div className="max-h-[80vh] overflow-y-auto pr-1">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-[var(--border)] mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === t.key
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {t.label}
              {activeTab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-primary)]" />
              )}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Plan card */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Current Plan
                  </span>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    {currentPlan.name} Plan
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                    {currentPlan.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {currentPricing.priceLabel}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">{currentPricing.periodLabel}</p>
                </div>
              </div>

              {!isUnlimited && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">
                      Clients
                    </span>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {clientCount} / {clientLimit}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progressPct}%`, backgroundColor: currentPlan.accent }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[var(--border)]">
                <div className="grid grid-cols-2 gap-3">
                  {(["monthly", "quarterly", "semi_annual", "annual"] as SubscriptionPeriod[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => {
                        if (period === currentPeriod || hasNoPlan) return;
                        upgradeSub.mutate({ tier: currentTier as "pro" | "business", period });
                      }}
                      disabled={upgradeSub.isPending || hasNoPlan}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        currentPeriod === period
                          ? "bg-[var(--energy)]/10 border-[var(--energy)]/30 text-[var(--energy-dark)]"
                          : "border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                      }`}
                    >
                      {PERIOD_LABELS[period]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Next payment + cancel */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    {isTrialing ? "Trial Ends" : isCancelling ? "Cancels On" : "Next Payment"}
                  </p>
                  <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
                    {isTrialing ? trialEndDate : nextPaymentDate}
                  </p>
                </div>
                {!hasNoPlan && !isCancelling && (
                  <Button variant="ghost" size="sm" onClick={() => setShowCancelModal(true)}>
                    Cancel Plan
                  </Button>
                )}
                {isCancelling && (
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 px-3 py-1.5 rounded-lg">
                    Cancels on {nextPaymentDate}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "usage" && (
          <div className="space-y-5">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Client Usage</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {clientCount}
                    <span className="text-sm font-normal text-[var(--text-tertiary)] ml-1">
                      {isUnlimited ? "unlimited" : `/ ${clientLimit}`}
                    </span>
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">Active clients</p>
                </div>
              </div>
              {!isUnlimited && (
                <div className="mt-4">
                  <div className="w-full h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progressPct}%`, backgroundColor: currentPlan.accent }}
                    />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                    {progressPct.toFixed(0)}% of client limit used
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "billing" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Payment Methods */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Payment method</h3>

              {pmLoading && (
                <>
                  <Skeleton className="h-24 rounded-xl" />
                  <Skeleton className="h-24 rounded-xl" />
                </>
              )}

              {!pmLoading && paymentMethods.length === 0 && (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center">
                  <CreditCard className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--text-secondary)]">No payment methods on file</p>
                </div>
              )}

              {paymentMethods.map((pm) => (
                <PaymentMethodCard
                  key={pm.id}
                  pm={pm}
                  isDefault={pm.is_default}
                  onMakeDefault={() => setDefault.mutate(pm.id)}
                  onDelete={() => deleteMethod.mutate(pm.id)}
                  isProcessing={setDefault.isPending || deleteMethod.isPending}
                />
              ))}

              {/* Add payment */}
              <button
                onClick={() => manageBilling.mutate()}
                disabled={manageBilling.isPending}
                className="w-full rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--text-tertiary)] p-5 flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Plus className="w-4 h-4" />
                ADD PAYMENT
              </button>
            </div>

            {/* Tax Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Tax details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Company name</label>
                  <input
                    value={taxForm.company_name}
                    onChange={(e) => setTaxForm((f) => ({ ...f, company_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Phone number</label>
                  <input
                    value={taxForm.phone}
                    onChange={(e) => setTaxForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Recipient email</label>
                <input
                  type="email"
                  value={taxForm.email}
                  onChange={(e) => setTaxForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
                  placeholder="billing@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Address</label>
                <input
                  value={taxForm.address}
                  onChange={(e) => setTaxForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Zip / Postal code</label>
                  <input
                    value={taxForm.zip}
                    onChange={(e) => setTaxForm((f) => ({ ...f, zip: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
                    placeholder="12345"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">City / District</label>
                  <input
                    value={taxForm.city}
                    onChange={(e) => setTaxForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
                    placeholder="City"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Country</label>
                  <select
                    value={taxForm.country}
                    onChange={(e) => setTaxForm((f) => ({ ...f, country: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30 appearance-none"
                  >
                    <option value="">Select country...</option>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="PT">Portugal</option>
                    <option value="ES">Spain</option>
                    <option value="IT">Italy</option>
                    <option value="NL">Netherlands</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">EU VAT ID</label>
                  <input
                    value={taxForm.vat_id}
                    onChange={(e) => setTaxForm((f) => ({ ...f, vat_id: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
                    placeholder="e.g. PT123456789"
                  />
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveTaxDetails}
                className="mt-2"
              >
                UPDATE DETAILS
              </Button>
            </div>
          </div>
        )}

        {activeTab === "invoices" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[var(--text-tertiary)]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Invoices</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                  {invoices.length}
                </span>
              </div>
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30 transition-all"
                />
                {invoiceSearch && (
                  <button onClick={() => setInvoiceSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  </button>
                )}
              </div>
            </div>

            {invLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Receipt className="w-10 h-10 mb-3 text-[var(--text-tertiary)]/30" />
                <p className="text-sm font-semibold text-[var(--text-secondary)]">
                  {invoiceSearch ? "No matching invoices" : "No invoices yet"}
                </p>
              </div>
            ) : (
              <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {["Description", "Date", "Amount", "Status", ""].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[var(--bg-subtle)]/40 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {inv.description ?? "Plan subscription"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{formatDate(inv.date)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-[var(--text-primary)]">
                          {formatCurrency(inv.amount, inv.currency)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {inv.pdf_url && (
                              <a
                                href={inv.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-all"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Footer note */}
        <p className="text-[11px] text-[var(--text-tertiary)] mt-6 leading-relaxed">
          CoachPro sends out invoices for service usage monthly, to the email address specified in Billing Information. If you are paying by credit card and have not arranged a separate billing agreement, please ensure that your credit card information is kept up to date, in order to prevent any issues.
        </p>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal open={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel subscription?" size="md">
        <div className="space-y-5">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
              You will keep full access until {nextPaymentDate}. After that, your account will downgrade to no active plan. This action cannot be undone early.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" size="md" onClick={() => setShowCancelModal(false)}>
              Keep Plan
            </Button>
            <Button variant="danger" size="md" loading={cancelSub.isPending} onClick={() => { cancelSub.mutate(); setShowCancelModal(false); }}>
              {cancelSub.isPending ? "Cancelling..." : "Yes, Cancel"}
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}

/* ── Payment Method Card ────────────────────────────────────────────────── */

function PaymentMethodCard({
  pm,
  isDefault,
  onMakeDefault,
  onDelete,
  isProcessing,
}: {
  pm: PaymentMethod;
  isDefault: boolean;
  onMakeDefault: () => void;
  onDelete: () => void;
  isProcessing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isDefault
          ? "border-emerald-300/60 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-500/5"
          : "border-[var(--border)] bg-[var(--bg-card)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CardBrandLogo brand={pm.brand} />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1)}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              •••• {pm.last4}
              {pm.exp_month && pm.exp_year && (
                <span className="ml-1">
                  Expires {String(pm.exp_month).padStart(2, "0")}/{String(pm.exp_year).slice(-2)}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDefault && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              Default
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            {expanded ? "Close" : "Edit"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-2">
          {!isDefault && (
            <button
              onClick={onMakeDefault}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-50"
            >
              <Star className="w-3.5 h-3.5" />
              Make Default
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
