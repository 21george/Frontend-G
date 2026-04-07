import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isValid } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseDateValue(date: string | number | Date | null | undefined): Date | null {
  if (date === null || date === undefined || date === '') return null

  if (date instanceof Date) {
    return isValid(date) ? date : null
  }

  if (typeof date === 'number') {
    const parsed = new Date(date)
    return isValid(parsed) ? parsed : null
  }

  const trimmed = date.trim()
  if (!trimmed) return null

  if (/^\d+$/.test(trimmed)) {
    const numericDate = new Date(Number(trimmed))
    return isValid(numericDate) ? numericDate : null
  }

  const parsed = new Date(trimmed)
  return isValid(parsed) ? parsed : null
}

export function formatDate(date: string | number | Date | null | undefined, fmt = 'MMM d, yyyy', fallback = 'Invalid date') {
  const parsed = parseDateValue(date)
  return parsed ? format(parsed, fmt) : fallback
}

export function timeAgo(date: string | number | Date | null | undefined, fallback = 'Unknown time') {
  const parsed = parseDateValue(date)
  return parsed ? formatDistanceToNow(parsed, { addSuffix: true }) : fallback
}

export function getMondayOfWeek(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d
}

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
export type Day = typeof DAYS[number]
