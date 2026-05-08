'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useUnreadNotificationCount,
  useDeleteNotification,
} from '@/hooks/useNotifications'
import {
  useUnreadMessages,
  useMarkAllMessagesRead,
} from '@/hooks/useMessages'
import type { Notification } from '@/types'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ArrowLeft,
  MessageSquare,
  Dumbbell,
  User,
  Calendar,
  Video,
  FileText,
  Clock,
  UserCircle,
  ChevronRight,
} from 'lucide-react'
import { humanDate } from '@/lib/formatDate'
import { motion } from 'framer-motion'

/* ── Icon & colour maps ─────────────────────────────────────────────── */

const notificationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  workout_completed: Dumbbell,
  new_message: MessageSquare,
  profile_updated: User,
  checkin_reminder: Calendar,
  live_session_reminder: Video,
  checkin_scheduled: FileText,
}

const notificationColors: Record<string, string> = {
  workout_completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  new_message: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  profile_updated: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  checkin_reminder: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  live_session_reminder: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  checkin_scheduled: 'bg-brand-100 text-brand-700 dark:bg-brand-700/30 dark:text-brand-400',
}

/* ── Smart relative time ─────────────────────────────────────────────── */

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

/* ── Component ────────────────────────────────────────────────────────── */

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  /* ── Data ───────────────────────────────────────────────────────────── */
  const {
    notifications,
    pagination,
    isLoading: notifLoading,
    refetch: refetchNotifs,
  } = useNotifications({
    unreadOnly: filter === 'unread',
    refetchInterval: 5000,
  })

  const {
    data: unreadMessagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useUnreadMessages()

  const unreadMessages = unreadMessagesData?.data?.messages ?? []
  const unreadMessageCount = unreadMessagesData?.data?.count ?? 0

  const { count: unreadNotificationCount } = useUnreadNotificationCount()
  const totalUnread = unreadNotificationCount + unreadMessageCount

  /* ── Mutations ──────────────────────────────────────────────────────── */
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const markAllMessagesRead = useMarkAllMessagesRead()
  const deleteNotification = useDeleteNotification()

  const handleMarkRead = (id: string) => {
    markRead.mutate(id, { onSuccess: () => refetchNotifs() })
  }

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, { onSuccess: () => refetchNotifs() })
    markAllMessagesRead.mutate(undefined, {
      onSuccess: () => refetchMessages(),
    })
  }

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id, { onSuccess: () => refetchNotifs() })
  }

  /* ── Helpers ────────────────────────────────────────────────────────── */
  const getNavigationLink = (notification: Notification) => {
    const { type, data } = notification
    if (type === 'new_message' && data.clientId) {
      return `/messages?client=${data.clientId}`
    }
    if (type === 'workout_completed' && data.clientId) {
      return `/clients/${data.clientId}`
    }
    if (type === 'profile_updated' && data.clientId) {
      return `/clients/${data.clientId}`
    }
    return ''
  }

  const isLoading = notifLoading || messagesLoading
  const hasAny = notifications.length > 0 || unreadMessages.length > 0

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
              Notifications
            </h1>
            <p className="text-sm text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
              {totalUnread > 0
                ? `${totalUnread} unread${unreadMessageCount > 0 ? ` · ${unreadMessageCount} message${unreadMessageCount === 1 ? '' : 's'}` : ''}`
                : 'Nothing new.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex border border-[var(--border)] dark:border-white/[0.08] overflow-hidden rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-white/[0.04]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-white/[0.04]'
              }`}
            >
              Unread{totalUnread > 0 ? ` (${totalUnread})` : ''}
            </button>
          </div>

          {totalUnread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06]"
            >
              <CheckCheck className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-slate-200 dark:border-white/20 border-t-slate-900 dark:border-t-white rounded-full" />
          <p className="mt-3 text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">Loading…</p>
        </div>
      ) : !hasAny ? (
        <div className="text-center py-16 bg-white dark:bg-[#1A1A1A] border border-[var(--border)] dark:border-white/[0.06] rounded-xl">
          <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--text-primary)] dark:text-[var(--text-primary)]">
            You&apos;re all caught up!
          </h3>
          <p className="text-[var(--text-secondary)] dark:text-[var(--text-secondary)] mt-1">
            {filter === 'unread'
              ? 'No unread notifications or messages.'
              : 'All clear. Nothing new.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* ── Section: Unread Client Messages ────────────────────────── */}
          {unreadMessages.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2 px-1">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                  New Messages from Clients
                </h2>
                <span className="text-xs font-bold text-white bg-blue-500 px-1.5 py-0.5 rounded-full">
                  {unreadMessages.length}
                </span>
              </div>

              <div className="space-y-2">
                {unreadMessages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      href={`/clients/${msg.client_id}`}
                      className="group flex items-start gap-3.5 p-4 bg-white dark:bg-[#1A1A1A] border border-[var(--border)] dark:border-white/[0.06] rounded-xl hover:border-blue-300 dark:hover:border-blue-800/50 transition-all hover:shadow-sm"
                    >
                      {/* Avatar placeholder */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                        {msg.client_name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)] text-sm">
                            {msg.client_name}
                          </p>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            {formatWhen(msg.sent_at)}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                          {msg.content}
                        </p>

                        {msg.media_url && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[11px] text-blue-600 dark:text-blue-400">
                            <FileText className="w-3 h-3" />
                            {msg.media_type === 'image' ? 'Image' : 'File'} attached
                          </span>
                        )}
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 mt-3 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* ── Section: Notifications ─────────────────────────────────── */}
          {notifications.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2 px-1">
                <Bell className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                  Notifications
                </h2>
                <span className="text-xs font-bold text-white bg-brand-600 px-1.5 py-0.5 rounded-full">
                  {notifications.length}
                </span>
              </div>

              <div className="space-y-2">
                {notifications.map((notification, i) => {
                  const Icon = notificationIcons[notification.type] ?? Bell
                  const colorClass =
                    notificationColors[notification.type] ??
                    'bg-slate-100 text-slate-700'
                  const link = getNavigationLink(notification)
                  const senderName =
                    notification.from ||
                    notification.data?.clientName ||
                    notification.data?.coachName ||
                    ''

                  const card = (
                    <div
                      className={`group flex items-start gap-4 p-4 border rounded-xl transition-all ${
                        notification.read
                          ? 'bg-white dark:bg-[#1A1A1A] border-[var(--border)] dark:border-white/[0.06]'
                          : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50'
                      } hover:shadow-sm`}
                    >
                      <div className={`p-2.5 flex-shrink-0 rounded-lg ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-medium text-[var(--text-primary)] dark:text-[var(--text-primary)] text-sm">
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              {notification.body}
                            </p>

                            {/* From + When */}
                            <div className="flex items-center gap-3 mt-2">
                              {senderName && (
                                <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                                  <UserCircle className="w-3 h-3" />
                                  From {senderName}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                                <Clock className="w-3 h-3" />
                                {formatWhen(notification.sent_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {link && (
                          <Link
                            href={link}
                            className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                          >
                            View details →
                          </Link>
                        )}
                      </div>

                      {/* Hover actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleMarkRead(notification.id)
                            }}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDelete(notification.id)
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )

                  return link ? (
                    <Link key={notification.id} href={link} className="block">
                      {card}
                    </Link>
                  ) : (
                    <div key={notification.id}>{card}</div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="text-sm text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
            Page {pagination.page} of {pagination.total_pages}
          </span>
        </div>
      )}
    </div>
  )
}
