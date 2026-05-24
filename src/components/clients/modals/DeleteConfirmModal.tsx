'use client'

import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

interface Props {
  open: boolean
  type: 'client' | 'workout'
  clientName: string
  planTitle?: string
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
  error: string | null
}

export function DeleteConfirmModal({ open, type, clientName, planTitle, onClose, onConfirm, isLoading, error }: Props) {
  const isClient = type === 'client'
  const title = isClient ? 'Delete Client' : 'Delete Workout Plan'
  const description = isClient
    ? `Are you sure you want to permanently delete ${clientName}? This will remove all their data including workouts, nutrition plans, messages, and check-ins. This action cannot be undone.`
    : `Are you sure you want to delete "${planTitle ?? 'this workout plan'}"? All logs and progress data for this plan will be lost.`

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/30">
          <AlertTriangle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-red-800 dark:text-red-300 leading-relaxed">{description}</p>
        </div>

        {error && (
          <p className="text-[12px] text-red-600 dark:text-red-400 px-1">{error}</p>
        )}

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-[13px] font-medium border border-[var(--border)] dark:border-white/[0.09] text-[var(--text-secondary)] dark:text-[var(--text-secondary)] hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isLoading}
            className="flex-1 py-2.5 text-[13px] font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? 'Deleting…' : isClient ? 'Delete Client' : 'Delete Plan'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
