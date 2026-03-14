'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Search, ChevronLeft, ChevronRight, Trash2, ArrowUpDown, X, SearchX } from 'lucide-react'

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
  /** Extra bulk action buttons rendered in toolbar when rows are selected. Receives selected IDs and a clearSelection callback. */
  bulkActions?: (ids: string[], clearSelection: () => void) => React.ReactNode
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

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

function PageNumbers({
  current,
  total,
  onChange,
}: {
  current: number
  total: number
  onChange: (page: number) => void
}) {
  if (total <= 1) return null

  const pages: (number | 'ellipsis')[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('ellipsis')
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (current < total - 2) pages.push('ellipsis')
    pages.push(total)
  }

  return (
    <div className="hidden sm:flex items-center gap-1">
      {pages.map((page, i) =>
        page === 'ellipsis' ? (
          <span key={`e${i}`} className="px-1 text-zinc-600 text-sm">…</span>
        ) : (
          <button
            key={page}
            onClick={() => onChange(page)}
            className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
              page === current
                ? 'bg-purple-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {page}
          </button>
        )
      )}
    </div>
  )
}

export function DataTable<T extends { id: string }>({
  columns,
  apiUrl,
  onEdit,
  editHref,
  onDelete,
  bulkActions,
  actions,
  searchPlaceholder = 'Buscar',
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

  const clearSelection = () => setSelected(new Set())

  const handleDeleteSelected = () => {
    if (onDelete && selected.size > 0) {
      onDelete(Array.from(selected))
      clearSelection()
    }
  }

  const setPage = (page: number) => setPagination(p => ({ ...p, page }))
  const setLimit = (limit: number) => setPagination(p => ({ ...p, limit, page: 1 }))

  // Expose refetch for parent components
  useEffect(() => {
    (window as Record<string, unknown>).__adminTableRefetch = fetchData
    return () => { delete (window as Record<string, unknown>).__adminTableRefetch }
  }, [fetchData])

  const hasActions = onEdit || editHref || actions
  const skeletonRows = Math.min(pagination.limit, 8)

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/60 focus:bg-zinc-900 text-sm transition-all"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPagination(p => ({ ...p, page: 1 })) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors z-10">
              <X size={15} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {filters}
          {selected.size > 0 && bulkActions && bulkActions(Array.from(selected), clearSelection)}
          {selected.size > 0 && onDelete && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-colors font-medium"
            >
              <Trash2 size={14} />
              Excluir {selected.size}
            </button>
          )}
        </div>
      </div>

      {/* Mobile cards (only when renderMobileCard is provided) */}
      {renderMobileCard && (
        <div className="md:hidden rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/30">
          {loading ? (
            <div className="divide-y divide-zinc-800/50">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="w-10 h-14 rounded-lg bg-zinc-800 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-800 rounded-md animate-pulse w-2/3" />
                    <div className="h-3 bg-zinc-800 rounded-md animate-pulse w-1/2" />
                    <div className="h-3 bg-zinc-800 rounded-md animate-pulse w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-600">
              <SearchX size={36} strokeWidth={1.5} />
              <p className="text-sm">Nenhum resultado encontrado</p>
            </div>
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
      <div className={`overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/20 ${renderMobileCard ? 'hidden md:block' : ''}`}>
        <table className="min-w-max w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {onDelete && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selected.size === data.length}
                    onChange={toggleSelectAll}
                    className="rounded border-zinc-700 bg-zinc-900 accent-purple-500"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-zinc-500 whitespace-nowrap ${
                    col.sortable ? 'cursor-pointer hover:text-zinc-300 select-none' : ''
                  } ${col.className ?? ''}`}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      <ArrowUpDown
                        size={12}
                        className={sortBy === col.key ? 'text-purple-400' : 'text-zinc-700'}
                      />
                    )}
                  </span>
                </th>
              ))}
              {hasActions && (
                <th className="sticky right-0 bg-zinc-950 border-l border-zinc-800/50 px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-zinc-500 shadow-[-8px_0_16px_rgba(0,0,0,0.5)]">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {onDelete && (
                    <td className="px-4 py-3">
                      <div className="w-4 h-4 bg-zinc-800 rounded" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 ${col.className ?? ''}`}>
                      <div
                        className="h-4 bg-zinc-800 rounded-md"
                        style={{ width: `${55 + ((i * 37 + col.key.length * 13) % 40)}%` }}
                      />
                    </td>
                  ))}
                  {hasActions && (
                    <td className="sticky right-0 bg-zinc-950 border-l border-zinc-800/50 px-4 py-3">
                      <div className="w-16 h-6 bg-zinc-800 rounded-lg ml-auto" />
                    </td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onDelete ? 1 : 0) + (hasActions ? 1 : 0)}>
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-600">
                    <SearchX size={36} strokeWidth={1.5} />
                    <p className="text-sm">Nenhum resultado encontrado</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className={`hover:bg-zinc-800/30 transition-colors ${selected.has(item.id) ? 'bg-purple-500/5' : ''}`}>
                  {onDelete && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-zinc-700 bg-zinc-900 accent-purple-500"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-zinc-300 ${col.className ?? ''}`}>
                      {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="sticky right-0 bg-zinc-950 border-l border-zinc-800/50 px-4 py-3 text-right shadow-[-8px_0_16px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center justify-end gap-2">
                        {actions?.(item)}
                        {editHref && (
                          <Link
                            href={editHref(item)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-purple-500/30 text-purple-400 hover:text-white hover:bg-purple-500/20 hover:border-purple-500/50 transition-all font-medium"
                          >
                            Editar
                          </Link>
                        )}
                        {onEdit && !editHref && (
                          <button
                            onClick={() => onEdit(item)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-purple-500/30 text-purple-400 hover:text-white hover:bg-purple-500/20 hover:border-purple-500/50 transition-all font-medium"
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
      <div className="flex items-center justify-between gap-3 text-sm text-zinc-500">
        {/* Left: total + per-page selector */}
        <div className="flex items-center gap-3">
          <span className="tabular-nums whitespace-nowrap">
            {pagination.total.toLocaleString('pt-BR')} resultado{pagination.total !== 1 ? 's' : ''}
          </span>
          <select
            value={pagination.limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 px-2 py-1.5 focus:outline-none focus:border-zinc-600 cursor-pointer hover:border-zinc-700 transition-colors"
          >
            {PAGE_SIZE_OPTIONS.map(n => (
              <option key={n} value={n}>{n} / pág</option>
            ))}
          </select>
        </div>

        {/* Center: page numbers */}
        <PageNumbers
          current={pagination.page}
          total={pagination.totalPages}
          onChange={setPage}
        />

        {/* Right: prev/next */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-zinc-400 text-xs tabular-nums px-1 sm:hidden">
            {pagination.page}/{pagination.totalPages || 1}
          </span>
          <button
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="p-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Próxima página"
          >
            <ChevronRight size={16} />
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
