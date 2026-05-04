'use client'

import { useMemo } from 'react'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {LucideIcon,Upload,Sun,Moon,User,Calendar,Video,FileText,ChevronRight} from 'lucide-react'
import { NearbyGymsButton } from './NearbyGyms'
import NotificationsButton from '@/components/notifications'
import WeatherForecast from '@/components/weather'

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
  showGreeting?: boolean
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

function getInitials(name?: string, surname?: string): string {
  const first  = name?.trim().charAt(0).toUpperCase()    ?? ''
  const second = surname?.trim().charAt(0).toUpperCase() ?? name?.trim().split(' ')[1]?.charAt(0).toUpperCase() ?? ''
  return (first + second) || 'C'
}

function avatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 60%, 45%)`
}

function ThemeToggle() {
  const { theme, toggle } = useThemeStore()
  const isDark = theme === 'dark'
  return (
    <button
      onClick={toggle}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`
        relative w-14 h-7 border transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-brand-700/40
        ${isDark
          ? 'bg-slate-800 border-white/[0.12]'
          : 'bg-slate-200 border-slate-300'}
      `}
    >
      <Sun  size={12} className={`absolute left-1.5 top-1/2 -translate-y-1/2 transition-opacity duration-200 ${isDark ? 'opacity-30 text-neutral-400' : 'opacity-100 text-amber-500'}`} />
      <Moon size={12} className={`absolute right-1.5 top-1/2 -translate-y-1/2 transition-opacity duration-200 ${isDark ? 'opacity-100 text-blue-300' : 'opacity-30 text-slate-400'}`} />
      <span
        className={`
          absolute top-0.5 w-6 h-6 flex items-center justify-center
          transition-all duration-300 ease-in-out
          ${isDark
            ? 'translate-x-7 bg-btn'
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

function CoachAvatar({ name, surname, photo }: { name?: string; surname?: string; photo?: string }) {
  const initials = getInitials(name, surname)
  const bg       = avatarColor(name ?? 'coach')

  if (photo) {
    return (
      <div className="h-12 w-12 overflow-hidden rounded-10 ring-2 ring-white/10 flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={name ?? 'Coach'} width={48} height={48} className="h-full w-full rounded-10 object-cover" />
      </div>
    )
  }

  return (
    <div
      className="h-12 w-12 rounded-10 flex items-center justify-center text-white text-[13px] font-semibold flex-shrink-0 ring-2 ring-white/10 select-none"
      style={{ backgroundColor: bg }}
    >
      {initials}
    </div>
  )
}

export default function DashboardHeader({
  title,
  subtitle,
  quickActions,
  showGreeting = false,
}: DashboardHeaderProps) {
  const { coach } = useAuthStore()
  const pathname = usePathname()

  const getPageTitle = () => {
    const path = pathname.split('/').pop() || ''
    const titleMap: Record<string, string> = {
      'settings': 'Settings',
      'dashboard': 'Dashboard',
      'clients': 'Clients',
      'workout-plans': 'Workout Plans',
      'nutrition-plans': 'Nutrition Plans',
      'checkins': 'Check-ins',
      'live-training': 'Live Training',
      'billing': 'Billing',
      'media': 'Media',
      'notifications': 'Notifications',
    }
    return titleMap[path] || path?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Dashboard'
  }

  const pageTitle = getPageTitle()
  const heading   = title ?? pageTitle

  const defaultQuickActions = useMemo(() => {
    if (quickActions) return quickActions

    const actions: QuickAction[] = []

    if (pathname.startsWith('/workout-plans')) {
      actions.push(
        { href: '/workout-plans/new', label: 'Create plan', icon: FileText, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50' },
        { href: '/workout-plans/import', label: 'Import Excel', icon: Upload, color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50' },
      )
    } else if (pathname.startsWith('/clients')) {
      actions.push(
        { href: '/clients/new', label: 'Add a client', icon: User, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50' },
      )
    } else if (pathname.startsWith('/nutrition-plans')) {
      actions.push(
        { href: '/nutrition-plans/new', label: 'Create plan', icon: FileText, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50' },
      )
    } else if (pathname.startsWith('/checkins')) {
      actions.push(
        { href: '/checkins/new', label: 'Book a check-in', icon: Calendar, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50' },
      )
    } else if (pathname.startsWith('/live-training')) {
      actions.push(
        { href: '/live-training/new', label: 'New Session', icon: Video, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50' },
      )
    } else if (pathname.startsWith('/media')) {
      actions.push(
        { href: '/media', label: 'Upload files', icon: Upload, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50' },
      )
    }

    return actions
  }, [quickActions, pathname])

  const fullName = [coach?.name, coach?.surname].filter(Boolean).join(' ')

  const now = new Date()
  const dayName   = now.toLocaleDateString('en-US', { weekday: 'long' })
  const dayNum    = now.getDate()
  const monthName = now.toLocaleDateString('en-US', { month: 'long' })
  const dateLabel = `${dayName}, ${dayNum} ${monthName}`

  void showGreeting

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
      <div className="min-w-0">
        <nav className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] mb-1">
          <span>Dashboard</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-blue-600 dark:text-blue-400 font-medium">{heading}</span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#888780] dark:text-[#FAFAFA]/40 mb-0.5">
              Good {getGreeting()}, {coach?.name ?? 'there'}
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)]">{dateLabel}</p>
          </div>
        </nav>
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">{heading}</h1>
        <p className="text-slate-500 dark:text-neutral-200 text-xs sm:text-sm mt-1">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
        <NotificationsButton />
        <WeatherForecast />
        <NearbyGymsButton />
        {defaultQuickActions.length > 0 && defaultQuickActions.map(({ href, label, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${color}`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        ))}
        <ThemeToggle />
        <div className="flex items-center gap-2.5 pl-1 border-l border-slate-200 dark:border-white/[0.1]">
          <CoachAvatar name={coach?.name} surname={coach?.surname} photo={coach?.profile_photo} />
          {fullName && (
            <div className="hidden sm:flex flex-col">
              <span className="text-[13px] font-semibold text-slate-800 dark:text-white leading-tight">{fullName}</span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400 leading-tight">{coach?.email}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
