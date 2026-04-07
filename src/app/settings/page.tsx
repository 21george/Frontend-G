'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/store/auth'
import { useState, useRef, useCallback, useEffect } from 'react'
import api from '@/lib/api'
import { useThemeStore } from '@/store/theme'
import {
  Camera, Trash2, Upload, ChevronDown, Lock, Loader2,
  Sun, Moon, Sparkles,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════
   Toggle switch
   ═══════════════════════════════════════════════════════════ */
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-700/30 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-cyan-950' : 'bg-slate-300 dark:bg-white/[0.12]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════
   Main page
   ═══════════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const { coach, updateCoach } = useAuthStore()
  const { theme, toggle: toggleTheme } = useThemeStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── form state ── */
  const [name, setName]           = useState(coach?.name ?? '')
  const [surname, setSurname]     = useState(coach?.surname ?? '')
  const [phone, setPhone]         = useState(coach?.phone ?? '')
  const [language, setLanguage]   = useState(coach?.language ?? 'en')
  const [linkedin, setLinkedin]   = useState(coach?.social_media?.linkedin ?? '')
  const [instagram, setInstagram] = useState(coach?.social_media?.instagram ?? '')
  const [website, setWebsite]     = useState(coach?.social_media?.website ?? '')

  /* ── notification toggles ── */
  const [notifEmail, setNotifEmail]         = useState(true)
  const [notifNewClient, setNotifNewClient] = useState(true)
  const [notifMessages, setNotifMessages]   = useState(true)
  const [notifCheckins, setNotifCheckins]   = useState(true)
  const [loginAlerts, setLoginAlerts]       = useState(true)
  const [dnd, setDnd]                       = useState(false)
  const [dndFrom, setDndFrom]               = useState('22:00')
  const [dndTo, setDndTo]                   = useState('07:00')

  /* ── password modal ── */
  const [showPwModal, setShowPwModal]           = useState(false)
  const [currentPassword, setCurrentPassword]   = useState('')
  const [newPassword, setNewPassword]           = useState('')
  const [confirmPassword, setConfirmPassword]   = useState('')
  const [pwSaving, setPwSaving]                 = useState(false)
  const [pwMessage, setPwMessage]               = useState<{ t: 'ok' | 'err'; m: string } | null>(null)

  /* ── saving / photo ── */
  const [saving, setSaving]             = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [toast, setToast]               = useState<string | null>(null)
  const [dirty, setDirty]               = useState(false)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  /* ── Fetch fresh profile from server ── */
  const refreshProfile = useCallback(async () => {
    try {
      const { data: res } = await api.get('/coach/profile')
      if (res.success && res.data) {
        updateCoach(res.data)
      }
    } catch { /* silent */ }
  }, [updateCoach])

  /* track changes */
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

  /* Fetch fresh profile on mount */
  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  /* Sync form fields when coach object changes (e.g. after save or photo upload) */
  useEffect(() => {
    if (!coach) return
    setName(coach.name ?? '')
    setSurname(coach.surname ?? '')
    setPhone(coach.phone ?? '')
    setLanguage(coach.language ?? 'en')
    setLinkedin(coach.social_media?.linkedin ?? '')
    setInstagram(coach.social_media?.instagram ?? '')
    setWebsite(coach.social_media?.website ?? '')
  }, [coach?.id]) // only re-sync when the coach identity changes

  /* ── Save all profile changes ── */
  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        name, surname, phone, language,
        social_media: { linkedin, instagram, website },
      }
      const { data: res } = await api.put('/coach/profile', payload)
      // Use server-returned coach data to keep store accurate
      if (res.success && res.data) {
        updateCoach(res.data)
      }
      setDirty(false)
      showToast('Settings saved!')
    } catch {
      showToast('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setName(coach?.name ?? '')
    setSurname(coach?.surname ?? '')
    setPhone(coach?.phone ?? '')
    setLanguage(coach?.language ?? 'en')
    setLinkedin(coach?.social_media?.linkedin ?? '')
    setInstagram(coach?.social_media?.instagram ?? '')
    setWebsite(coach?.social_media?.website ?? '')
    setDirty(false)
  }

  /* ── Photo ── */
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) { showToast('Only jpg, png, webp allowed'); return }
    setPhotoUploading(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)

      const { data: res } = await api.post(`/coach/profile/photo?ext=${ext}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const { upload_url, profile_photo } = res.data

      // If S3 mode, upload the file to S3 via presigned URL
      if (upload_url) {
        const uploadRes = await fetch(upload_url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })
        if (!uploadRes.ok) throw new Error('S3 upload failed')
      }

      // Update local store with the photo URL
      if (coach) updateCoach({ ...coach, profile_photo })
      showToast('Photo updated!')
    } catch {
      showToast('Upload failed')
    } finally {
      setPhotoUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handlePhotoDelete = async () => {
    setPhotoUploading(true)
    try {
      await api.delete('/coach/profile/photo')
      if (coach) updateCoach({ ...coach, profile_photo: undefined })
      showToast('Photo removed')
    } catch {
      showToast('Failed to remove photo')
    } finally {
      setPhotoUploading(false)
    }
  }

  /* ── Change password ── */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) { setPwMessage({ t: 'err', m: 'At least 8 characters' }); return }
    if (newPassword !== confirmPassword) { setPwMessage({ t: 'err', m: 'Passwords do not match' }); return }
    setPwSaving(true); setPwMessage(null)
    try {
      await api.put('/coach/profile/password', { current_password: currentPassword, new_password: newPassword })
      setPwMessage({ t: 'ok', m: 'Password changed!' })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setTimeout(() => setShowPwModal(false), 1200)
    } catch (err: any) {
      setPwMessage({ t: 'err', m: err?.response?.data?.message ?? 'Failed' })
    } finally { setPwSaving(false) }
  }

  return (
    <DashboardLayout>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Personalize your account and manage preferences securely.</p>
      </div>

      {/* ═══ Two-column grid ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 pb-24">

        {/* ────── LEFT COLUMN ────── */}
        <div className="lg:col-span-3 space-y-5">

          {/* ── Profile Settings card ── */}
          <div className="card">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-6">Profile Settings</h2>

            {/* Photo */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-3">
                {coach?.profile_photo ? (
                  <>
                    <img
                      src={coach.profile_photo}
                      alt={coach.name}
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-slate-100 dark:ring-white/[0.06]"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md hover:bg-cyan-950 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 dark:border-white/[0.12] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:border-blue-400 dark:hover:border-blue-500/40 hover:text-blue-500 transition-colors"
                  >
                    <Camera className="w-7 h-7" />
                  </button>
                )}
                {photoUploading && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={coach?.profile_photo ? handlePhotoDelete : () => fileInputRef.current?.click()}
                disabled={photoUploading}
                className={`text-sm font-medium transition-colors disabled:opacity-50 ${
                  coach?.profile_photo
                    ? 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300'
                    : 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300'
                }`}
              >
                {coach?.profile_photo ? 'Remove photo' : 'Upload photo'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" />
            </div>

            {/* Fields */}
            <div className="space-y-4">
              {/* First / Last name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="First name" />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input value={surname} onChange={e => setSurname(e.target.value)} className="input" placeholder="Last name" />
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="label">Language</label>
                <div className="relative">
                  <select value={language} onChange={e => setLanguage(e.target.value as 'en' | 'de')} className="input appearance-none pr-9">
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="label">Phone Number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="+1 234 567 890" />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="label">Email</label>
                <input value={coach?.email ?? ''} disabled className="input bg-slate-50 dark:bg-white/[0.03] text-slate-400 cursor-not-allowed" />
              </div>

              {/* Social media */}
              <div>
                <label className="label">LinkedIn</label>
                <input value={linkedin} onChange={e => setLinkedin(e.target.value)} className="input" placeholder="linkedin.com/in/yourname" />
              </div>
              <div>
                <label className="label">Instagram</label>
                <input value={instagram} onChange={e => setInstagram(e.target.value)} className="input" placeholder="instagram.com/yourname" />
              </div>
              <div>
                <label className="label">Website</label>
                <input value={website} onChange={e => setWebsite(e.target.value)} className="input" placeholder="yourwebsite.com" />
              </div>
            </div>
          </div>

          {/* ── Account & Security card ── */}
          <div className="card">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-5">Account & Security</h2>

            {/* Password */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center">
                  <Lock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</span>
              </div>
              <button onClick={() => { setShowPwModal(true); setPwMessage(null); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }} className="btn-secondary text-xs !py-1.5 !px-3 gap-1.5">
                <Lock className="w-3 h-3" /> Change Password
              </button>
            </div>

            {/* Login Alerts */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Login Alerts</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Notify on new/unfamiliar logins</p>
              </div>
              <Toggle checked={loginAlerts} onChange={setLoginAlerts} />
            </div>

            {/* Theme */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center">
                  {theme === 'dark' ? <Moon className="w-4 h-4 text-slate-500 dark:text-slate-400" /> : <Sun className="w-4 h-4 text-slate-500" />}
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Theme</span>
              </div>
              <div className="relative">
                <select
                  value={theme}
                  onChange={() => toggleTheme()}
                  className="appearance-none bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 pr-8 text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:border-slate-300 dark:hover:border-white/20 transition-colors"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* ────── RIGHT COLUMN ────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* ── Notification Settings card ── */}
          <div className="card">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-5">Notification Settings</h2>

            {/* Notification Channels */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Notifications</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Receive updates via email</p>
              </div>
              <Toggle checked={notifEmail} onChange={setNotifEmail} />
            </div>

            {/* New Client */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/[0.06]">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">New Client</p>
              <Toggle checked={notifNewClient} onChange={setNotifNewClient} />
            </div>

            {/* Messages */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/[0.06]">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Messages</p>
              <Toggle checked={notifMessages} onChange={setNotifMessages} />
            </div>

            {/* Schedule reminders */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/[0.06]">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Schedule Reminders</p>
              <Toggle checked={notifCheckins} onChange={setNotifCheckins} />
            </div>

            {/* Do Not Disturb */}
            <div className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Do Not Disturb</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Mute notifications during set hours</p>
                </div>
                <Toggle checked={dnd} onChange={setDnd} />
              </div>
              {dnd && (
                <div className="flex items-center gap-3 mt-3 pl-1">
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block mb-1">From:</span>
                    <input type="time" value={dndFrom} onChange={e => setDndFrom(e.target.value)} className="input !py-1.5 !px-2.5 text-sm w-28" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block mb-1">To:</span>
                    <input type="time" value={dndTo} onChange={e => setDndTo(e.target.value)} className="input !py-1.5 !px-2.5 text-sm w-28" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Sticky bottom action bar ═══ */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-30 bg-white/90 dark:bg-[#171717]/90 backdrop-blur-md border-t border-slate-200 dark:border-white/[0.07] px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {dirty ? 'You have unsaved changes — review before submitting.' : 'Confirm to apply the new settings'}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleCancel} disabled={!dirty || saving} className="btn-secondary text-sm disabled:opacity-40">
              Cancel
            </button>
            <button onClick={handleSave} disabled={!dirty || saving} className="btn-primary text-sm disabled:opacity-50">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Change password modal ═══ */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPwModal(false)} />
          <div className="relative bg-white dark:bg-[#161b26] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/[0.08] w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-5">Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="label">Current password</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="input" required autoFocus />
              </div>
              <div>
                <label className="label">New password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input" required minLength={8} />
              </div>
              <div>
                <label className="label">Confirm new password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input" required />
              </div>
              {pwMessage && (
                <p className={`text-sm ${pwMessage.t === 'ok' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {pwMessage.m}
                </p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowPwModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={pwSaving} className="btn-primary text-sm">
                  {pwSaving ? 'Saving…' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
