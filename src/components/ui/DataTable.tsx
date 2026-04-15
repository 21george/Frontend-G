'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  render: (item: T) => React.ReactNode
  sortable?: boolean
  sortFn?: (a: T, b: T) => number
  className?: string
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

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-cyan-700" />
      : <ChevronDown className="w-3.5 h-3.5 text-cyan-700" />
  }

  return (
    <div className={cn('bg-white dark:bg-[#171717] border border-slate-200/80 dark:border-white/[0.07] overflow-hidden', className)}>
      {/* Toolbar */}
      {(searchable || headerActions) && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 dark:border-white/[0.06]">
          {searchable && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-700/30 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
          )}
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/[0.06]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider',
                    col.sortable && 'cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200',
                    col.className,
                  )}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'border-b border-slate-50 dark:border-white/[0.04] last:border-0 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03]',
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 text-sm text-slate-700 dark:text-slate-300', col.className)}>
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
