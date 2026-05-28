'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useCreateSupportTicket, useSubscription } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/Skeleton'
import { MessageSquare, Send, Crown, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function SupportContactPage() {
  const { data: subscription, isLoading: subLoading } = useSubscription()
  const createTicket = useCreateSupportTicket()

  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const tier = subscription?.tier ?? 'none'
  const isBusiness = tier === 'business'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    createTicket.mutate(
      { subject: subject.trim(), message: message.trim() },
      {
        onSuccess: () => {
          setSubmitted(true)
          setSubject('')
          setMessage('')
        },
      }
    )
  }

  if (subLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Settings
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {isBusiness ? 'Dedicated Support Manager' : 'Contact Support'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {isBusiness
              ? 'Business-tier priority support. Your ticket is flagged for immediate response.'
              : 'Reach out to our support team and we will get back to you within 24 hours.'}
          </p>
        </div>

        {isBusiness && (
          <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-900/30 p-4 flex items-center gap-3">
            <Crown className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
              Priority support active — average response time under 2 hours.
            </p>
          </div>
        )}

        {submitted ? (
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 p-8 flex flex-col items-center text-center">
            <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
            <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">Ticket Submitted</h3>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
              {isBusiness
                ? 'A support manager will reach out to you shortly.'
                : 'We will respond to you as soon as possible.'}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={() => setSubmitted(false)}
            >
              Send another message
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-[var(--border)] p-6 space-y-4"
          >
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="How can we help?"
                required
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or question in detail..."
                required
                rows={6}
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30 transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-[var(--text-tertiary)]">
                Include as much detail as possible so we can help faster.
              </p>
              <Button
                type="submit"
                disabled={createTicket.isPending || !subject.trim() || !message.trim()}
                loading={createTicket.isPending}
              >
                <Send className="w-4 h-4" />
                {createTicket.isPending ? 'Sending…' : 'Submit Ticket'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}
