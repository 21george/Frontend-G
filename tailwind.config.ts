import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563EB',
          dark:    '#1D4ED8',
          light:   '#EFF6FF',
          50:  '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          900: '#1E3A8A',
        },
        accent: {
          DEFAULT: '#10B981',
          dark:    '#059669',
          500: '#10B981',
          600: '#059669',
        },
        warn:   { DEFAULT: '#F59E0B' },
        danger: { DEFAULT: '#EF4444' },
        sidebar: '#05384a',
        /* Dark dashboard surface palette */
        surface: {
          DEFAULT: '#141414',
          card:    '#333333',
          hover:   '#3d3d3d',
          border:  'rgba(255,255,255,0.08)',
        },
        teal: {
          muted: '#5eead4',
          dim:   '#2dd4bf',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card:     '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        elevated: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
        sidebar:  '-4px 0 24px 0 rgb(0 0 0 / 0.25)',
        'dark-card': '0 2px 8px 0 rgb(0 0 0 / 0.3), 0 0 0 1px rgba(255,255,255,0.04)',
        'dark-glow': '0 0 20px 0 rgba(59, 130, 246, 0.08)',
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #141414 0%, #1a1a1a 50%, #333333 100%)',
        'gradient-card': 'linear-gradient(145deg, #333333 0%, #3d3d3d 100%)',
        'gradient-accent': 'linear-gradient(135deg, #10b981 0%, #2dd4bf 100%)',
        'gradient-blue': 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
