'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/api'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Phone, Globe, Link as LinkIcon, ChevronLeft,
  Camera, Check, X, Loader2, Save
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════════
   UI Primitives
   ═══════════════════════════════════════════════════════════════════════════ */

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
      <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 pr-10 text-sm border border-[var(--border)] rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
            disabled
              ? 'bg-[var(--bg-subtle)] text-[var(--text-tertiary)] cursor-not-allowed'
              : 'bg-[var(--bg-card)] text-[var(--text-primary)] focus:border-brand-500 hover:border-[var(--border-hover)]'
          }`}
        />
        {icon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">{icon}</div>}
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
      <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2.5 pr-10 text-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 appearance-none cursor-pointer hover:border-[var(--border-hover)] transition-colors"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronLeft className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] -rotate-90 pointer-events-none" />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════════════════ */

export default function EditProfilePage() {
  const { coach, updateCoach } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Profile state
  const [name, setName] = useState(coach?.name ?? '')
  const [surname, setSurname] = useState(coach?.surname ?? '')
  const [title, setTitle] = useState('')
  const [role, setRole] = useState('General Practitioner (GP)')
  const [phone, setPhone] = useState(coach?.phone ?? '')
  const [language, setLanguage] = useState<'en' | 'de'>(coach?.language as 'en' | 'de' ?? 'en')
  const [linkedin, setLinkedin] = useState(coach?.social_media?.linkedin ?? '')
  const [instagram, setInstagram] = useState(coach?.social_media?.instagram ?? '')
  const [website, setWebsite] = useState(coach?.social_media?.website ?? '')

  // UI state
  const [saving, setSaving] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [dirty, setDirty] = useState(false)
  const [imageErrored, setImageErrored] = useState(false)

  useEffect(() => setImageErrored(false), [coach?.profile_photo])

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message: msg })
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = setTimeout(() => { setToast(null); toastTimeoutRef.current = null }, 2500)
  }, [])

  useEffect(() => {
    return () => { if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current) }
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
      showToast('Settings saved successfully')
    } catch {
      showToast('Failed to save settings', 'error')
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

  const MAX_FILE_SIZE = 5 * 1024 * 1024

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      showToast('Only JPG, PNG, WEBP allowed', 'error')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast('File too large (max 5 MB)', 'error')
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
        if (!uploadResponse.ok) throw new Error('Failed to upload photo')
      }
      if (coach) updateCoach({ ...coach, profile_photo })
      showToast('Photo uploaded successfully')
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Upload failed'
      showToast(errorMsg, 'error')
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
      showToast('Failed to remove photo', 'error')
    } finally {
      setPhotoUploading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto pb-28">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-4 right-4 z-50 text-white text-sm px-4 py-2.5 flex items-center gap-2 rounded-lg shadow-lg ${
              toast.type === 'error' ? 'bg-red-600' : 'bg-[var(--btn-bg)]'
            }`}
          >
            {toast.type === 'error' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back link */}
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Settings
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">Edit Profile</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Update your personal information and preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Photo Card */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative h-24 w-24 flex-shrink-0">
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
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[var(--btn-bg)] text-white text-xl font-bold">
                        {coach.name?.[0]?.toUpperCase() ?? 'C'}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full w-full flex items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-tertiary)]">
                    <User className="w-10 h-10" />
                  </div>
                )}
                {photoUploading && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center rounded-full bg-black/50">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--btn-bg)] text-white hover:bg-[var(--btn-hover)] z-10 shadow-md transition-colors disabled:opacity-50"
                  aria-label="Change profile photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Profile Photo</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">JPG, PNG or WEBP. Max 5 MB.</p>
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoUploading}
                    className="text-sm font-medium text-[var(--accent)] hover:text-emerald-600 transition-colors disabled:opacity-50"
                  >
                    {coach?.profile_photo ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {coach?.profile_photo && (
                    <button
                      onClick={handlePhotoDelete}
                      disabled={photoUploading}
                      className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" />
              </div>
            </div>
          </div>
        </div>

        {/* Personal Info Card */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Personal Information</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField label="First Name" value={name} onChange={setName} placeholder="John" icon={<User className="w-4 h-4" />} />
              <InputField label="Last Name" value={surname} onChange={setSurname} placeholder="Doe" icon={<User className="w-4 h-4" />} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField label="Prefix Title" value={title} onChange={setTitle} placeholder="Dr." icon={<User className="w-4 h-4" />} />
              <InputField label="Role" value={role} onChange={setRole} placeholder="Coach" icon={<User className="w-4 h-4" />} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <SelectField
                label="Language"
                value={language}
                onChange={(v) => setLanguage(v as 'en' | 'de')}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'de', label: 'Deutsch' },
                ]}
              />
              <InputField label="Phone Number" value={phone} onChange={setPhone} placeholder="+1 234 567 890" type="tel" icon={<Phone className="w-4 h-4" />} />
            </div>
            <InputField label="Email Address" value={coach?.email ?? ''} onChange={() => {}} disabled icon={<Mail className="w-4 h-4" />} />
          </div>
        </div>

        {/* Social Links Card */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Social Links</h2>
          </div>
          <div className="p-6 space-y-5">
            <InputField label="LinkedIn" value={linkedin} onChange={setLinkedin} placeholder="linkedin.com/in/yourname" icon={<Globe className="w-4 h-4" />} />
            <InputField label="Instagram" value={instagram} onChange={setInstagram} placeholder="instagram.com/yourname" icon={<Globe className="w-4 h-4" />} />
            <InputField label="Website" value={website} onChange={setWebsite} placeholder="yourwebsite.com" icon={<LinkIcon className="w-4 h-4" />} />
          </div>
        </div>
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-30 bg-[var(--bg-card)]/90 backdrop-blur-md border-t border-[var(--border)] px-6 py-4">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm">
            {dirty ? (
              <span className="text-amber-600 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Unsaved changes
              </span>
            ) : (
              <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[var(--accent)]" />
                All changes saved
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              disabled={!dirty || saving}
              className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className="px-4 py-2 bg-[var(--btn-bg)] text-white text-sm font-medium hover:bg-[var(--btn-hover)] transition-colors disabled:opacity-50 flex items-center gap-2 rounded-lg"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
