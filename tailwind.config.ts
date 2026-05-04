import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        /* ── Primary brand palette (Indigo-based enterprise) ─────────── */
        brand: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
          DEFAULT: '#4F46E5',
          dark:  '#4338CA',
          light: '#EEF2FF',
        },
        /* ── Semantic colours ─────────────────────────────────────────── */
        accent: {
          DEFAULT: '#10B981',
          dark:    '#059669',
          50:  '#ECFDF5',
          500: '#10B981',
          600: '#059669',
        },
        warn:   { DEFAULT: '#F59E0B', 50: '#FFFBEB' },
        danger: { DEFAULT: '#EF4444', 50: '#FEF2F2' },
        /* ── Sidebar ──────────────────────────────────────────────────── */
        sidebar: {
          DEFAULT: '#11212D',
          dark:    '#121212',
        },
        /* ── Button palette ────────────────────────────────────────────── */
        btn: {
          DEFAULT: '#0F2027',
        },
        /* ── Surface palette ───────────────────────────────────────────── */
        surface: {
          DEFAULT: '#F8FAFC',
          card:    '#FFFFFF',
          'card-dark': '#1A1A1A',
          'page-dark': '#121212',
          subtle:  '#F1F5F9',
          'subtle-dark': '#1E1E1E',
          hover:   '#F1F5F9',
          border:  '#E2E8F0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        '4.5': '1.125rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
        '22':  '5.5rem',
        '30':  '7.5rem',
      },
      borderRadius: {
        '4': '0.25rem',
        '6': '0.375rem',
        '8': '0.5rem',
        '10': '0.625rem',
        '12': '0.75rem',
      },
      boxShadow: {
        'xs':    '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'card':  '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'elevated': '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        'overlay': '0 8px 30px rgb(0 0 0 / 0.12)',
        'sidebar': '-4px 0 24px 0 rgb(0 0 0 / 0.15)',
        'dark-card': '0 1px 3px 0 rgb(0 0 0 / 0.2), 0 0 0 1px rgba(255,255,255,0.06)',
        'dark-elevated': '0 8px 30px rgb(0 0 0 / 0.35), 0 0 0 1px rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 100%)',
        'gradient-accent': 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
        'gradient-brand': 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%':   { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in':  'fade-in 0.2s ease-out',
        'slide-in': 'slide-in 0.2s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
