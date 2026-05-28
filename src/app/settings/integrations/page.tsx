'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useIntegrations, useUpdateIntegrations } from '@/lib/hooks'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/button'
import { Link2, Key, Copy, Check, Globe, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function IntegrationsSkeleton() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </DashboardLayout>
  )
}

export default function IntegrationsSettingsPage() {
  const { data, isLoading } = useIntegrations()
  const updateIntegrations = useUpdateIntegrations()

  const [webhookUrl, setWebhookUrl] = useState('')
  const [copied, setCopied] = useState(false)

  if (isLoading) return <IntegrationsSkeleton />

  const currentWebhook = data?.webhook_url ?? ''
  const apiKey = data?.api_key ?? ''
  const tier = data?.tier ?? 'none'

  const handleSaveWebhook = () => {
    updateIntegrations.mutate({ webhook_url: webhookUrl })
  }

  const handleGenerateKey = () => {
    updateIntegrations.mutate({ generate_api_key: true })
  }

  const copyKey = () => {
    if (!apiKey) return
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
            Custom Integrations
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Configure webhooks and API access for your coaching platform.
          </p>
        </div>

        {/* Webhook URL */}
        <div className="rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-[var(--border)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Webhook URL</h3>
              <p className="text-xs text-[var(--text-secondary)]">Receive real-time event notifications.</p>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="url"
              defaultValue={currentWebhook}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-app.com/webhooks/coachpro"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30 transition-all"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--text-tertiary)]">We will POST JSON payloads to this URL.</p>
              <Button
                onClick={handleSaveWebhook}
                disabled={updateIntegrations.isPending || !webhookUrl}
                loading={updateIntegrations.isPending}
                size="sm"
              >
                Save URL
              </Button>
            </div>
          </div>
        </div>

        {/* API Key */}
        <div className="rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-[var(--border)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
              <Key className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">API Key</h3>
              <p className="text-xs text-[var(--text-secondary)]">Authenticate incoming API requests.</p>
            </div>
          </div>

          {apiKey ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm font-mono text-[var(--text-primary)] truncate">
                  {apiKey.slice(0, 16)}...{apiKey.slice(-8)}
                </div>
                <button
                  onClick={copyKey}
                  className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-subtle)] transition-colors"
                  title="Copy API key"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-[var(--text-secondary)]" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-tertiary)]">Include as `X-API-Key` header in requests.</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateKey}
                  disabled={updateIntegrations.isPending}
                  loading={updateIntegrations.isPending}
                >
                  Regenerate
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--text-secondary)]">No API key generated yet.</p>
              <Button
                onClick={handleGenerateKey}
                disabled={updateIntegrations.isPending}
                loading={updateIntegrations.isPending}
                size="sm"
              >
                Generate Key
              </Button>
            </div>
          )}
        </div>

        {tier !== 'business' && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 p-4 flex items-start gap-3">
            <Link2 className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Custom integrations are a Business-tier feature.{' '}
              <Link href="/billing/upgrade" className="font-semibold underline">Upgrade</Link>
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
