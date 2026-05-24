'use client'

import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: number
  icon:  LucideIcon
  trend: { value: string; up: boolean }
  delay: number
}

export function KpiCard({ label, value, icon: Icon, trend, delay }: KpiCardProps) {
  const trendCls = trend.up
    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
    : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-[var(--bg-card)] dark:bg-[#1A1A1A] border border-[var(--border)] dark:border-white/[0.07] p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)] dark:text-[#FAFAFA]/40">
          {label}
        </p>
        <div className="w-7 h-7 flex items-center justify-center bg-[var(--bg-subtle)] dark:bg-[#132E35]/30">
          <Icon size={14} className="text-[#132E35] dark:text-[#2A96AD]" />
        </div>
      </div>

      <p className="text-3xl font-bold text-[var(--text-primary)] dark:text-[#FAFAFA] tracking-tight leading-none">
        {value}
      </p>

      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 ${trendCls}`}>
          {trend.up ? '↑' : '↓'} {trend.value}
        </span>
        <span className="text-[10px] text-[var(--text-secondary)] dark:text-[#FAFAFA]/40">vs last week</span>
      </div>
    </motion.div>
  )
}
