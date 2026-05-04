'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useThemeStore } from '@/store/theme'

export interface WeeklyCompletionData {
  day: string
  completed: number
  total: number
}

interface Props {
  data?: WeeklyCompletionData[]
}

export default function ClientAnalyticsChart({ data = [] }: Props) {
  const isDark = useThemeStore().theme === 'dark'
  const hasData = data.length > 0
  const palette = isDark
    ? {
        grid: 'rgba(148, 163, 184, 0.12)',
        tick: '#94A3B8',
        tooltipBg: '#1A1A1A',
        tooltipBorder: '1px solid rgba(255,255,255,0.08)',
        tooltipShadow: '0 10px 30px rgba(0,0,0,0.35)',
        tooltipText: '#F8FAFC',
        cursor: 'rgba(148, 163, 184, 0.08)',
        completed: '#34D399',
        total: '#818CF8',
      }
    : {
        grid: 'rgba(15, 23, 42, 0.08)',
        tick: '#64748B',
        tooltipBg: '#FFFFFF',
        tooltipBorder: '1px solid rgba(15,23,42,0.08)',
        tooltipShadow: '0 10px 24px rgba(15,23,42,0.08)',
        tooltipText: '#1E293B',
        cursor: 'rgba(15, 23, 42, 0.04)',
        completed: '#10B981',
        total: '#4F46E5',
      }

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-[240px] text-sm text-slate-500 dark:text-slate-400">
        No workout completion data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barGap={4} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} vertical={false} />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fill: palette.tick, fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: palette.tick, fontSize: 12 }}
          width={30}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: palette.tooltipBg,
            border: palette.tooltipBorder,
            borderRadius: '8px',
            boxShadow: palette.tooltipShadow,
            color: palette.tooltipText,
            fontSize: '13px',
          }}
          cursor={{ fill: palette.cursor }}
        />
        <Bar
          dataKey="completed"
          fill={palette.completed}
          radius={[4, 4, 0, 0]}
          name="Completed"
        />
        <Bar
          dataKey="total"
          fill={palette.total}
          radius={[4, 4, 0, 0]}
          name="Total"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
