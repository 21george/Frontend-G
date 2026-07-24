"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth";
import { useThemeStore } from "@/store/theme";
import {
  useSubscription,
  useManageBilling,
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "@/lib/hooks";
import { safeHref } from "@/lib/safeHref";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Globe,
  Link as LinkIcon,
  Lock,
  Bell,
  Shield,
  ChevronRight,
  Moon,
  Sun,
  Key,
  CreditCard,
  Crown,
  Zap,
  Building2,
  Pencil,
  Loader2,
  AlertTriangle,
  Clock,
  Trash2,
  Users,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { SettingsSkeleton } from "@/components/ui/skeletons";
import { ChangePasswordModal } from "@/components/settings/ChangePasswordModal";
import { DeleteAccountModal } from "@/components/settings/DeleteAccountModal";

/* ── Small self-contained avatar component ─────────────────────── */

function ProfilePhoto({
  src,
  alt,
  fallback,
}: {
  src: string;
  alt: string;
  fallback: React.ReactNode;
}) {
  const [errored, setErrored] = useState(false);
  if (errored) return <>{fallback}</>;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="rounded-full object-cover ring-2 ring-[var(--border)]"
      sizes="96px"
      unoptimized
      onError={() => setErrored(true)}
    />
  );
}

/* ── UI Primitives ─────────────────────────────────────────────── */

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({
  icon,
  title,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[var(--btn-bg)] flex items-center justify-center rounded-lg">
          {icon}
        </div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full cursor-pointer border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? "bg-[var(--accent)]" : "bg-slate-300 dark:bg-slate-600"
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 rounded-full transform bg-white shadow-sm transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 px-6 hover:bg-[var(--bg-subtle)] transition-colors">
      <div className="flex items-center gap-3 flex-1">
        {icon && <div className="text-[var(--text-tertiary)]">{icon}</div>}
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {label}
          </p>
          {description && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function ActionRow({
  icon,
  label,
  description,
  onClick,
  actionText,
}: {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  actionText?: string;
}) {
  const content = (
    <div className="flex items-center justify-between py-3.5 px-6 hover:bg-[var(--bg-subtle)] transition-colors w-full text-left">
      <div className="flex items-center gap-3 flex-1">
        {icon && <div className="text-[var(--text-tertiary)]">{icon}</div>}
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {label}
          </p>
          {description && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {actionText && (
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            {actionText}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full">
        {content}
      </button>
    );
  }
  return content;
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      {icon && <div className="text-[var(--text-tertiary)]">{icon}</div>}
      <div>
        <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-medium text-[var(--text-primary)] mt-0.5">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────── */

export default function SettingsPage() {
  const { coach } = useAuthStore();
  const { theme, toggle: toggleTheme } = useThemeStore();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const manageBilling = useManageBilling();

  const [showPwModal, setShowPwModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: notifData, isLoading: notifLoading } =
    useNotificationSettings();
  const updateNotif = useUpdateNotificationSettings();

  if (subLoading || notifLoading) {
    return (
      <DashboardLayout>
        <SettingsSkeleton />
      </DashboardLayout>
    );
  }

  const notifNewClient = notifData?.consultation ?? false;
  const notifMessages = notifData?.email_sms ?? true;
  const notifCheckins = notifData?.appointments ?? false;
  const loginAlerts = notifData?.login_alerts ?? true;
  const doNotDisturb = notifData?.dnd_enabled ?? false;

  const tier = subscription?.tier ?? "free";
  const tierLabel =
    tier === "pro" ? "Pro" : tier === "business" ? "Business" : "Free";
  const TierIcon =
    tier === "business" ? Building2 : tier === "pro" ? Crown : Zap;
  const isTrialing = subscription?.status === "trialing";
  const isPastDue = subscription?.status === "past_due";

  return (
    <DashboardLayout>
      <div className="mx-auto pb-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8" />

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
                      <ProfilePhoto
                        key={coach.profile_photo}
                        src={coach.profile_photo}
                        alt={coach.name ?? "Profile"}
                        fallback={
                          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[var(--btn-bg)] text-white text-lg font-bold">
                            {coach.name?.[0]?.toUpperCase() ?? "C"}
                          </div>
                        }
                      />
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
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                      {coach?.email}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-[var(--accent-light)] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
                        Coach
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-[var(--bg-subtle)] text-[var(--text-secondary)] rounded-full">
                        {coach?.language === "de" ? "Deutsch" : "English"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                  <InfoRow
                    label="First Name"
                    value={coach?.name ?? ""}
                    icon={<User className="w-4 h-4" />}
                  />
                  <InfoRow
                    label="Last Name"
                    value={coach?.surname ?? ""}
                    icon={<User className="w-4 h-4" />}
                  />
                  <InfoRow
                    label="Phone"
                    value={coach?.phone ?? ""}
                    icon={<Phone className="w-4 h-4" />}
                  />
                  <InfoRow
                    label="Email"
                    value={coach?.email ?? ""}
                    icon={<Mail className="w-4 h-4" />}
                  />
                </div>

                {(coach?.social_media?.linkedin ||
                  coach?.social_media?.instagram ||
                  coach?.social_media?.website) && (
                  <div className="mt-5 pt-5 border-t border-[var(--border)]">
                    <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3">
                      Social Links
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {coach.social_media.linkedin &&
                        safeHref(coach.social_media.linkedin) && (
                          <a
                            href={safeHref(coach.social_media.linkedin)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            <Globe className="w-3.5 h-3.5" /> LinkedIn
                          </a>
                        )}
                      {coach.social_media.instagram &&
                        safeHref(coach.social_media.instagram) && (
                          <a
                            href={safeHref(coach.social_media.instagram)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            <Globe className="w-3.5 h-3.5" /> Instagram
                          </a>
                        )}
                      {coach.social_media.website &&
                        safeHref(coach.social_media.website) && (
                          <a
                            href={safeHref(coach.social_media.website)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          >
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
              <CardHeader
                icon={<Shield className="w-5 h-5 text-white" />}
                title="Account & Security"
              />
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
                  onChange={(v) => updateNotif.mutate({ login_alerts: v })}
                />
                <div className="flex items-center justify-between py-3.5 px-6 hover:bg-[var(--bg-subtle)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-[var(--text-tertiary)]">
                      {theme === "dark" ? (
                        <Moon className="w-5 h-5" />
                      ) : (
                        <Sun className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        Theme
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Switch between light and dark mode
                      </p>
                    </div>
                  </div>
                  <Toggle checked={theme === "dark"} onChange={toggleTheme} />
                </div>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 dark:border-red-900/30">
              <CardHeader
                icon={
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                }
                title="Danger Zone"
              />
              <div className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      Delete Account
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 max-w-md">
                      Permanently remove your account and all associated data.
                      This action cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* ── Right Column ── */}
          <div className="space-y-6">
            {/* Team Management */}
            <Card>
              <CardHeader
                icon={<Users className="w-5 h-5 text-white" />}
                title="Team"
                action={
                  <Link
                    href="/settings/team"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:text-emerald-600 transition-colors"
                  >
                    Manage
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                }
              />
              <div className="p-6">
                <p className="text-sm text-[var(--text-secondary)]">
                  Invite additional trainers, managers or front-desk staff to
                  your organization and control what each of them can access.
                </p>
              </div>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader
                icon={<Bell className="w-5 h-5 text-white" />}
                title="Notification Settings"
              />
              <div className="divide-y divide-[var(--border)]">
                <div className="px-6 py-3">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Notification Channels
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Email & in-app
                  </p>
                </div>
                <ToggleRow
                  label="Appointments"
                  description="New or updated check-ins"
                  checked={notifCheckins}
                  onChange={(v) => updateNotif.mutate({ appointments: v })}
                />
                <ToggleRow
                  label="New Clients"
                  description="When a new client signs up"
                  checked={notifNewClient}
                  onChange={(v) => updateNotif.mutate({ consultation: v })}
                />
                <ToggleRow
                  label="Messages"
                  description="New message notifications"
                  checked={notifMessages}
                  onChange={(v) => updateNotif.mutate({ email_sms: v })}
                />
                <ToggleRow
                  label="Login Alerts"
                  description="Notify on new/unfamiliar logins"
                  checked={loginAlerts}
                  onChange={(v) => updateNotif.mutate({ login_alerts: v })}
                />
                <ToggleRow
                  label="Do Not Disturb"
                  description="Mute notifications during set hours"
                  checked={doNotDisturb}
                  onChange={(v) => updateNotif.mutate({ dnd_enabled: v })}
                />
                {doNotDisturb && (
                  <div className="px-6 py-3 bg-[var(--bg-subtle)]">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />
                      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <span>From:</span>
                        <span className="font-medium text-[var(--text-primary)]">
                          {notifData?.dnd_from ?? "22:00"}
                        </span>
                        <span className="mx-1">—</span>
                        <span>To:</span>
                        <span className="font-medium text-[var(--text-primary)]">
                          {notifData?.dnd_to ?? "07:00"}
                        </span>
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
                    {manageBilling.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Pencil className="w-3.5 h-3.5" />
                    )}
                    {manageBilling.isPending ? "Opening…" : "Manage"}
                  </button>
                }
              />
              <div className="p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div
                    className={`w-12 h-12 flex items-center justify-center rounded-full ${
                      tier === "business"
                        ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                        : tier === "pro"
                          ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    <TierIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                      {tierLabel} Plan
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {tier === "pro"
                        ? "$29 / month"
                        : tier === "business"
                          ? "$79 / month"
                          : "Free forever"}
                    </p>
                  </div>
                </div>

                {isPastDue && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-400">
                      Payment failed. Update your payment method to continue
                      using premium features.
                    </p>
                  </div>
                )}

                {isTrialing && (
                  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Trial active until{" "}
                      {subscription?.trial_ends_at
                        ? new Date(
                            subscription.trial_ends_at,
                          ).toLocaleDateString()
                        : "soon"}
                      .
                    </p>
                  </div>
                )}

                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Status</span>
                    <span
                      className={`font-medium ${
                        subscription?.status === "active"
                          ? "text-[var(--accent)]"
                          : isPastDue
                            ? "text-red-600"
                            : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {subscription?.status === "active"
                        ? "Active"
                        : subscription?.status === "trialing"
                          ? "Trialing"
                          : isPastDue
                            ? "Past Due"
                            : "Free"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">
                      Clients
                    </span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {subscription?.client_count ?? 0}
                      {subscription?.client_limit !== null && (
                        <> / {subscription?.client_limit}</>
                      )}
                      {subscription?.client_limit === null && " (Unlimited)"}
                    </span>
                  </div>
                  {subscription?.next_payment_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">
                        {subscription?.status === "trialing"
                          ? "Trial Ends"
                          : "Renews"}
                      </span>
                      <span className="font-medium text-[var(--text-primary)]">
                        {new Date(
                          subscription.next_payment_date,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {subscription?.client_limit !== null && (
                  <div className="w-full h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden mb-5">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (subscription?.client_count ?? 0) /
                          (subscription?.client_limit ?? 1) >
                        0.8
                          ? "bg-red-500"
                          : "bg-[var(--accent)]"
                      }`}
                      style={{
                        width: `${Math.min(((subscription?.client_count ?? 0) / (subscription?.client_limit ?? 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => manageBilling.mutate()}
                    disabled={manageBilling.isPending}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--btn-bg)] text-white text-sm font-medium rounded-lg hover:bg-[var(--btn-hover)] transition-colors disabled:opacity-50"
                  >
                    {manageBilling.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    {manageBilling.isPending
                      ? "Opening Portal…"
                      : "Update Subscription Info"}
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

        {/* Modals */}
        <ChangePasswordModal
          open={showPwModal}
          onClose={() => setShowPwModal(false)}
        />
        <DeleteAccountModal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
        />
      </div>
    </DashboardLayout>
  );
}
