'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Bell,
  X,
  MessageSquare,
  Dumbbell,
  User,
  Calendar,
  Video,
  FileText,
  CheckCheck,
  Check,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useDeleteNotification,
} from '@/hooks/useNotifications'
import { useUnreadMessageCount, useMarkAllMessagesRead } from '@/hooks/useMessages'
import { humanDate } from '@/lib/formatDate'
import type { Notification } from '@/types'

// ── Icon & colour maps (matching enterprise palette) ─────────────────────────

const notificationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  workout_completed: Dumbbell,
  new_message: MessageSquare,
  profile_updated: User,
  checkin_reminder: Calendar,
  live_session_reminder: Video,
  checkin_scheduled: FileText,
}

const notificationColors: Record<string, string> = {
  workout_completed: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400',
  new_message: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
  profile_updated: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  checkin_reminder: 'bg-warn-100 text-warn-700 dark:bg-warn-900/30 dark:text-warn-400',
  live_session_reminder: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
  checkin_scheduled: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
}

function formatWhen(sentAt: string): string {
  const now = new Date()
  const sent = new Date(sentAt)
  const diffMs = now.getTime() - sent.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return humanDate(sentAt)
}

function getNavigationLink(notification: Notification): string {
  const { type, data } = notification
  const clientId = data?.clientId
  if (type === 'new_message' && clientId) return `/messages?client=${clientId}`
  if ((type === 'workout_completed' || type === 'profile_updated') && clientId)
    return `/clients/${clientId}`
  return ''
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NotificationsButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [page, setPage] = useState(1)

  const {
    notifications: allNotifications,
    pagination,
    isLoading,
  } = useNotifications({ page, unreadOnly: filter === 'unread', refetchInterval: 5000 })
  const { count: unreadNotificationCount } = useUnreadNotificationCount()
  const { data: unreadMessagesData } = useUnreadMessageCount()
  const unreadMessageCount = unreadMessagesData?.data?.count ?? 0
  const totalUnread = unreadNotificationCount + unreadMessageCount

  const markAllRead = useMarkAllNotificationsRead()
  const markAllMessagesRead = useMarkAllMessagesRead()
  const markRead = useMarkNotificationRead()
  const deleteNotif = useDeleteNotification()

  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const prevShowAllRef = useRef(false)

  const displayNotifications = allNotifications

  // Close modal on Escape key
  useEffect(() => {
    if (!showAll) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowAll(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showAll])

  // Focus trap inside modal
  const handleModalKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [])

  // Restore focus when modal closes
  useEffect(() => {
    let rafId: number | undefined
    if (prevShowAllRef.current === true && !showAll) {
      rafId = requestAnimationFrame(() => {
        triggerRef.current?.focus()
      })
    }
    prevShowAllRef.current = showAll
    return () => {
      if (rafId !== undefined) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [showAll])

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined)
    markAllMessagesRead.mutate(undefined)
  }
  const handleMarkRead = (id: string) => markRead.mutate(id)
  const handleDelete = (id: string) => deleteNotif.mutate(id)

  const displayedNotifications = allNotifications.slice(0, 10)

  return (
    <div className="relative">
      <motion.button
        ref={triggerRef}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open notifications"
        className="relative p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--border-hover)] transition-colors"
      >
        <Bell className="w-5 h-5" />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-danger border-2 border-[var(--bg-page)] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && !showAll && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 sm:w-[420px] bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-overlay dark:shadow-dark-elevated z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close notifications"
                  className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Notifications list */}
              <div className="max-h-[400px] overflow-y-auto">
                {displayedNotifications.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-6 h-6 text-[var(--text-tertiary)]" />
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">You&apos;re all caught up!</p>
                  </div>
                ) : (
                  displayedNotifications.map((notification, i) => {
                    const Icon = notificationIcons[notification.type] ?? Bell
                    const link = getNavigationLink(notification) || '/notifications'
                    return (
                      <Link
                        key={notification.id}
                        href={link}
                        onClick={() => {
                          if (!notification.read) handleMarkRead(notification.id)
                          setIsOpen(false)
                        }}
                        className={`block px-5 py-3.5 border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer ${
                          !notification.read ? 'bg-brand-50/30 dark:bg-brand-900/5' : ''
                        }`}
                      >
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-start gap-3.5"
                        >
                          <div
                            className={`p-2 rounded-lg flex-shrink-0 ${
                              !notification.read
                                ? notificationColors[notification.type] || 'bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400'
                                : 'bg-[var(--bg-subtle)] text-[var(--text-tertiary)]'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                                  {notification.body}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              {notification.from && (
                                <span className="text-[11px] text-[var(--text-secondary)]">
                                  {notification.from}
                                </span>
                              )}
                              <span className="text-[11px] text-[var(--text-tertiary)]">
                                {formatWhen(notification.sent_at)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-subtle)]">
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all as read
                </button>
                <button
                  onClick={() => {
                    setPage(1)
                    setShowAll(true)
                  }}
                  className="px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-md hover:bg-brand-700 transition-colors"
                >
                  View all notifications
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── VIEW ALL MODAL ── */}
      <AnimatePresence>
        {showAll && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
              onClick={() => setShowAll(false)}
            />
            <motion.div
              ref={modalRef}
              onKeyDown={handleModalKeyDown}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-4 top-[5%] bottom-[5%] sm:inset-x-auto sm:left-1/2 sm:top-[8%] sm:bottom-[8%] sm:w-[560px] sm:-translate-x-1/2 z-[70] bg-[var(--bg-card)] border border-[var(--border)] rounded-xl flex flex-col overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Notifications"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
                <div>
                  <h2 className="text-[17px] font-semibold text-[var(--text-primary)]">
                    Notifications
                  </h2>
                  <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
                    {totalUnread > 0
                      ? `${totalUnread} unread${unreadMessageCount > 0 ? ` · ${unreadMessageCount} message${unreadMessageCount === 1 ? '' : 's'}` : ''}`
                      : 'Nothing new.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Filter toggle */}
                  <div className="flex border border-[var(--border)] rounded-lg overflow-hidden">
                    <button
                      onClick={() => {
                        setFilter('all')
                        setPage(1)
                      }}
                      className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${
                        filter === 'all'
                          ? 'bg-[var(--text-primary)] text-[var(--bg-card)]'
                          : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        setFilter('unread')
                        setPage(1)
                      }}
                      className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${
                        filter === 'unread'
                          ? 'bg-[var(--text-primary)] text-[var(--bg-card)]'
                          : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      Unread{unreadNotificationCount > 0 ? ` (${unreadNotificationCount})` : ''}
                    </button>
                  </div>
                  {totalUnread > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium text-brand-600 dark:text-brand-400 hover:bg-[var(--bg-subtle)] rounded-md transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setShowAll(false)}
                    aria-label="Close notifications"
                    className="p-1.5 rounded-md hover:bg-[var(--bg-subtle)] transition-colors"
                  >
                    <X className="w-4 h-4 text-[var(--text-tertiary)]" />
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="inline-block animate-spin h-8 w-8 border-4 border-[var(--border)] border-t-brand-600 rounded-full" />
                    <p className="mt-3 text-[13px] text-[var(--text-tertiary)]">
                      Grabbing your notifications…
                    </p>
                  </div>
                ) : displayNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-14 h-14 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center mb-4">
                      <Bell className="w-7 h-7 text-[var(--text-tertiary)]" />
                    </div>
                    <p className="text-[14px] font-medium text-[var(--text-secondary)]">
                      You&apos;re all caught up!
                    </p>
                    <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
                      {filter === 'unread'
                        ? 'Nothing new — you\u2019re up to date.'
                        : 'All clear. Nothing new.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {displayNotifications.map((notification) => {
                      const Icon = notificationIcons[notification.type] ?? Bell
                      const colorClass =
                        notificationColors[notification.type] ??
                        'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                      const link = getNavigationLink(notification)
                      const content = (
                        <div className="flex items-start gap-3.5 px-5 py-4 hover:bg-[var(--bg-subtle)] transition-colors group">
                          <div className={`p-2 rounded-lg flex-shrink-0 ${colorClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                                  {notification.title}
                                </p>
                                <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                                  {notification.body}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              {notification.from && (
                                <span className="text-[11px] text-[var(--text-secondary)]">
                                  From {notification.from}
                                </span>
                              )}
                              <span className="text-[11px] text-[var(--text-tertiary)]">
                                {formatWhen(notification.sent_at)}
                              </span>
                              {link && (
                                <span className="text-[11px] font-medium text-brand-600 dark:text-brand-400">
                                  See more
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleMarkRead(notification.id)
                                }}
                                className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-colors"
                                title="Mark read"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDelete(notification.id)
                              }}
                              className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )

                      if (link) {
                        return (
                          <Link
                            key={notification.id}
                            href={link}
                            onClick={() => {
                              if (!notification.read) handleMarkRead(notification.id)
                              setShowAll(false)
                            }}
                          >
                            {content}
                          </Link>
                        )
                      }
                      return <div key={notification.id}>{content}</div>
                    })}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {pagination && pagination.total_pages > 1 && (
                <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-[var(--border)] flex-shrink-0">
                  <button
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1.5 border border-[var(--border)] rounded-md text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-[12px] text-[var(--text-tertiary)]">
                    Page {pagination.page} of {pagination.total_pages}
                  </span>
                  <button
                    onClick={() =>
                      setPage((current) => Math.min(pagination.total_pages, current + 1))
                    }
                    disabled={pagination.page >= pagination.total_pages}
                    className="px-3 py-1.5 border border-[var(--border)] rounded-md text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
