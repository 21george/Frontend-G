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
import { humanDate } from '@/lib/formatDate'
import type { Notification } from '@/types'

// ── Icon & colour maps ────────────────────────────────────────────────────────

const notificationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  workout_completed: Dumbbell,
  new_message: MessageSquare,
  profile_updated: User,
  checkin_reminder: Calendar,
  live_session_reminder: Video,
  checkin_scheduled: FileText,
}

const notificationColors: Record<string, string> = {
  workout_completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  new_message: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  profile_updated: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  checkin_reminder: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  live_session_reminder: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  checkin_scheduled: 'bg-brand-100 text-brand-700 dark:bg-brand-700/30 dark:text-brand-400',
}

function getNavigationLink(notification: Notification): string {
  const { type, data } = notification
  const clientId = data.clientId
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

  const { notifications } = useNotifications({
    page: 1,
    unreadOnly: false,
    refetchInterval: 3000,
  })
  const {
    notifications: filteredNotifications,
    pagination,
    isLoading,
  } = useNotifications({ page, unreadOnly: filter === 'unread', refetchInterval: 5000 })
  const { count: unreadCount } = useUnreadNotificationCount()
  const markAllRead = useMarkAllNotificationsRead()
  const markRead = useMarkNotificationRead()
  const deleteNotif = useDeleteNotification()

  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const prevShowAllRef = useRef(false)

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
    let rafId: number
    if (prevShowAllRef.current === true && !showAll) {
      rafId = requestAnimationFrame(() => {
        triggerRef.current?.focus()
      })
    }
    prevShowAllRef.current = showAll
    return () => cancelAnimationFrame(rafId)
  }, [showAll])

  const handleMarkAllRead = () => markAllRead.mutate(undefined)
  const handleMarkRead = (id: string) => markRead.mutate(id)
  const handleDelete = (id: string) => deleteNotif.mutate(id)

  const displayedNotifications = notifications.slice(0, 10)

  return (
    <div className="relative">
      <motion.button
        ref={triggerRef}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 border-2 border-white dark:border-slate-900 text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
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
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.1] z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/[0.08]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h3>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notifications list */}
              <div className="max-h-80 overflow-y-auto">
                {displayedNotifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-[var(--text-tertiary)]">You&apos;re all caught up!</p>
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
                        className={`block px-4 py-3 border-b border-slate-50 dark:border-white/[0.05] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer ${
                          !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-start gap-3"
                        >
                          <div
                            className={`p-1.5 flex-shrink-0 ${
                              !notification.read
                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
                              {notification.body}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                              {humanDate(notification.sent_at)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
                          )}
                        </motion.div>
                      </Link>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              <button
                onClick={() => {
                  setPage(1)
                  setShowAll(true)
                }}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.04] border-t border-slate-100 dark:border-white/[0.08] text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-center block"
              >
                See all notifications
              </button>
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
              className="fixed inset-x-4 top-[5%] bottom-[5%] sm:inset-x-auto sm:left-1/2 sm:top-[8%] sm:bottom-[8%] sm:w-[560px] sm:-translate-x-1/2 z-[70] bg-white dark:bg-surface-page-dark border border-[var(--border)] flex flex-col overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Notifications"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.08] flex-shrink-0">
                <div>
                  <h2 className="text-[17px] font-semibold text-[var(--text-primary)]">
                    Notifications
                  </h2>
                  <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {unreadCount > 0
                      ? `${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`
                      : 'Nothing new.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Filter toggle */}
                  <div className="flex border border-slate-200 dark:border-white/[0.1] overflow-hidden">
                    <button
                      onClick={() => {
                        setFilter('all')
                        setPage(1)
                      }}
                      className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${
                        filter === 'all'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-white/[0.06]'
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
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-white/[0.06]'
                      }`}
                    >
                      unread{unreadCount > 0 ? ` (${unreadCount})` : ''}
                    </button>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium text-brand-600 dark:text-brand-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setShowAll(false)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="inline-block animate-spin h-8 w-8 border-4 border-slate-200 dark:border-white/20 border-t-brand-600 dark:border-t-brand-400" />
                    <p className="mt-3 text-[13px] text-slate-400 dark:text-slate-500">
                      Grabbing your notifications…
                    </p>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-14 h-14 bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center mb-4">
                      <Bell className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-[14px] font-medium text-[var(--text-secondary)]">
                      You&apos;re all caught up!
                    </p>
                    <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-1">
                      {filter === 'unread'
                        ? 'Nothing new — you\u2019re up to date.'
                        : 'All clear. Nothing new.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                    {filteredNotifications.map((notification) => {
                      const Icon = notificationIcons[notification.type] ?? Bell
                      const colorClass =
                        notificationColors[notification.type] ??
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      const link = getNavigationLink(notification)
                      const content = (
                        <div className="flex items-start gap-3.5 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group">
                          <div className={`p-2 flex-shrink-0 ${colorClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                                  {notification.title}
                                </p>
                                <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5 line-clamp-2">
                                  {notification.body}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                {humanDate(notification.sent_at)}
                              </span>
                              {link && (
                                <span className="text-[11px] font-medium text-brand-700 dark:text-brand-400">
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
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
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
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-slate-100 dark:border-white/[0.08] flex-shrink-0">
                  <button
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1.5 border border-slate-200 dark:border-white/[0.1] text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500">
                    Page {pagination.page} of {pagination.total_pages}
                  </span>
                  <button
                    onClick={() =>
                      setPage((current) => Math.min(pagination.total_pages, current + 1))
                    }
                    disabled={pagination.page >= pagination.total_pages}
                    className="px-3 py-1.5 border border-slate-200 dark:border-white/[0.1] text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
