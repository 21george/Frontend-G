'use client'

import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatedSearch } from './AnimatedSearch'

export interface Column<T> {
  key: string
  header: string
  render: (item: T) => React.ReactNode
  sortable?: boolean
  sortFn?: (a: T, b: T) => number
  className?: string
}

function SortIcon({
  colKey,
  sortKey,
  sortDir,
}: {
  colKey: string
  sortKey: string | null
  sortDir: 'asc' | 'desc'
}) {
  if (sortKey !== colKey) return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300" />
  return sortDir === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-brand-700" />
    : <ChevronDown className="w-3.5 h-3.5 text-brand-700" />
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string
  searchable?: boolean
  searchPlaceholder?: string
  searchFn?: (item: T, query: string) => boolean
  onRowClick?: (item: T) => void
  emptyMessage?: string
  className?: string
  headerActions?: React.ReactNode
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchable,
  searchPlaceholder = 'Search…',
  searchFn,
  onRowClick,
  emptyMessage = 'No items found',
  className,
  headerActions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const filtered = useMemo(() => {
    let items = data
    if (search && searchFn) {
      items = items.filter((item) => searchFn(item, search.toLowerCase()))
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey)
      if (col?.sortFn) {
        items = [...items].sort((a, b) => (sortDir === 'asc' ? col.sortFn!(a, b) : col.sortFn!(b, a)))
      }
    }
    return items
  }, [data, search, searchFn, sortKey, sortDir, columns])

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className={cn('bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden', className)}>
      {/* Toolbar */}
      {(searchable || headerActions) && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)] dark:border-white/[0.06]">
          {searchable && (
            <AnimatedSearch className="flex-1 max-w-xs" active={search.length > 0}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-[var(--bg-subtle)] dark:bg-white/[0.04] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-brand-700/30 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
              />
            </AnimatedSearch>
          )}
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] dark:border-white/[0.06]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider',
                    col.sortable && 'cursor-pointer select-none hover:text-[var(--text-secondary)] dark:hover:text-slate-200',
                    col.className,
                  )}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && <SortIcon colKey={col.key} sortKey={sortKey} sortDir={sortDir} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-[var(--text-tertiary)] dark:text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'border-b border-[var(--border)] dark:border-white/[0.04] last:border-0 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-[#13131314] dark:hover:bg-white/[0.03]',
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 text-sm text-[var(--text-secondary)]', col.className)}>
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
