'use client'

import { type UseQueryResult } from '@tanstack/react-query'
import { LoadingSpinner } from './LoadingSpinner'
import { EmptyState } from './EmptyState'
import { AlertCircle, type LucideIcon } from 'lucide-react'

interface QueryWrapperProps<T> {
  query: UseQueryResult<T, Error>
  children: (data: T) => React.ReactNode
  loadingClassName?: string
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  isEmpty?: (data: T) => boolean
}

export function QueryWrapper<T>({
  query,
  children,
  loadingClassName = 'h-64',
  emptyIcon,
  emptyTitle = 'No data found',
  emptyDescription,
  emptyAction,
  isEmpty,
}: QueryWrapperProps<T>) {
  if (query.isLoading) {
    return (
      <div className={`flex items-center justify-center ${loadingClassName}`}>
        <LoadingSpinner />
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Something went wrong</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          {query.error?.message || 'Failed to load data. Please try again.'}
        </p>
        <button
          onClick={() => query.refetch()}
          className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!query.data) return null

  if (isEmpty && isEmpty(query.data) && emptyIcon) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    )
  }

  return <>{children(query.data)}</>
}
