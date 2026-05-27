'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { AdminSearchInput } from '@/components/admin/AdminSearchInput'

/**
 * AdminFilters
 *
 * Sistema de filtros persistidos na URL para páginas de lista do admin.
 * Cada mudança de filtro atualiza a URL sem refresh full-page (client navigation).
 *
 * Uso:
 *   <AdminFilters.Root>
 *     <AdminFilters.Search placeholder="Buscar artistas..." />
 *     <AdminFilters.Select name="status" label="Status" options={[...]} />
 *     <AdminFilters.Toggle name="hidden" label="Incluir ocultos" />
 *   </AdminFilters.Root>
 */

// ─── Hook utilitário ──────────────────────────────────────────────────────────

export function useAdminFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      // Ao mudar filtro, volta para página 1
      if (key !== 'page') params.delete('page')
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [router, pathname, searchParams]
  )

  const getParam = useCallback(
    (key: string, fallback = '') => searchParams.get(key) ?? fallback,
    [searchParams]
  )

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false })
    })
  }, [router, pathname])

  const hasFilters = searchParams.size > 0 && !(searchParams.size === 1 && searchParams.has('page'))

  return { setParam, getParam, clearAll, hasFilters, isPending }
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function Root({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      {children}
    </div>
  )
}

// ─── Search ───────────────────────────────────────────────────────────────────

function Search({
  name = 'q',
  placeholder = 'Buscar...',
  className,
}: {
  name?: string
  placeholder?: string
  className?: string
}) {
  const { setParam, getParam } = useAdminFilter()
  const urlValue = getParam(name)
  const [value, setValue] = useState(urlValue)

  // Sync local state when URL changes externally (e.g., clearAll)
  useEffect(() => { setValue(urlValue) }, [urlValue])

  const commit = (v: string) => setParam(name, v || null)

  return (
    <AdminSearchInput
      value={value}
      onChange={v => { setValue(v); if (!v) commit(v) }}
      onClear={() => commit('')}
      onBlur={e => commit(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value) }}
      placeholder={placeholder}
      className={`min-w-[180px] ${className ?? ''}`}
    />
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────

function Select({
  name,
  label,
  options,
}: {
  name: string
  label: string
  options: Array<{ value: string; label: string }>
}) {
  const { setParam, getParam } = useAdminFilter()
  const value = getParam(name)

  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => setParam(name, e.target.value || null)}
        className="h-8 pl-3 pr-7 bg-surface border border-border hover:border-border rounded-lg text-sm text-foreground outline-none focus:border-accent/50 transition-colors appearance-none cursor-pointer"
      >
        <option value="">{label}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  name,
  label,
}: {
  name: string
  label: string
}) {
  const { setParam, getParam } = useAdminFilter()
  const active = getParam(name) === '1'

  return (
    <button
      onClick={() => setParam(name, active ? null : '1')}
      className={`h-8 px-3 rounded-full text-xs font-semibold transition-all ${
        active
          ? 'bg-accent text-white'
          : 'bg-surface text-muted hover:bg-surface-hover hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )
}

// ─── ClearButton ─────────────────────────────────────────────────────────────

function ClearButton() {
  const { clearAll, hasFilters } = useAdminFilter()
  if (!hasFilters) return null

  return (
    <button
      onClick={clearAll}
      className="flex items-center gap-1 h-8 px-3 text-xs text-muted hover:text-foreground border border-border hover:border-border rounded-lg transition-colors"
    >
      <X size={12} />
      Limpar filtros
    </button>
  )
}

// ─── ActiveFilters (chips) ────────────────────────────────────────────────────

function ActiveChips({
  labels,
}: {
  labels: Record<string, (value: string) => string>
}) {
  const { setParam } = useAdminFilter()
  const searchParams = useSearchParams()
  const chips: Array<{ key: string; value: string; label: string }> = []

  searchParams.forEach((value, key) => {
    if (key === 'page') return
    const labelFn = labels[key]
    if (labelFn) chips.push({ key, value, label: labelFn(value) })
  })

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map(chip => (
        <span
          key={chip.key}
          className="flex items-center gap-1 px-2 py-0.5 bg-accent-soft border border-accent/20 text-accent text-xs rounded-full"
        >
          {chip.label}
          <button
            onClick={() => setParam(chip.key, null)}
            className="text-accent/70 hover:text-accent transition-colors"
          >
            <X size={11} />
          </button>
        </span>
      ))}
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export function AdminPagination({
  total,
  pageSize = 30,
  className,
}: {
  total: number
  pageSize?: number
  className?: string
}) {
  const { setParam, getParam } = useAdminFilter()
  const page = parseInt(getParam('page', '1'))
  const totalPages = Math.ceil(total / pageSize)

  if (totalPages <= 1) return null

  return (
    <div className={`flex items-center justify-between px-4 py-3 border-t border-border ${className ?? ''}`}>
      <span className="text-xs text-muted">{total.toLocaleString('pt-BR')} itens</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setParam('page', String(page - 1))}
          disabled={page <= 1}
          className="px-3 py-1 text-xs border border-border rounded-lg disabled:opacity-30 hover:bg-surface-hover text-muted transition-colors"
        >
          ← Anterior
        </button>
        <span className="text-xs text-muted tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => setParam('page', String(page + 1))}
          disabled={page >= totalPages}
          className="px-3 py-1 text-xs border border-border rounded-lg disabled:opacity-30 hover:bg-surface-hover text-muted transition-colors"
        >
          Próxima →
        </button>
      </div>
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const AdminFilters = { Root, Search, Select, Toggle, ClearButton, ActiveChips }
