'use client'

import { Modal } from './Modal'
import { AlertTriangle, XCircle, WifiOff, Clock, ShieldAlert } from 'lucide-react'
import type { ApiError } from '@/lib/api/errors'

interface ErrorModalProps {
  open: boolean
  onClose: () => void
  error: ApiError | null
  onRetry?: () => void
  retryLabel?: string
  dismissLabel?: string
}

/* ── Icon + colour per status range ──────────────────────────────────────── */
function getStyle(status: number) {
  if (status === 0)   return { icon: WifiOff,      bg: 'bg-slate-100 dark:bg-slate-800',       text: 'text-slate-600 dark:text-slate-300' }
  if (status === 401) return { icon: ShieldAlert,   bg: 'bg-amber-100 dark:bg-amber-900/20',    text: 'text-amber-600 dark:text-amber-400' }
  if (status === 403) return { icon: ShieldAlert,   bg: 'bg-red-100 dark:bg-red-900/20',        text: 'text-red-600 dark:text-red-400' }
  if (status === 404) return { icon: XCircle,        bg: 'bg-slate-100 dark:bg-slate-800',       text: 'text-slate-600 dark:text-slate-300' }
  if (status === 429) return { icon: Clock,          bg: 'bg-orange-100 dark:bg-orange-900/20',   text: 'text-orange-600 dark:text-orange-400' }
  if (status >= 500)  return { icon: AlertTriangle,  bg: 'bg-red-100 dark:bg-red-900/20',        text: 'text-red-600 dark:text-red-400' }
  return                  { icon: AlertTriangle,  bg: 'bg-slate-100 dark:bg-slate-800',       text: 'text-slate-600 dark:text-slate-300' }
}

export function ErrorModal({ open, onClose, error, onRetry, retryLabel = 'Try again', dismissLabel = 'Dismiss' }: ErrorModalProps) {
  const styleInfo = error ? getStyle(error.status) : null
  const Icon = styleInfo?.icon

  return (
    <Modal open={open && !!error} onClose={onClose} size="sm">
      {error && styleInfo && Icon && (
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div className={`w-12 h-12 flex items-center justify-center mb-4 ${styleInfo.bg}`}>
          <Icon className={`w-6 h-6 ${styleInfo.text}`} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          {error.title}
        </h3>

        {/* Message */}
        <p className="text-sm text-[var(--text-tertiary)] mb-6 max-w-xs">
          {error.message}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
          >
            {dismissLabel}
          </button>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
            >
              {retryLabel}
            </button>
          )}
        </div>
      </div>
      )}
    </Modal>
  )
}