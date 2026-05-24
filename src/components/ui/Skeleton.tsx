import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-[var(--bg-subtle)] dark:bg-white/[0.06]',
        className,
      )}
    />
  )
}
