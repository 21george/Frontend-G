'use client';

import { Check, Pencil } from 'lucide-react';

interface PaymentCardVisualProps {
  brand: string;
  last4: string;
  expMonth: number | null;
  expYear: number | null;
  isDefault?: boolean;
  onSetDefault?: () => void;
  className?: string;
}

const brandColors: Record<string, { bg: string; text: string; logo: string }> = {
  visa: {
    bg: 'bg-[#1A1F71]',
    text: 'text-white',
    logo: 'VISA',
  },
  mastercard: {
    bg: 'bg-[#EB001B]',
    text: 'text-white',
    logo: 'mastercard',
  },
  amex: {
    bg: 'bg-[#016FD0]',
    text: 'text-white',
    logo: 'AMEX',
  },
  discover: {
    bg: 'bg-[#FF6000]',
    text: 'text-white',
    logo: 'Discover',
  },
  default: {
    bg: 'bg-slate-700',
    text: 'text-white',
    logo: 'CARD',
  },
};

export function PaymentCardVisual({
  brand,
  last4,
  expMonth,
  expYear,
  isDefault = false,
  onSetDefault,
  className = '',
}: PaymentCardVisualProps) {
  const normalized = brand.toLowerCase();
  const style = brandColors[normalized] ?? brandColors.default;

  const exp = `${expMonth?.toString().padStart(2, '0') ?? '--'}/${expYear?.toString().slice(-2) ?? '--'}`;

  if (isDefault) {
    return (
      <div
        className={`relative rounded-2xl p-5 ${style.bg} ${style.text} shadow-xl overflow-hidden ${className}`}
      >
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full border-2 border-white" />
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full border-2 border-white" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-bold tracking-wider">{style.logo}</span>
            <div className="w-7 h-7 rounded-full bg-[#F97316] flex items-center justify-center">
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
          </div>

          <p className="text-[10px] uppercase tracking-wider opacity-60 mb-1">Card Number</p>
          <p className="text-lg font-mono font-medium tracking-wider mb-4">
            **** **** **** {last4}
          </p>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">Expiry Date</p>
              <p className="text-sm font-mono">{exp}</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs font-medium">
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-2xl p-5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-subtle)]/80 transition-colors overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <span className={`text-sm font-bold tracking-wider ${style.bg} ${style.text} px-2 py-0.5 rounded-md`}>
          {style.logo}
        </span>
      </div>

      <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Card Number</p>
      <p className="text-lg font-mono font-medium text-[var(--text-primary)] tracking-wider mb-4">
        **** **** **** {last4}
      </p>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-0.5">Expiry Date</p>
          <p className="text-sm font-mono text-[var(--text-primary)]">{exp}</p>
        </div>
        <div className="flex items-center gap-2">
          {onSetDefault && (
            <button
              onClick={onSetDefault}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--energy)] hover:bg-white dark:hover:bg-white/5 transition-colors"
            >
              Set as default
            </button>
          )}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white dark:hover:bg-white/5 transition-colors text-xs font-medium text-[var(--text-secondary)]">
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
