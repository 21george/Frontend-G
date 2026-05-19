'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'
import { useSubscription, useManageBilling } from '@/lib/hooks'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Phone, Globe, Link as LinkIcon, Lock, Bell, Shield,
  ChevronRight, Moon, Sun, Key,
  CreditCard, Crown, Zap, Building2, Pencil,
  Loader2, AlertTriangle, Clock
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════════
   UI Primitives
   ═══════════════════════════════════════════════════════════════════════════ */

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm ${className}`}>
      {children}
    </div>
  )
}

function CardHeader({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[var(--btn-bg)] flex items-center justify-center rounded-lg">
          {icon}
        </div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full cursor-pointer border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-[var(--accent)]' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 rounded-full transform bg-white shadow-sm transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon?: React.ReactNode
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3.5 px-6 hover:bg-[var(--bg-subtle)] transition-colors">
      <div className="flex items-center gap-3 flex-1">
        {icon && <div className="text-[var(--text-tertiary)]">{icon}</div>}
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
          {description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>}
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

function ActionRow({
  icon,
  label,
  description,
  onClick,
  actionText,
}: {
  icon?: React.ReactNode
  label: string
  description?: string
  onClick?: () => void
  actionText?: string
}) {
  const content = (
    <div className="flex items-center justify-between py-3.5 px-6 hover:bg-[var(--bg-subtle)] transition-colors w-full text-left">
      <div className="flex items-center gap-3 flex-1">
        {icon && <div className="text-[var(--text-tertiary)]">{icon}</div>}
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
          {description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {actionText && <span className="text-sm font-medium text-[var(--text-secondary)]">{actionText}</span>}
        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
      </div>
    </div>
  )

  if (onClick) {
    return <button onClick={onClick} className="w-full">{content}</button>
  }
  return content
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      {icon && <div className="text-[var(--text-tertiary)]">{icon}</div>}
      <div>
        <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-[var(--text-primary)] mt-0.5">{value || '—'}</p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════════════════ */

export default function SettingsPage() {
  const { coach } = useAuthStore()
  const { theme, toggle: toggleTheme } = useThemeStore()
  const { data: subscription } = useSubscription()
  const manageBilling = useManageBilling()

  const [imageErrored, setImageErrored] = useState(false)
  const [showPwModal, setShowPwModal] = useState(false)

  // Notification toggles (local state only for demo — wire to API as needed)
  const [notifNewClient, setNotifNewClient] = useState(true)
  const [notifMessages, setNotifMessages] = useState(true)
  const [notifCheckins, setNotifCheckins] = useState(true)
  const [loginAlerts, setLoginAlerts] = useState(true)
  const [doNotDisturb, setDoNotDisturb] = useState(false)

  // Password modal state
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMessage, setPwMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => setImageErrored(false), [coach?.profile_photo])

  const handleChangePassword = async () => {
    if (pwNew.length < 8) { setPwMessage({ type: 'err', text: 'At least 8 characters' }); return }
    if (pwNew !== pwConfirm) { setPwMessage({ type: 'err', text: 'Passwords do not match' }); return }
    setPwSaving(true); setPwMessage(null)
    try {
      const api = (await import('@/lib/api')).default
      await api.put('/coach/profile/password', { current_password: pwCurrent, new_password: pwNew })
      setPwMessage({ type: 'ok', text: 'Password changed' })
      setTimeout(() => { setShowPwModal(false); setPwCurrent(''); setPwNew(''); setPwConfirm('') }, 1200)
    } catch (err: any) {
      setPwMessage({ type: 'err', text: err?.response?.data?.message ?? 'Failed' })
    } finally { setPwSaving(false) }
  }

  const tier = subscription?.tier ?? 'free'
  const tierLabel = tier === 'pro' ? 'Pro' : tier === 'business' ? 'Business' : 'Free'
  const TierIcon = tier === 'business' ? Building2 : tier === 'pro' ? Crown : Zap
  const isTrialing = subscription?.status === 'trialing'
  const isPastDue = subscription?.status === 'past_due'

  return (
    <div className="max-w-6xl mx-auto pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">Settings</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Personalize your account and manage preferences securely.
          </p>
        </div>
        <Link
          href="/settings/edit"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--btn-bg)] text-white text-sm font-medium rounded-lg hover:bg-[var(--btn-hover)] transition-colors shadow-sm"
        >
          <Pencil className="w-4 h-4" />
          Edit Profile
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Profile Card */}
          <Card>
            <CardHeader
              icon={<User className="w-5 h-5 text-white" />}
              title="Profile Settings"
              action={
                <Link
                  href="/settings/edit"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:text-emerald-600 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Link>
              }
            />
            <div className="p-6">
              <div className="flex items-start gap-5 mb-6">
                <div className="relative h-20 w-20 rounded-full flex-shrink-0">
                  {coach?.profile_photo ? (
                    <>
                      {!imageErrored ? (
                        <Image
                          src={coach.profile_photo}
                          alt={coach.name ?? 'Profile'}
                          fill
                          className="rounded-full object-cover ring-2 ring-[var(--border)]"
                          sizes="96px"
                          unoptimized
                          onError={() => setImageErrored(true)}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[var(--btn-bg)] text-white text-lg font-bold">
                          {coach.name?.[0]?.toUpperCase() ?? 'C'}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-tertiary)]">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    {coach?.name} {coach?.surname}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">{coach?.email}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-[var(--accent-light)] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
                      Coach
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-[var(--bg-subtle)] text-[var(--text-secondary)] rounded-full">
                      {coach?.language === 'de' ? 'Deutsch' : 'English'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                <InfoRow label="First Name" value={coach?.name ?? ''} icon={<User className="w-4 h-4" />} />
                <InfoRow label="Last Name" value={coach?.surname ?? ''} icon={<User className="w-4 h-4" />} />
                <InfoRow label="Phone" value={coach?.phone ?? ''} icon={<Phone className="w-4 h-4" />} />
                <InfoRow label="Email" value={coach?.email ?? ''} icon={<Mail className="w-4 h-4" />} />
              </div>

              {(coach?.social_media?.linkedin || coach?.social_media?.instagram || coach?.social_media?.website) && (
                <div className="mt-5 pt-5 border-t border-[var(--border)]">
                  <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3">Social Links</p>
                  <div className="flex flex-wrap gap-3">
                    {coach.social_media.linkedin && (
                      <a href={coach.social_media.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        <Globe className="w-3.5 h-3.5" /> LinkedIn
                      </a>
                    )}
                    {coach.social_media.instagram && (
                      <a href={coach.social_media.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        <Globe className="w-3.5 h-3.5" /> Instagram
                      </a>
                    )}
                    {coach.social_media.website && (
                      <a href={coach.social_media.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        <LinkIcon className="w-3.5 h-3.5" /> Website
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Account & Security */}
          <Card>
            <CardHeader icon={<Shield className="w-5 h-5 text-white" />} title="Account & Security" />
            <div className="divide-y divide-[var(--border)]">
              <ActionRow
                icon={<Lock className="w-5 h-5" />}
                label="Password"
                description="Change your password securely"
                actionText="Change"
                onClick={() => setShowPwModal(true)}
              />
              <ActionRow
                icon={<Key className="w-5 h-5" />}
                label="Manage Logged Devices"
                description="View and revoke active sessions"
                actionText="View all active logins"
              />
              <ToggleRow
                icon={<Bell className="w-5 h-5" />}
                label="Login Alerts"
                description="Notify on new/unfamiliar logins"
                checked={loginAlerts}
                onChange={setLoginAlerts}
              />
              <div className="flex items-center justify-between py-3.5 px-6 hover:bg-[var(--bg-subtle)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-[var(--text-tertiary)]">
                    {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Theme</p>
                    <p className="text-xs text-[var(--text-secondary)]">Switch between light and dark mode</p>
                  </div>
                </div>
                <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
              </div>
            </div>
          </Card>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-6">

          {/* Notifications */}
          <Card>
            <CardHeader icon={<Bell className="w-5 h-5 text-white" />} title="Notification Settings" />
            <div className="divide-y divide-[var(--border)]">
              <div className="px-6 py-3">
                <p className="text-sm font-medium text-[var(--text-primary)]">Notification Channels</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Email & in-app</p>
              </div>
              <ToggleRow label="Appointments" description="New or updated check-ins" checked={notifCheckins} onChange={setNotifCheckins} />
              <ToggleRow label="New Clients" description="When a new client signs up" checked={notifNewClient} onChange={setNotifNewClient} />
              <ToggleRow label="Messages" description="New message notifications" checked={notifMessages} onChange={setNotifMessages} />
              <ToggleRow label="Login Alerts" description="Notify on new/unfamiliar logins" checked={loginAlerts} onChange={setLoginAlerts} />
              <ToggleRow label="Do Not Disturb" description="Mute notifications during set hours" checked={doNotDisturb} onChange={setDoNotDisturb} />
              {doNotDisturb && (
                <div className="px-6 py-3 bg-[var(--bg-subtle)]">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <span>From:</span>
                      <span className="font-medium text-[var(--text-primary)]">22:00</span>
                      <span className="mx-1">—</span>
                      <span>To:</span>
                      <span className="font-medium text-[var(--text-primary)]">07:00</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Billing & Subscription */}
          <Card>
            <CardHeader
              icon={<CreditCard className="w-5 h-5 text-white" />}
              title="Billing & Subscription"
              action={
                <button
                  onClick={() => manageBilling.mutate()}
                  disabled={manageBilling.isPending}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:text-emerald-600 transition-colors disabled:opacity-50"
                >
                  {manageBilling.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
                  {manageBilling.isPending ? 'Opening…' : 'Manage'}
                </button>
              }
            />
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${
                  tier === 'business' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                  : tier === 'pro' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  <TierIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">{tierLabel} Plan</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {tier === 'pro' ? '$29 / month' : tier === 'business' ? '$79 / month' : 'Free forever'}
                  </p>
                </div>
              </div>

              {isPastDue && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400">Payment failed. Update your payment method to continue using premium features.</p>
                </div>
              )}

              {isTrialing && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Trial active until {subscription?.trial_ends_at ? new Date(subscription.trial_ends_at).toLocaleDateString() : 'soon'}.
                  </p>
                </div>
              )}

              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Status</span>
                  <span className={`font-medium ${
                    subscription?.status === 'active' ? 'text-[var(--accent)]'
                    : isPastDue ? 'text-red-600'
                    : 'text-[var(--text-secondary)]'
                  }`}>
                    {subscription?.status === 'active' ? 'Active' : subscription?.status === 'trialing' ? 'Trialing' : isPastDue ? 'Past Due' : 'Free'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Clients</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {subscription?.client_count ?? 0} / {subscription?.client_limit ?? 3}
                  </span>
                </div>
                {subscription?.current_period_end && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Renews</span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="w-full h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden mb-5">
                <div
                  className={`h-full rounded-full transition-all ${
                    ((subscription?.client_count ?? 0) / (subscription?.client_limit ?? 3)) > 0.8
                      ? 'bg-red-500'
                      : 'bg-[var(--accent)]'
                  }`}
                  style={{
                    width: `${Math.min(((subscription?.client_count ?? 0) / (subscription?.client_limit ?? 3)) * 100, 100)}%`,
                  }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => manageBilling.mutate()}
                  disabled={manageBilling.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--btn-bg)] text-white text-sm font-medium rounded-lg hover:bg-[var(--btn-hover)] transition-colors disabled:opacity-50"
                >
                  {manageBilling.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  {manageBilling.isPending ? 'Opening Portal…' : 'Update Subscription Info'}
                </button>
                <Link
                  href="/billing"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                  View Plans & Billing
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {showPwModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => { setShowPwModal(false); setPwMessage(null); setPwCurrent(''); setPwNew(''); setPwConfirm('') }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-[var(--bg-card)] border border-[var(--border)] w-full max-w-md rounded-xl p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-[var(--btn-bg)] flex items-center justify-center rounded-lg">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">Change Password</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Update your password securely</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Current Password</label>
                  <input type="password" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} placeholder="Enter current password" className="input mt-1.5 rounded-lg" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">New Password</label>
                  <input type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} placeholder="At least 8 characters" className="input mt-1.5 rounded-lg" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Confirm Password</label>
                  <input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} placeholder="Re-enter new password" className="input mt-1.5 rounded-lg" />
                </div>

                {pwMessage && (
                  <div className={`p-3 text-sm rounded-lg ${pwMessage.type === 'ok' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'}`}>
                    {pwMessage.text}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                  <button
                    onClick={() => { setShowPwModal(false); setPwMessage(null); setPwCurrent(''); setPwNew(''); setPwConfirm('') }}
                    className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={pwSaving}
                    className="px-4 py-2 bg-[var(--btn-bg)] text-white text-sm font-medium hover:bg-[var(--btn-hover)] transition-colors disabled:opacity-50 rounded-lg"
                  >
                    {pwSaving ? 'Saving…' : 'Update Password'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
