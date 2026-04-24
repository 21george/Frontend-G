'use client'

import { useState, useMemo } from 'react'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon, Upload, Sun, Moon, Bell, X, MessageSquare, Dumbbell, User, Calendar, Video, FileText, CheckCheck, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog, ChevronRight } from 'lucide-react'
import { WeatherBadge } from './WeatherBadge'
import { NearbyGymsButton } from './NearbyGyms'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications, useUnreadNotificationCount, useMarkAllNotificationsRead } from '@/hooks/useNotifications'
import { useWeather } from '@/hooks/useWeather'

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
            ? 'translate-x-7 bg-cyan-950'
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

// ── Notifications ──────────────────────────────────────────────────────────────

const notificationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  workout_completed: Dumbbell,
  new_message: MessageSquare,
  profile_updated: User,
  checkin_reminder: Calendar,
  live_session_reminder: Video,
  checkin_scheduled: FileText,
}

function NotificationsButton() {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications } = useNotifications({ page: 1, unreadOnly: false, refetchInterval: 3000 })
  const { count: unreadCount } = useUnreadNotificationCount()
  const markAllRead = useMarkAllNotificationsRead()

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => setIsOpen(false),
    })
  }

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const displayedNotifications = notifications.slice(0, 10)

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-white dark:border-[#1a1a1a] text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-slate-200 dark:border-white/[0.1] z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/[0.08]">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notifications list */}
              <div className="max-h-80 overflow-y-auto">
                {displayedNotifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No notifications</p>
                  </div>
                ) : (
                  displayedNotifications.map((notification, i) => {
                    const Icon = notificationIcons[notification.type] ?? Bell
                    return (
                      <Link
                        key={notification.id}
                        href={`/notifications`}
                        onClick={() => setIsOpen(false)}
                        className={`block px-4 py-3 border-b border-slate-50 dark:border-white/[0.05] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer ${
                          !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-start gap-3"
                        >
                          <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                            !notification.read ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{notification.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{notification.body}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{timeAgo(notification.sent_at)}</p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                          )}
                        </motion.div>
                      </Link>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 bg-slate-50 dark:bg-white/[0.04] border-t border-slate-100 dark:border-white/[0.08] text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-center block"
              >
                View all notifications →
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
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

// ── Weather Forecast Display ─────────────────────────────────────────────────

function WeatherForecast() {
  const { weather, loading, error } = useWeather()

  if (loading || error || !weather) return null

  const getWeatherIcon = (icon: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      'sun': Sun,
      'cloud-sun': Cloud,
      'cloud': Cloud,
      'cloud-fog': CloudFog,
      'cloud-rain': CloudRain,
      'cloud-snow': CloudSnow,
      'cloud-lightning': CloudLightning,
      'cloud-drizzle': CloudDrizzle,
    }
    const Icon = iconMap[icon] ?? Cloud
    return <Icon className="w-4 h-4" />
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
      <div className="text-blue-600 dark:text-blue-400">
        {getWeatherIcon(weather.icon)}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-900 dark:text-white">{weather.temp}°C</span>
        <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">{weather.condition}</span>
        <span className="text-xs text-slate-400 dark:text-slate-500 hidden md:inline">| {weather.city}</span>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DashboardHeader({
  title,
  subtitle,
  quickActions,
  showGreeting = false,
}: DashboardHeaderProps) {
  const { coach } = useAuthStore()
  const pathname = usePathname()

  // Get page title from pathname
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

  // Default quick actions based on current page
  const defaultQuickActions = useMemo(() => {
    if (quickActions) return quickActions

    const actions: QuickAction[] = []

    if (pathname.startsWith('/workout-plans')) {
      actions.push(
        { href: '/workout-plans/new', label: 'New Plan', icon: FileText, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50' },
        { href: '/workout-plans/import', label: 'Import Excel', icon: Upload, color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50' },
      )
    } else if (pathname.startsWith('/clients')) {
      actions.push(
        { href: '/clients/new', label: 'Add Client', icon: User, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50' },
      )
    } else if (pathname.startsWith('/nutrition-plans')) {
      actions.push(
        { href: '/nutrition-plans/new', label: 'New Plan', icon: FileText, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50' },
      )
    } else if (pathname.startsWith('/checkins')) {
      actions.push(
        { href: '/checkins/new', label: 'Schedule Check-in', icon: Calendar, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50' },
      )
    } else if (pathname.startsWith('/live-training')) {
      actions.push(
        { href: '/live-training/new', label: 'New Session', icon: Video, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50' },
      )
    } else if (pathname.startsWith('/media')) {
      actions.push(
        { href: '/media', label: 'Upload Media', icon: Upload, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50' },
      )
    }

    return actions
  }, [quickActions, pathname])

  const fullName  = [coach?.name, coach?.surname].filter(Boolean).join(' ')

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
      {/* Text */}
      <div className="min-w-0">
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>Dashboard</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-blue-600 dark:text-blue-400 font-medium">{heading}</span>
        </nav>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{heading}</h1>
        <p className="text-slate-500 dark:text-neutral-200 text-xs sm:text-sm mt-1">{subtitle}</p>
      </div>

      {/* Right side: notifications + weather + nearby + quick actions + theme toggle + avatar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
        {/* Notifications */}
        <NotificationsButton />

        {/* Weather Forecast */}
        <WeatherForecast />
        <NearbyGymsButton />
        {defaultQuickActions.length > 0 && defaultQuickActions.map(({ href, label, icon: Icon, color }) => (
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


