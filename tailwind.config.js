/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563EB',
          dark:    '#1D4ED8',
          light:   '#EFF6FF',
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        accent: {
          DEFAULT: '#10B981',
          dark:    '#059669',
          light:   '#ECFDF5',
          500: '#10B981',
          600: '#059669',
        },
        warn:   { DEFAULT: '#F59E0B', light: '#FFFBEB' },
        danger: { DEFAULT: '#EF4444', light: '#FEF2F2' },
        sidebar: '#0F172A',
      },
      fontFamily: {
        sans: ['Inter', 'var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:     '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        elevated: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
        sidebar:  '-4px 0 24px 0 rgb(0 0 0 / 0.25)',
      },
      screens: {
        xs: '480px',
      },
    },
  },
  plugins: [],
}
