'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'
import {
  LayoutDashboard, Users, Dumbbell, Salad, Calendar, Radio,
  Image, Settings, LogOut, Zap, Menu, X, Sun, Moon, CreditCard,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',         label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/clients',           label: 'Clients',          icon: Users },
  { href: '/workout-plans',     label: 'Workout Plans',    icon: Dumbbell },
  { href: '/nutrition-plans',   label: 'Nutrition',        icon: Salad },
  { href: '/checkins',          label: 'Schedule',         icon: Calendar },
  { href: '/live-training',     label: 'Live Training',    icon: Radio },
  { href: '/billing',           label: 'Billing',          icon: CreditCard },
  { href: '/settings',          label: 'Settings',         icon: Settings },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const path = usePathname()
  const { coach, logout } = useAuthStore()
  const { theme, toggle } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <div className="flex flex-col h-full">

      {/* ── Brand ── */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10 dark:border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/20 dark:bg-[#05384a] rounded-lg flex items-center justify-center shadow-lg">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white dark:text-white text-lg tracking-tight">CoachPro</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggle}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/20 dark:border-white/[0.1] bg-white/10 dark:bg-white/[0.06] text-white/70 dark:text-neutral-400 hover:text-white dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/[0.1] transition-colors"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-white/60 dark:text-neutral-400 hover:text-white dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 dark:hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="section-title text-white/40 dark:text-slate-500">Main Menu</p>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-4 px-4 py-3 rounded-xl text-base font-medium transition-all duration-150',
                active
                  ? 'bg-white/15 dark:bg-[#05384a] text-white shadow-sm'
                  : 'text-white/60 dark:text-neutral-400 hover:bg-white/10 dark:hover:bg-white/[0.08] hover:text-white dark:hover:text-white'
              )}
              tabIndex={0}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60 opacity-80" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Coach profile ── */}
      <div className="px-3 py-4 border-t border-white/10 dark:border-white/[0.08]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/[0.06] transition-colors">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ring-2 ring-white/20">
            {coach?.name?.[0]?.toUpperCase() ?? 'C'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white dark:text-white truncate leading-snug">{coach?.name}</p>
            <p className="text-xs text-white/50 dark:text-neutral-500 truncate">{coach?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="text-white/50 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10 flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Close on Escape key
  useEffect(() => {
    if (!mobileOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white dark:bg-[#333333] text-slate-900 dark:text-white rounded-xl shadow-lg border border-slate-200 dark:border-white/10"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-cyan-950 dark:bg-[#1a1a1a] flex flex-col shadow-sidebar border-r border-cyan-900 dark:border-white/[0.08]',
          'transform transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        tabIndex={-1}
        aria-modal={mobileOpen}
        role="dialog"
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-cyan-950 dark:bg-[#1a1a1a] flex-col h-screen fixed left-0 top-0 z-30 border-r border-cyan-900 dark:border-white/[0.08]">
        <SidebarContent />
      </aside>
    </>
  )
}
