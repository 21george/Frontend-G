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
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV = [
  { href: '/dashboard',         label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/clients',           label: 'Clients',          icon: Users },
  { href: '/workout-plans',     label: 'Workout Plans',    icon: Dumbbell },
  { href: '/nutrition-plans',   label: 'Nutrition',        icon: Salad },
  { href: '/checkins',          label: 'Schedule',         icon: Calendar },
  { href: '/live-training',     label: 'Live Training',    icon: Radio },
  { href: '/settings',          label: 'Settings',         icon: Settings },
]

interface SidebarContentProps {
  onClose?: () => void
  collapsed?: boolean
}

function SidebarContent({ onClose, collapsed = false }: SidebarContentProps) {
  const path = usePathname()
  const { coach, logout } = useAuthStore()
  const { theme, toggle } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <div className="flex flex-col h-full">
      {/* ── Brand ── */}
      <div className={cn(
        "flex items-center border-b border-white/10 dark:border-white/[0.08]",
        collapsed ? "justify-center px-3 py-4" : "justify-between px-5 py-5"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 dark:bg-[#05384a] rounded-lg flex items-center justify-center shadow-lg">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white dark:text-white text-lg tracking-tight">CoachPro</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-white/20 dark:bg-[#05384a] rounded-lg flex items-center justify-center shadow-lg">
            <Zap className="w-4 h-4 text-white" />
          </div>
        )}

        <div className={cn("flex items-center gap-1.5", collapsed && "hidden")}>
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
        {!collapsed && <p className="section-title text-white/40 dark:text-slate-500 mb-3">Main Menu</p>}
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path.startsWith(href)
          return (
            <motion.div
              key={href}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-4 px-4 py-3 rounded-xl text-base font-medium transition-all duration-150',
                  collapsed ? 'justify-center px-2' : '',
                  active
                    ? 'bg-white/15 dark:bg-[#05384a] text-white shadow-sm'
                    : 'text-white/60 dark:text-neutral-400 hover:bg-white/10 dark:hover:bg-white/[0.08] hover:text-white dark:hover:text-white'
                )}
                tabIndex={0}
                title={collapsed ? label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
                {!collapsed && active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60 opacity-80" />
                )}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* ── Coach profile ── */}
      <div className={cn(
        "border-t border-white/10 dark:border-white/[0.08]",
        collapsed ? "px-2 py-3" : "px-3 py-4"
      )}>
        <div className={cn(
          "flex items-center rounded-xl hover:bg-white/10 dark:hover:bg-white/[0.06] transition-colors",
          collapsed ? "justify-center p-2" : "gap-3 px-2 py-2"
        )}>
          <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ring-2 ring-white/20">
            {coach?.name?.[0]?.toUpperCase() ?? 'C'}
          </div>
          {!collapsed && (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
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

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved) setCollapsed(JSON.parse(saved))
  }, [])

  // Save collapsed state
  const toggleCollapsed = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
  }

  return (
    <>
      {/* Mobile hamburger */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white dark:bg-[#333333] text-slate-900 dark:text-white rounded-xl shadow-lg border border-slate-200 dark:border-white/10"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </motion.button>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-cyan-950 dark:bg-[#1a1a1a] flex flex-col shadow-sidebar border-r border-cyan-900 dark:border-white/[0.08]"
            tabIndex={-1}
            aria-modal={mobileOpen}
            role="dialog"
          >
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop collapsible sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 256 }}
        className="hidden lg:flex bg-cyan-950 dark:bg-[#1a1a1a] flex-col h-screen fixed left-0 top-0 z-30 border-r border-cyan-900 dark:border-white/[0.08] overflow-hidden"
      >
        <SidebarContent collapsed={collapsed} />

        {/* Collapse toggle button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleCollapsed}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-[#333333] border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-white shadow-md z-10"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </motion.button>
      </motion.aside>

      {/* Spacer for main content */}
      <div className="hidden lg:block flex-shrink-0" style={{ width: collapsed ? 80 : 256 }} />
    </>
  )
}
