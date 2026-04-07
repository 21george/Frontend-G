'use client'

import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'
import Link from 'next/link'
import { LucideIcon, Upload, Sun, Moon } from 'lucide-react'
import { WeatherBadge } from './WeatherBadge'
import { NearbyGymsButton } from './NearbyGyms'

interface QuickAction {
  href: string
  label: string
  icon: LucideIcon
  color: string
}

interface DashboardHeaderProps {
  title?: string
  subtitle?: string
  quickActions?: QuickAction[]
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

/** Returns up-to-2 initials from name + surname */
function getInitials(name?: string, surname?: string): string {
  const first  = name?.trim().charAt(0).toUpperCase()    ?? ''
  const second = surname?.trim().charAt(0).toUpperCase() ?? name?.trim().split(' ')[1]?.charAt(0).toUpperCase() ?? ''
  return (first + second) || 'C'
}

/** Deterministic hue from a string for the avatar background */
function avatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 60%, 45%)`
}

// ── Animated theme toggle ─────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, toggle } = useThemeStore()
  const isDark = theme === 'dark'
  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`
        relative w-14 h-7 rounded-full border transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-cyan-700/40
        ${isDark
          ? 'bg-[#333333] border-white/[0.12]'
          : 'bg-slate-200 border-slate-300'}
      `}
    >
      {/* Track icons */}
      <Sun  size={12} className={`absolute left-1.5 top-1/2 -translate-y-1/2 transition-opacity duration-200 ${isDark ? 'opacity-30 text-neutral-400' : 'opacity-100 text-amber-500'}`} />
      <Moon size={12} className={`absolute right-1.5 top-1/2 -translate-y-1/2 transition-opacity duration-200 ${isDark ? 'opacity-100 text-blue-300' : 'opacity-30 text-slate-400'}`} />

      {/* Thumb */}
      <span
        className={`
          absolute top-0.5 w-6 h-6 rounded-full shadow-md flex items-center justify-center
          transition-all duration-300 ease-in-out
          ${isDark
            ? 'translate-x-7 bg-[#05384a]'
            : 'translate-x-0.5 bg-white'}
        `}
      >
        {isDark
          ? <Moon  size={11} className="text-white" />
          : <Sun   size={11} className="text-amber-500" />
        }
      </span>
    </button>
  )
}

// ── Coach avatar ──────────────────────────────────────────────────────────────

function CoachAvatar({ name, surname, photo }: { name?: string; surname?: string; photo?: string }) {
  const initials = getInitials(name, surname)
  const bg       = avatarColor(name ?? 'coach')

  if (photo) {
    return (
      <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/10 flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={name ?? 'Coach'} width={48} height={48} className="object-cover w-full h-full" />
      </div>
    )
  }

  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[13px] font-semibold flex-shrink-0 ring-2 ring-white/10 select-none"
      style={{ backgroundColor: bg }}
    >
      {initials}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DashboardHeader({
  title,
  subtitle = "Here's what's happening with your clients today.",
  quickActions = [
    { href: '/workout-plans/import', label: 'Import Excel', icon: Upload, color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50' },
  ],
}: DashboardHeaderProps) {
  const { coach } = useAuthStore()
  const heading   = title ?? `Good ${getGreeting()}, ${coach?.name?.split(' ')[0] ?? 'Coach'} `
  const fullName  = [coach?.name, coach?.surname].filter(Boolean).join(' ')

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
      {/* Text */}
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight truncate">{heading}</h1>
        <p className="text-slate-500 dark:text-neutral-200 text-xs sm:text-sm mt-1 truncate">{subtitle}</p>
      </div>

      {/* Right side: weather + nearby + quick actions + theme toggle + avatar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
        <WeatherBadge />
        <NearbyGymsButton />
        {quickActions.length > 0 && quickActions.map(({ href, label, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${color}`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        ))}

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Coach info */}
        <div className="flex items-center gap-2.5 pl-1  dark:border-white/[0.1]">
          <CoachAvatar name={coach?.name} surname={coach?.surname} photo={coach?.profile_photo} />
          {fullName && (
            <div className="hidden sm:flex flex-col ">
              <span className="text-[13px] font-semibold text-slate-800 dark:text-white leading-tight">{fullName}</span>
              <span className="text-[11px] text-gray-100 dark:text-neutral-200 leading-tight">{coach?.email}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


