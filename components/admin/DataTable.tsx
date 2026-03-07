'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Search, ChevronLeft, ChevronRight, Trash2, ArrowUpDown, X } from 'lucide-react'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  /** Tailwind classes applied to both th and td — use for responsive hiding e.g. 'hidden xl:table-cell' */
  className?: string
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  apiUrl: string
  onEdit?: (item: T) => void
  /** If provided, renders an anchor link instead of a callback button for editing */
  editHref?: (item: T) => string
  onDelete?: (ids: string[]) => void
  actions?: (item: T) => React.ReactNode
  searchPlaceholder?: string
  filters?: React.ReactNode
  extraParams?: Record<string, string>
  /** If provided, renders a mobile-friendly card (md:hidden) instead of the horizontal-scroll table */
  renderMobileCard?: (item: T) => React.ReactNode
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export function DataTable<T extends { id: string }>({
  columns,
  apiUrl,
  onEdit,
  editHref,
  onDelete,
  actions,
  searchPlaceholder = 'Buscar...',
  filters,
  extraParams,
  renderMobileCard,
}: DataTableProps<T>) {
  const [data, setData] = useState<T[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // Ref keeps extraParams current inside fetchData without triggering re-creation
  const extraParamsRef = useRef(extraParams)
  extraParamsRef.current = extraParams
  // Serialize for stable dependency comparison (avoids infinite loop when parent passes inline objects)
  const extraParamsKey = JSON.stringify(extraParams ?? null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        search,
        sortBy,
        sortOrder,
        ...(extraParamsRef.current ?? {}),
      })
      const res = await fetch(`${apiUrl}?${params}`)
      if (res.ok) {
        const json: PaginatedResponse<T> = await res.json()
        setData(json.data)
        setPagination(json.pagination)
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, pagination.page, pagination.limit, search, sortBy, sortOrder, extraParamsKey])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const toggleSelectAll = () => {
    if (selected.size === data.length) setSelected(new Set())
    else setSelected(new Set(data.map((d) => d.id)))
  }

  const handleDeleteSelected = () => {
    if (onDelete && selected.size > 0) {
      onDelete(Array.from(selected))
      setSelected(new Set())
    }
  }

  // Expose refetch for parent components
  useEffect(() => {
    (window as Record<string, unknown>).__adminTableRefetch = fetchData
    return () => { delete (window as Record<string, unknown>).__adminTableRefetch }
  }, [fetchData])

  const hasActions = onEdit || editHref || actions

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
            placeholder={searchPlaceholder}
            className="w-full px-4 pr-10 py-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 text-sm transition-all"
          />
          {search ? (
            <button onClick={() => { setSearch(''); setPagination(p => ({ ...p, page: 1 })) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white z-10">
              <X size={16} />
            </button>
          ) : (
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
          )}
        </div>
        <div className="flex items-center gap-3">
          {filters}
          {selected.size > 0 && onDelete && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-colors"
            >
              <Trash2 size={16} />
              Excluir ({selected.size})
            </button>
          )}
        </div>
      </div>

      {/* Mobile cards (only when renderMobileCard is provided) */}
      {renderMobileCard && (
        <div className="md:hidden rounded-xl border border-zinc-800 overflow-hidden">
          {loading ? (
            <div className="divide-y divide-zinc-800/50">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="w-10 h-14 rounded bg-zinc-800 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-800 rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-zinc-800 rounded animate-pulse w-1/2" />
                    <div className="h-3 bg-zinc-800 rounded animate-pulse w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">Nenhum resultado encontrado</div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {data.map(item => (
                <div key={item.id}>{renderMobileCard(item)}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table — overflow-x-auto + min-w-max ensures horizontal scroll instead of column squishing */}
      <div className={`overflow-x-auto rounded-xl border border-zinc-800 ${renderMobileCard ? 'hidden md:block' : ''}`}>
        <table className="min-w-max w-full text-sm">
          <thead>
            <tr className="bg-zinc-900/50">
              {onDelete && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selected.size === data.length}
                    onChange={toggleSelectAll}
                    className="rounded border-zinc-700 bg-zinc-900"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-500 whitespace-nowrap ${
                    col.sortable ? 'cursor-pointer hover:text-white' : ''
                  } ${col.className ?? ''}`}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && <ArrowUpDown size={14} className={sortBy === col.key ? 'text-purple-400' : ''} />}
                  </span>
                </th>
              ))}
              {hasActions && (
                <th className="sticky right-0 bg-zinc-900 px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-zinc-500 shadow-[-8px_0_12px_rgba(0,0,0,0.4)]">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-12 text-center text-zinc-500">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-12 text-center text-zinc-500">
                  Nenhum resultado encontrado
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-900/30 transition-colors">
                  {onDelete && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-zinc-700 bg-zinc-900"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-zinc-300 ${col.className ?? ''}`}>
                      {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="sticky right-0 bg-zinc-950 px-4 py-3 text-right shadow-[-8px_0_12px_rgba(0,0,0,0.4)]">
                      <div className="flex items-center justify-end gap-2">
                        {actions?.(item)}
                        {editHref && (
                          <Link
                            href={editHref(item)}
                            className="text-xs px-2 py-1 rounded border border-purple-500/30 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
                          >
                            Editar
                          </Link>
                        )}
                        {onEdit && !editHref && (
                          <button
                            onClick={() => onEdit(item)}
                            className="text-xs px-2 py-1 rounded border border-purple-500/30 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>
          {pagination.total} resultado{pagination.total !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            disabled={pagination.page <= 1}
            className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-white font-medium">
            {pagination.page} / {pagination.totalPages || 1}
          </span>
          <button
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            disabled={pagination.page >= pagination.totalPages}
            className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

/** Trigger table refetch from outside */
export function refetchTable() {
  const fn = (window as Record<string, unknown>).__adminTableRefetch
  if (typeof fn === 'function') fn()
}
