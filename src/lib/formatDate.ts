import {
  isToday,
  isYesterday,
  isTomorrow,
  differenceInMinutes,
  differenceInDays,
  format,
} from 'date-fns'

/**
 * Returns a human-readable date/time string relative to now.
 *
 * Past examples:
 *   < 1 min  → "Just now"
 *   < 1 hr   → "3 minutes ago"
 *   today    → "Today at 3:00 pm"
 *   yesterday→ "Yesterday at 11:45 am"
 *   ≤ 6 days → "Last Monday at 9:00 am"
 *   same yr  → "March 4 at 2:15 pm"
 *   older    → "March 4, 2023"
 *
 * Future examples:
 *   today    → "Today at 3:00 pm"
 *   tomorrow → "Tomorrow at 10:00 am"
 *   ≤ 7 days → "This Friday at 9:00 am"
 *   beyond   → "June 12 at 3:00 pm"
 */
export function humanDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const timeStr = format(d, 'h:mm aaa') // e.g. "3:00 pm"

  const diffMins = differenceInMinutes(now, d)

  if (diffMins >= 0) {
    // Past
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
    if (isToday(d)) return `Today at ${timeStr}`
    if (isYesterday(d)) return `Yesterday at ${timeStr}`
    const daysAgo = differenceInDays(now, d)
    if (daysAgo <= 6) return `Last ${format(d, 'EEEE')} at ${timeStr}`
    if (d.getFullYear() === now.getFullYear()) return `${format(d, 'MMMM d')} at ${timeStr}`
    return format(d, 'MMMM d, yyyy')
  }

  // Future
  if (isToday(d)) return `Today at ${timeStr}`
  if (isTomorrow(d)) return `Tomorrow at ${timeStr}`
  const daysAhead = differenceInDays(d, now)
  if (daysAhead <= 7) return `This ${format(d, 'EEEE')} at ${timeStr}`
  return `${format(d, 'MMMM d')} at ${timeStr}`
}
