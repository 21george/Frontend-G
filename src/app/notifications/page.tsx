'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useUnreadNotificationCount, useDeleteNotification } from '@/hooks/useNotifications'
import type { Notification } from '@/types'
import { Bell, Check, CheckCheck, Trash2, ArrowLeft, MessageSquare, Dumbbell, User, Calendar, Video, FileText } from 'lucide-react'

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

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const { notifications, pagination, isLoading, refetch } = useNotifications({
    unreadOnly: filter === 'unread',
    refetchInterval: 3000,
  })
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const deleteNotification = useDeleteNotification()
  const { count: unreadCount } = useUnreadNotificationCount()

  const handleMarkRead = (id: string) => {
    markRead.mutate(id, {
      onSuccess: () => refetch(),
    })
  }

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => refetch(),
    })
  }

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id, {
      onSuccess: () => refetch(),
    })
  }

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

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 ">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Notifications</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {unreadCount > 0 ? `${unreadCount} unread message${unreadCount === 1 ? '' : 's'}` : 'Nothing new.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <div className="flex border border-slate-200 dark:border-white/20 overflow-hidden">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              Unread
            </button>
          </div>

          {/* Mark all read */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications list */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-slate-200 dark:border-white/20 border-t-slate-900 dark:border-white" />
            <p className="mt-3 text-slate-500 dark:text-slate-400">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 card">
            <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">You're all caught up!</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {filter === 'unread' ? 'Nothing new — you\u2019re up to date.' : 'All clear. Nothing new.'}
            </p>
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = notificationIcons[notification.type] ?? Bell
            const colorClass = notificationColors[notification.type] ?? 'bg-slate-100 text-slate-700'
            const link = getNavigationLink(notification)

            return (
              <div
                key={notification.id}
                className={`group relative flex items-start gap-4 p-4 border transition-all hover:${
                  notification.read
                    ? 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-white/10'
                    : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50'
                }`}
              >
                {/* Icon */}
                <div className={`p-2.5 flex-shrink-0 ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">{notification.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{notification.body}</p>
                    </div>
                    {!notification.read && (
                      <div className="w-2.5 h-2.5 bg-blue-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(notification.sent_at).toLocaleString()}
                    </span>
                    {link && (
                      <Link
                        href={link}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View details 
                      </Link>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkRead(notification.id)}
                      className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Page {pagination.page} of {pagination.total_pages}
          </span>
        </div>
      )}
    </div>
  )
}
