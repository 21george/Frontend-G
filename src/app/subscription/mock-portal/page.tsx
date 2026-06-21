"use client";

import { useRouter } from "next/navigation";
import { CreditCard, ArrowLeft, Wrench } from "lucide-react";

export default function MockPortalPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] px-4">
      <div className="max-w-md w-full bg-[var(--bg-card)] border border-[var(--border)] dark:border-white/[0.08] p-8 text-center space-y-5">
        <div className="mx-auto w-14 h-14 bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center rounded-full">
          <Wrench className="w-7 h-7 text-amber-600 dark:text-amber-400" />
        </div>

        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
            Billing Portal
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Stripe is not configured in development mode.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] p-4 text-left space-y-2">
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide font-semibold">
            What you can do here
          </p>
          <ul className="text-sm text-[var(--text-secondary)] space-y-1.5 list-disc list-inside">
            <li>Update payment methods</li>
            <li>View invoices</li>
            <li>Cancel or change subscription</li>
          </ul>
        </div>

        <button
          onClick={() => router.push("/subscription/select-plan")}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors"
        >
          <CreditCard size={16} /> Manage Subscription
        </button>

        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={14} /> Go back
        </button>
      </div>
    </div>
  );
}
