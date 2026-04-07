'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface TimeData {
  day: string
  hours: number
}

const MOCK_DATA: TimeData[] = [
  { day: 'Mon', hours: 6.5 },
  { day: 'Tue', hours: 7.2 },
  { day: 'Wed', hours: 5.8 },
  { day: 'Thu', hours: 8.1 },
  { day: 'Fri', hours: 7.5 },
  { day: 'Sat', hours: 4.2 },
  { day: 'Sun', hours: 2.0 },
]

interface Props {
  data?: TimeData[]
}

export default function WorkedTimeChart({ data = MOCK_DATA }: Props) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748b', fontSize: 11 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748b', fontSize: 11 }}
          width={28}
          tickFormatter={(v) => `${v}h`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#333333',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            color: '#ffffff',
            fontSize: '13px',
          }}
          formatter={(value: number) => [`${value}h`, 'Worked']}
        />
        <Line
          type="monotone"
          dataKey="hours"
          stroke="#6366f1"
          strokeWidth={2.5}
          dot={{ fill: '#6366f1', strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: '#818cf8', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
