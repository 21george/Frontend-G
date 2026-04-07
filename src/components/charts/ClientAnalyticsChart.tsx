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

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-[240px] text-sm text-slate-500">
        No workout completion data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barGap={4} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} vertical={false} />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fill: isDark ? '#a0a0a0' : '#64748b', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: isDark ? '#a0a0a0' : '#64748b', fontSize: 12 }}
          width={30}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? '#333333' : '#ffffff',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
            borderRadius: '8px',
            boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.08)',
            color: isDark ? '#ffffff' : '#1e293b',
            fontSize: '13px',
          }}
          cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
        />
        <Bar
          dataKey="completed"
          fill="#10b981"
          radius={[4, 4, 0, 0]}
          name="Completed"
        />
        <Bar
          dataKey="total"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
          name="Total"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
