"use client"

import {
  RefreshCw, Check, X, Tag, FileText, User, Phone, BarChart2, Copy, Video, ImageIcon,
  ExternalLink, Loader2, Trash2, Pencil,
} from "lucide-react"
import { motion } from "framer-motion"
import type { Client, MediaUpload, NutritionPlan, AnalyticsData, CheckinMeeting, PaginatedResponse, WorkoutPlan } from "@/types"
import { formatDate } from "@/lib/utils"

interface Props {
  client: Client
  sidebarOpen: boolean
  onClose: () => void
  newCode: string | null
  copied: boolean
  onCopied: () => void
  media: MediaUpload[] | undefined
  plans: PaginatedResponse<WorkoutPlan> | undefined
  nutrition: NutritionPlan[] | undefined
  analytics: AnalyticsData | undefined
  checkins: CheckinMeeting[] | undefined
  completedCheckins: number
  onRegenerate: () => void
  isRegenerateLoading: boolean
  onToggleBlock: () => void
  isBlockPending: boolean
  isUnblockPending: boolean
  onDeleteClient: () => void
  isDeletePending: boolean
  onEditClient?: () => void
}

function calculateAge(dob?: string): number | null {
  if (!dob) return null
  const d = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age >= 0 ? age : null
}

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      <Icon size={12} className="text-[var(--text-secondary)]" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">{label}</span>
    </div>
  )
}

function InfoRow({ label, value, valueClassName }: { label: string; value: React.ReactNode; valueClassName?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-4">
      <span className="text-[11px] sm:text-[12px] text-[var(--text-tertiary)] sm:text-[var(--text-secondary)] flex-shrink-0">{label}</span>
      <span className={`text-[12px] text-[var(--text-secondary)] dark:text-slate-300 sm:text-right break-words ${valueClassName ?? ""}`}>{value}</span>
    </div>
  )
}

/* ── Animated status ring for active clients ── */
function StatusRing({ active, blocked }: { active: boolean; blocked: boolean }) {
  if (blocked || !active) return null
  return (
    <motion.div
      className="absolute inset-0 rounded-full"
      animate={{
        boxShadow: [
          "0 0 0 0px rgba(163,230,53,0)",
          "0 0 0 3px rgba(163,230,53,0.2)",
          "0 0 0 0px rgba(163,230,53,0)",
        ],
      }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    />
  )
}

export function ClientDetailSidebar({
  client, sidebarOpen, onClose,
  newCode, copied, onCopied,
  media, plans, nutrition, analytics, checkins, completedCheckins,
  onRegenerate, isRegenerateLoading,
  onToggleBlock, isBlockPending, isUnblockPending,
  onDeleteClient, isDeletePending,
  onEditClient,
}: Props) {
  const computedIsBlocked = client.is_blocked ?? !client.active

  const statusColor = client.is_blocked
    ? { text: "text-red-400", bg: "bg-red-400", border: "border-red-500/25", bgSoft: "bg-red-500/5" }
    : client.active
      ? { text: "text-emerald-400", bg: "bg-emerald-400", border: "border-emerald-500/25", bgSoft: "bg-emerald-500/5" }
      : { text: "text-amber-400", bg: "bg-amber-400", border: "border-amber-500/25", bgSoft: "bg-amber-500/5" }

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-40 w-[85vw] max-w-[320px] sm:w-[300px] transform transition-transform duration-200 ease-out
      md:relative md:inset-auto md:z-auto md:translate-x-0 md:w-[300px] md:top-auto md:bottom-auto
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      flex-shrink-0 border-r border-[var(--border)] overflow-y-auto
      bg-[var(--bg-card)] dark:bg-[#0a1114]
    `}>

      {/* Ambient glow behind profile (dark only) */}
      <div
        aria-hidden
        className="absolute top-8 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full pointer-events-none opacity-0 dark:opacity-15 blur-[60px]"
        style={{ background: "radial-gradient(circle, #a3e635 0%, transparent 70%)" }}
      />

      {/* Mobile close button */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Client Info</span>
        <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
          <X size={16} />
        </button>
      </div>

      {/* Mobile action buttons */}
      <div className="md:hidden flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)]">
        <button onClick={onToggleBlock} disabled={isBlockPending || isUnblockPending}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 border rounded-lg px-2 py-2 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
            computedIsBlocked
              ? "border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300"
              : "border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300"
          }`}>
          {(isBlockPending || isUnblockPending) ? <Loader2 size={11} className="animate-spin" /> : computedIsBlocked ? <Check size={11} /> : <X size={11} />}
          {client.is_blocked ? "Unblock" : !client.active ? "Restore" : "Block"}
        </button>
        <button onClick={onDeleteClient} disabled={isDeletePending}
          className="flex-1 inline-flex items-center justify-center gap-1.5 border border-red-200 dark:border-red-900/40 rounded-lg px-2 py-2 text-[11px] font-semibold text-red-600 dark:text-red-300 transition-colors disabled:opacity-50">
          {isDeletePending ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
          Delete
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-5 relative z-10">

        {/* Profile card */}
        <div className="flex items-start gap-3">
          <div className="relative w-14 h-14 sm:w-[72px] sm:h-[72px] bg-[var(--bg-subtle)] rounded-full border border-[var(--border)] dark:border-white/[0.08] flex items-center justify-center overflow-hidden flex-shrink-0">
            <StatusRing active={client.active} blocked={client.is_blocked ?? false} />
            {client.profile_photo_url
              ? <img src={client.profile_photo_url} alt={client.name} className="w-full h-full object-cover relative z-10" />
              : <span className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] relative z-10">{client.name[0].toUpperCase()}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <motion.h2
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-sm sm:text-[15px] font-bold text-[var(--text-primary)] leading-snug truncate"
              >
                {client.name}
              </motion.h2>
              {onEditClient && (
                <motion.button
                  onClick={onEditClient}
                  title="Edit client"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
                >
                  <Pencil size={12} />
                </motion.button>
              )}
            </div>
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium mt-0.5 mb-2 ${statusColor.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusColor.bg}`} />
              {client.is_blocked ? "Blocked" : client.active ? "Active" : "Inactive"}
            </span>
            <div className="flex gap-1.5 flex-wrap">
              <motion.button
                onClick={onRegenerate}
                title="Reset login code"
                whileTap={{ scale: 0.92 }}
                className="inline-flex items-center gap-1 rounded-full text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] bg-[var(--bg-subtle)] dark:bg-white/[0.03] border border-[var(--border)] dark:border-white/[0.06] px-2 py-1.5 transition-colors"
              >
                <RefreshCw size={10} className={isRegenerateLoading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Code</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* New login code */}
        {newCode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/20 rounded-lg"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-1">New Login Code</p>
            <p className="text-2xl font-bold font-mono tracking-widest text-[var(--text-primary)] mb-2.5">{newCode}</p>
            <motion.button
              onClick={onCopied}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-blue-600 dark:bg-[#a3e635] dark:text-[#0a1114] hover:bg-blue-700 dark:hover:bg-[#bef264] px-3 py-1.5 rounded-md transition-colors"
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? "Copied!" : "Copy Code"}
            </motion.button>
          </motion.div>
        )}

        <hr className="border-[var(--border)] dark:border-white/[0.05]" />

        {/* Specializations */}
        <section>
          <SectionHeader icon={Tag} label="Specializations" />
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2.5 py-1 border border-[var(--border)] dark:border-white/[0.08] text-[11px] text-[var(--text-secondary)] bg-[var(--bg-subtle)] dark:bg-white/[0.03] rounded-sm">
              {client.language === "en" ? "English" : "German"}
            </span>
            <span className={`px-2.5 py-1 border text-[11px] font-medium rounded-sm ${statusColor.border} ${statusColor.text} ${statusColor.bgSoft}`}>
              {client.is_blocked ? "Blocked" : client.active ? "Active Client" : "Inactive"}
            </span>
            {(plans?.data?.length ?? 0) > 0 && (
              <span className="px-2.5 py-1 border border-[var(--border)] dark:border-white/[0.08] text-[11px] text-[var(--text-secondary)] bg-[var(--bg-subtle)] dark:bg-white/[0.03] rounded-sm">
                Has Workout Plans
              </span>
            )}
            {(nutrition?.length ?? 0) > 0 && (
              <span className="px-2.5 py-1 border border-[var(--border)] dark:border-white/[0.08] text-[11px] text-[var(--text-secondary)] bg-[var(--bg-subtle)] dark:bg-white/[0.03] rounded-sm">
                On Nutrition Plan
              </span>
            )}
          </div>
        </section>

        <hr className="border-[var(--border)] dark:border-white/[0.05]" />

        {/* Files & Media */}
        <section>
          <SectionHeader icon={FileText} label="Files & Media" />
          <div className="space-y-1.5">
            {(media ?? []).slice(0, 5).map(m => (
              <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2 bg-[var(--bg-subtle)] dark:bg-white/[0.02] border border-[var(--border)] dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.14] hover:bg-[var(--bg-hover)] dark:hover:bg-white/[0.04] transition-all group rounded-md">
                <div className="w-6 h-6 bg-[var(--bg-card)] dark:bg-white/[0.05] border border-[var(--border)] dark:border-white/[0.08] flex items-center justify-center flex-shrink-0 rounded">
                  {m.type === "video" ? <Video size={11} className="text-blue-400" /> : <ImageIcon size={11} className="text-[var(--text-tertiary)]" />}
                </div>
                <span className="text-[11px] text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors truncate flex-1">
                  {m.type === "video" ? "Video file" : "Photo"}
                </span>
                <ExternalLink size={10} className="text-[var(--text-secondary)] group-hover:text-[var(--text-tertiary)] flex-shrink-0" />
              </a>
            ))}
            {(media ?? []).length === 0 && (
              <p className="text-[11px] text-[var(--text-secondary)] italic">No files uploaded yet</p>
            )}
          </div>
        </section>

        <hr className="border-[var(--border)] dark:border-white/[0.05]" />

        {/* General */}
        <section>
          <SectionHeader icon={User} label="General" />
          <div className="space-y-2.5">
            <InfoRow label="Language" value={client.language === "en" ? "English" : "German"} />
            <InfoRow label="Member since" value={formatDate(client.created_at, "dd MMM, yyyy")} />
            <InfoRow label="Completion" value={
              <span className="text-[var(--energy)] font-bold">
                {Array.isArray(analytics?.completion_rate)
                  ? (analytics!.completion_rate.slice(-1)[0]?.rate ?? 0)
                  : (analytics?.completion_rate ?? 0)}%
              </span>
            } />
          </div>
        </section>

        <hr className="border-[var(--border)] dark:border-white/[0.05]" />

        {/* Stats cards */}
        <section>
          <SectionHeader icon={BarChart2} label="Activity" />
          <div className="grid grid-cols-2 gap-2.5">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="border border-[var(--border)] dark:border-white/[0.06] bg-[var(--bg-subtle)] dark:bg-white/[0.02] p-3 rounded-md"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-[3px] h-5 bg-[#f97316] rounded-full" />
                <span className="text-[11px] text-[var(--text-tertiary)]">Check-ins</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-[var(--text-primary)] leading-none">
                {completedCheckins}<span className="text-[var(--text-secondary)] font-normal text-[11px] sm:text-[12px]"> / {checkins?.length ?? 0}</span>
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="border border-[var(--border)] dark:border-white/[0.06] bg-[var(--bg-subtle)] dark:bg-white/[0.02] p-3 rounded-md"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-[3px] h-5 bg-[var(--energy)] rounded-full" />
                <span className="text-[11px] text-[var(--text-tertiary)]">Plans</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-[var(--text-primary)] leading-none">
                {plans?.data?.length ?? 0}<span className="text-[var(--text-secondary)] font-normal text-[11px] sm:text-[12px]"> active</span>
              </p>
            </motion.div>
          </div>
        </section>

        {client.notes && (
          <>
            <hr className="border-[var(--border)] dark:border-white/[0.05]" />
            <section>
              <SectionHeader icon={FileText} label="Notes" />
              <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{client.notes}</p>
            </section>
          </>
        )}

        <hr className="border-[var(--border)] dark:border-white/[0.05]" />

        {/* Contacts */}
        <section>
          <SectionHeader icon={Phone} label="Contacts" />
          <div className="space-y-2.5">
            {client.phone && <InfoRow label="Phone" value={client.phone} />}
            {client.email && <InfoRow label="E-mail" value={<span className="truncate">{client.email}</span>} />}
          </div>
        </section>

        <hr className="border-[var(--border)] dark:border-white/[0.05]" />

        {/* Details */}
        <section>
          <SectionHeader icon={User} label="Details" />
          <div className="space-y-2.5">
            {client.gender && (
              <InfoRow label="Gender" value={client.gender.charAt(0).toUpperCase() + client.gender.slice(1)} />
            )}
            {client.date_of_birth && (
              <InfoRow label="Date of Birth" value={
                <>
                  {formatDate(client.date_of_birth, "MMM d, yyyy")}
                  {calculateAge(client.date_of_birth) !== null && (
                    <span className="text-[var(--text-tertiary)] ml-1">({calculateAge(client.date_of_birth)} yrs)</span>
                  )}
                </>
              } />
            )}
            {(client.address || client.city || client.postal_code) && (
              <InfoRow label="Address" value={[client.address, client.city, client.postal_code].filter(Boolean).join(", ")} />
            )}
            {client.current_weight_kg != null && <InfoRow label="Weight" value={`${client.current_weight_kg} kg`} />}
            {client.height_cm != null && <InfoRow label="Height" value={`${client.height_cm} cm`} />}
            {client.chest_cm != null && <InfoRow label="Chest" value={`${client.chest_cm} cm`} />}
            {client.waist_cm != null && <InfoRow label="Waist" value={`${client.waist_cm} cm`} />}
            {client.body_fat_pct != null && <InfoRow label="Body Fat" value={`${client.body_fat_pct}%`} />}
            {client.bmi != null && <InfoRow label="BMI" value={String(client.bmi)} />}
            {client.lean_mass_kg != null && <InfoRow label="Lean Mass" value={`${client.lean_mass_kg} kg`} />}
            {client.nationality && <InfoRow label="Nationality" value={client.nationality} />}
            {client.occupation && <InfoRow label="Occupation" value={client.occupation} />}
            {client.sickness && (
              <InfoRow label="Health Conditions" value={<span className="text-rose-600 dark:text-rose-400">{client.sickness}</span>} />
            )}
          </div>
        </section>

      </div>
    </aside>
  )
}
