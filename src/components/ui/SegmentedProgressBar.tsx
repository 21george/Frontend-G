'use client'

import { useMemo } from 'react'

interface SegmentedProgressBarProps {
  percentage: number
  segments?: number
  activeColor?: string
  inactiveColor?: string
  className?: string
}

export function SegmentedProgressBar({
  percentage,
  segments = 10,
  activeColor = 'bg-emerald-500',
  inactiveColor = 'bg-[var(--bg-subtle)] dark:bg-white/[0.06]',
  className = '',
}: SegmentedProgressBarProps) {
  const filledSegments = useMemo(
    () => Math.max(0, Math.min(segments, Math.round((percentage / 100) * segments))),
    [percentage, segments]
  )

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex gap-1 flex-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`h-8 flex-1 transition-all duration-500 ${
              i < filledSegments ? activeColor : inactiveColor
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-mono font-semibold text-[var(--text-primary)] min-w-[2.5rem] text-right">
        {percentage}%
      </span>
    </div>
  )
}
