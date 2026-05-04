/**
 * Design System Constants
 * Matches the Enterprise Design System in globals.css and tailwind.config.ts
 */

// Primary brand colors
export const BRAND = {
  DEFAULT: '#4F46E5',
  dark: '#4338CA',
  light: '#EEF2FF',
  50: '#EEF2FF',
  100: '#E0E7FF',
  200: '#C7D2FE',
  300: '#A5B4FC',
  400: '#818CF8',
  500: '#6366F1',
  600: '#4F46E5',
  700: '#4338CA',
  800: '#3730A3',
  900: '#312E81',
}

// Accent colors
export const ACCENT = {
  DEFAULT: '#10B981',
  dark: '#059669',
  50: '#ECFDF5',
  500: '#10B981',
  600: '#059669',
}

// Semantic colors
export const WARN = '#F59E0B'
export const DANGER = '#EF4444'

// Surface colors
export const SURFACE = {
  page: '#F8FAFC',
  card: '#FFFFFF',
  'card-dark': '#1A1A1A',
  'page-dark': '#121212',
  subtle: '#F1F5F9',
  'subtle-dark': '#1E1E1E',
  hover: '#F1F5F9',
  border: '#E2E8F0',
  'border-dark': 'rgba(255,255,255,0.06)',
}

// Text colors
export const TEXT = {
  primary: '#121212',
  'primary-dark': '#F1F5F9',
  secondary: '#64748B',
  'secondary-dark': '#94A3B8',
  tertiary: '#94A3B8',
  'tertiary-dark': '#64748B',
}

// Event type colors (matching enterprise palette)
export const EVENT_TYPES = {
  video: {
    bg: 'bg-brand-50 dark:bg-brand-900/20',
    text: 'text-brand-700 dark:text-brand-300',
    border: 'border-brand-200 dark:border-brand-800',
    iconBg: 'bg-brand-500',
    icon: 'text-white',
  },
  call: {
    bg: 'bg-accent-50 dark:bg-accent-900/20',
    text: 'text-accent-700 dark:text-accent-300',
    border: 'border-accent-200 dark:border-accent-800',
    iconBg: 'bg-accent-500',
    icon: 'text-white',
  },
  chat: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    iconBg: 'bg-purple-500',
    icon: 'text-white',
  },
}

// Status colors
export const STATUS = {
  completed: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  cancelled: {
    bg: 'bg-danger/10 dark:bg-danger/20',
    text: 'text-danger',
    border: 'border-danger/20 dark:border-danger/30',
  },
  scheduled: {
    bg: 'bg-brand-50 dark:bg-brand-900/20',
    text: 'text-brand-700 dark:text-brand-300',
    border: 'border-brand-200 dark:border-brand-800',
  },
}

// Typography
export const TYPO = {
  xs: 'text-[10px] font-bold uppercase tracking-[0.2em]',
  sm: 'text-xs font-medium',
  base: 'text-sm',
  lg: 'text-base font-semibold',
  xl: 'text-lg font-semibold',
}

// Animation variants
export const ANIMATION = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04, delayChildren: 0.05 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
  },
  itemLeft: {
    hidden: { opacity: 0, x: -16 },
    show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
  },
}

// Border radius
export const RADIUS = {
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
}

// Shadows
export const SHADOW = {
  card: 'shadow-card',
  elevated: 'shadow-elevated',
  xs: 'shadow-xs',
}
