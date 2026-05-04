'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { useAuthStore } from '@/store/auth'
import { useState, useRef, useCallback, useEffect } from 'react'
import api from '@/lib/api'
import { useThemeStore } from '@/store/theme'
import Image from 'next/image'
import {
  User, Mail, Phone, Globe, Link as LinkIcon, Lock, Bell, Shield,
  CreditCard, ChevronRight, Loader2, Camera, Check,
  Moon, Sun, LogOut, Key, MessageSquare, Calendar, UserCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ─────────────────────────────────────────────────────────────────────────────
// Reusable UI Components
// ─────────────────────────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[var(--bg-card)]  overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

function CardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 bg-[var(--bg-subtle)] ">
      <div className="w-9 h-9 bg-blue-600 flex items-center justify-center">
        {icon}
      </div>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  type = 'text',
  icon,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  type?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 pr-10 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
            disabled
              ? 'bg-[var(--bg-subtle)]  text-slate-400 cursor-not-allowed'
              : 'bg-[var(--bg-subtle)]  text-slate-900 dark:text-white focus:border-blue-500'
          }`}
        />
        {icon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
      </div>
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2.5 pr-10 text-sm bg-[var(--bg-subtle)] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronRight className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
      </div>
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-4 w-4 transform bg-white transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
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
    <div className="flex items-center justify-between py-3 px-4 hover:bg-slate-50 dark:hover:bg-[#1E293B] transition-colors">
      <div className="flex items-center gap-3 flex-1">
        {icon && <div className="text-slate-400">{icon}</div>}
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
          {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
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
  onClick: () => void
  actionText?: string
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-3 px-4 hover:bg-slate-50 dark:hover:bg-[#1E293B] transition-colors text-left"
    >
      <div className="flex items-center gap-3 flex-1">
        {icon && <div className="text-slate-400">{icon}</div>}
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
          {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {actionText && <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{actionText}</span>}
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { coach, updateCoach, logout } = useAuthStore()
  const { theme, toggle: toggleTheme } = useThemeStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile state
  const [name, setName] = useState(coach?.name ?? '')
  const [surname, setSurname] = useState(coach?.surname ?? '')
  const [phone, setPhone] = useState(coach?.phone ?? '')
  const [language, setLanguage] = useState<'en' | 'de'>(coach?.language as 'en' | 'de' ?? 'en')
  const [linkedin, setLinkedin] = useState(coach?.social_media?.linkedin ?? '')
  const [instagram, setInstagram] = useState(coach?.social_media?.instagram ?? '')
  const [website, setWebsite] = useState(coach?.social_media?.website ?? '')

  // Notification toggles
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifNewClient, setNotifNewClient] = useState(true)
  const [notifMessages, setNotifMessages] = useState(true)
  const [notifCheckins, setNotifCheckins] = useState(true)
  const [loginAlerts, setLoginAlerts] = useState(true)

  // UI state
  const [saving, setSaving] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [showPwModal, setShowPwModal] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMessage, setPwMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  // Check for changes
  useEffect(() => {
    if (!coach) return
    const changed =
      name !== (coach.name ?? '') ||
      surname !== (coach.surname ?? '') ||
      phone !== (coach.phone ?? '') ||
      language !== (coach.language ?? 'en') ||
      linkedin !== (coach.social_media?.linkedin ?? '') ||
      instagram !== (coach.social_media?.instagram ?? '') ||
      website !== (coach.social_media?.website ?? '')
    setDirty(changed)
  }, [name, surname, phone, language, linkedin, instagram, website, coach])

  // Save handler
  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        name, surname, phone, language,
        social_media: { linkedin, instagram, website },
      }
      const { data: res } = await api.put('/coach/profile', payload)
      if (res.success && res.data) updateCoach(res.data)
      setDirty(false)
      showToast('Settings saved')
    } catch {
      showToast('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (!coach) return
    setName(coach.name ?? '')
    setSurname(coach.surname ?? '')
    setPhone(coach.phone ?? '')
    setLanguage(coach.language ?? 'en')
    setLinkedin(coach.social_media?.linkedin ?? '')
    setInstagram(coach.social_media?.instagram ?? '')
    setWebsite(coach.social_media?.website ?? '')
    setDirty(false)
  }

  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

  // Photo handlers
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      showToast('Only JPG, PNG, WEBP allowed')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast('File too large (max 5 MB)')
      return
    }
    setPhotoUploading(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const { data: res } = await api.post(`/coach/profile/photo?ext=${ext}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const { upload_url, profile_photo } = res.data
      if (upload_url) {
        const uploadResponse = await fetch(upload_url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload photo')
        }
      }
      if (coach) updateCoach({ ...coach, profile_photo })
      showToast('Photo uploaded successfully')
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Upload failed'
      showToast(errorMsg)
    } finally {
      setPhotoUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handlePhotoDelete = async () => {
    setPhotoUploading(true)
    try {
      await api.delete('/coach/profile/photo')
      if (coach) updateCoach({ ...coach, profile_photo: undefined })
      showToast('Photo removed')
    } catch {
      showToast('Failed to remove')
    } finally {
      setPhotoUploading(false)
    }
  }

  // Password change
  const handleChangePassword = async () => {
    if (pwNew.length < 8) {
      setPwMessage({ type: 'err', text: 'At least 8 characters' })
      return
    }
    if (pwNew !== pwConfirm) {
      setPwMessage({ type: 'err', text: 'Passwords do not match' })
      return
    }
    setPwSaving(true)
    setPwMessage(null)
    try {
      await api.put('/coach/profile/password', {
        current_password: pwCurrent,
        new_password: pwNew,
      })
      setPwMessage({ type: 'ok', text: 'Password changed' })
      setTimeout(() => {
        setShowPwModal(false)
        setPwCurrent('')
        setPwNew('')
        setPwConfirm('')
      }, 1200)
    } catch (err: any) {
      setPwMessage({ type: 'err', text: err?.response?.data?.message ?? 'Failed' })
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <DashboardLayout>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 20, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 20, y: -10 }}
            className="fixed top-4 right-4 z-50 bg-blue-600 text-white text-sm px-4 py-2.5 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with dynamic page title and weather */}
      

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-24">
        {/* Left Column - Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <Card>
            <div className="p-6 space-y-6 ">
              {/* Photo Section */}
              <div className="flex items-center gap-4 rounded-10 p-4 bg-[var(--bg-subtle)]">
                <div className="relative h-20 w-20 overflow-hidden rounded-10">
                  {coach?.profile_photo ? (
                    <>
                      <Image
                        src={coach.profile_photo}
                        alt={coach.name ?? 'Coach'}
                        fill
                        className="rounded-10 object-cover ring-2 ring-slate-200 dark:ring-white/[0.1]"
                        sizes="80px"
                        unoptimized
                        onError={(e) => {
                          // Fall back to initials on image load failure
                          const target = e.currentTarget as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            const fallback = document.createElement('div')
                            fallback.className = 'absolute inset-0 flex items-center justify-center rounded-10 bg-brand-600 text-white text-lg font-bold'
                            fallback.textContent = coach.name?.[0]?.toUpperCase() ?? 'C'
                            parent.appendChild(fallback)
                          }
                        }}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-10 bg-[var(--btn-bg)] text-white hover:bg-[var(--btn-hover)] z-10"
                        aria-label="Change profile photo"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-full w-full items-center justify-center rounded-10 border-2 border-dashed border-slate-300 text-slate-400 transition-colors hover:border-[var(--btn-bg)] hover:text-[var(--btn-bg)] dark:border-slate-600"
                      aria-label="Upload profile photo"
                    >
                      <Camera className="w-8 h-8" />
                    </button>
                  )}
                  {photoUploading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-10 bg-black/50">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Profile Photo</h3>
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => fileInputRef.current?.click()} disabled={photoUploading} className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50">
                      {coach?.profile_photo ? 'Change' : 'Upload'}
                    </button>
                    {coach?.profile_photo && (
                      <button onClick={handlePhotoDelete} disabled={photoUploading} className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" />
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="First Name" value={name} onChange={setName} placeholder="John" icon={<User className="w-4 h-4" />} />
                <InputField label="Last Name" value={surname} onChange={setSurname} placeholder="Doe" icon={<User className="w-4 h-4" />} />
              </div>

              {/* Language & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField
                  label="Language"
                  value={language}
                  onChange={(v) => setLanguage(v as 'en' | 'de')}
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'de', label: 'Deutsch' },
                  ]}
                />
                <InputField label="Phone" value={phone} onChange={setPhone} placeholder="+1 234 567 890" type="tel" icon={<Phone className="w-4 h-4" />} />
              </div>

              {/* Email (Read-only) */}
              <InputField label="Email Address" value={coach?.email ?? ''} onChange={() => {}} disabled icon={<Mail className="w-4 h-4" />} />

              {/* Social Links */}
              <div className="pt-2">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
                  <LinkIcon className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Social Links</span>
                </div>
                <div className="space-y-4">
                  <InputField label="LinkedIn" value={linkedin} onChange={setLinkedin} placeholder="linkedin.com/in/yourname" icon={<Globe className="w-4 h-4" />} />
                  <InputField label="Instagram" value={instagram} onChange={setInstagram} placeholder="instagram.com/yourname" icon={<Globe className="w-4 h-4" />} />
                  <InputField label="Website" value={website} onChange={setWebsite} placeholder="yourwebsite.com" icon={<Globe className="w-4 h-4" />} />
                </div>
              </div>
            </div>
          </Card>

          {/* Account & Security Card */}
          <Card>
            <CardHeader icon={<Shield className="w-5 h-5 text-white" />} title="Account & Security" />
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              <ActionRow
                icon={<Lock className="w-5 h-5" />}
                label="Password"
                description="Change your password"
                actionText="Change"
                onClick={() => setShowPwModal(true)}
              />
              <ToggleRow
                icon={<Key className="w-5 h-5" />}
                label="Login Alerts"
                description="Get notified about new logins"
                checked={loginAlerts}
                onChange={setLoginAlerts}
              />
              <div className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 text-slate-400">
                    {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Theme</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Switch between light and dark mode</p>
                  </div>
                </div>
                <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
              </div>
              <ActionRow
                icon={<CreditCard className="w-5 h-5" />}
                label="Manage Subscription"
                description="View plans and billing details"
                actionText="Open"
                onClick={() => (window.location.href = '/billing')}
              />
            </div>
          </Card>
        </div>

        {/* Right Column - Notifications */}
        <div className="space-y-6">
          <Card>
            <CardHeader icon={<Bell className="w-5 h-5 text-white" />} title="Notifications" />
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              <ToggleRow
                icon={<Mail className="w-5 h-5" />}
                label="Email Notifications"
                description="Receive updates via email"
                checked={notifEmail}
                onChange={setNotifEmail}
              />
              <ToggleRow
                icon={<UserCheck className="w-5 h-5" />}
                label="New Client"
                description="When a new client signs up"
                checked={notifNewClient}
                onChange={setNotifNewClient}
              />
              <ToggleRow
                icon={<MessageSquare className="w-5 h-5" />}
                label="Messages"
                description="New message notifications"
                checked={notifMessages}
                onChange={setNotifMessages}
              />
              <ToggleRow
                icon={<Calendar className="w-5 h-5" />}
                label="Schedule Reminders"
                description="Check-in reminders"
                checked={notifCheckins}
                onChange={setNotifCheckins}
              />
            </div>
          </Card>

          {/* Danger Zone */}
          <Card>
            <CardHeader icon={<LogOut className="w-5 h-5 text-white" />} title="Session" />
            <div className="p-4">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 py-3 px-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-medium">Sign Out</p>
                  <p className="text-xs text-red-500 dark:text-red-400">End your current session</p>
                </div>
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-30 bg-white/90 dark:bg-surface-card-dark/90 backdrop-blur-md border-t border-slate-200 dark:border-white/[0.08] px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm">
            {dirty ? (
              <span className="text-amber-600 font-medium">Unsaved changes</span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">All changes saved</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              disabled={!dirty || saving}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#1E293B] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
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
              onClick={() => {
                setShowPwModal(false)
                setPwMessage(null)
                setPwCurrent('')
                setPwNew('')
                setPwConfirm('')
              }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-[var(--bg-card)] border border-slate-200 dark:border-slate-700 w-full max-w-md p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-blue-600 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Change Password</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Update your password securely</p>
                </div>
              </div>

              <div className="space-y-4">
                <InputField label="Current Password" value={pwCurrent} onChange={setPwCurrent} type="password" placeholder="Enter current password" />
                <InputField label="New Password" value={pwNew} onChange={setPwNew} type="password" placeholder="At least 8 characters" />
                <InputField label="Confirm Password" value={pwConfirm} onChange={setPwConfirm} type="password" placeholder="Re-enter new password" />

                {pwMessage && (
                  <div className={`p-3 text-sm ${pwMessage.type === 'ok' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'}`}>
                    {pwMessage.text}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => {
                      setShowPwModal(false)
                      setPwMessage(null)
                      setPwCurrent('')
                      setPwNew('')
                      setPwConfirm('')
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#1E293B] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={pwSaving}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {pwSaving ? 'Saving...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
