'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Search, ChevronRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'

type EntityType = 'artist' | 'group' | 'production' | 'news'
type StatusFilter = '' | 'pending' | 'draft' | 'approved'

interface Stats {
  artist:     { total: number; translated: number }
  group:      { total: number; translated: number }
  production: { total: number; translated: number }
  news:       { total: number; translated: number }
}

interface TranslationItem {
  id: string
  label: string
  fields: string[]
  status: 'pending' | 'draft' | 'approved'
}

const ENTITY_LABELS: Record<EntityType, string> = {
  artist: 'Artistas',
  group: 'Grupos',
  production: 'Produções',
  news: 'Notícias',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  draft: 'Rascunho',
  approved: 'Aprovado',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  draft: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
}

const FIELD_LABELS: Record<string, string> = {
  bio: 'bio',
  synopsis: 'sinopse',
  tagline: 'tagline',
  title: 'título',
  contentMd: 'conteúdo',
}

export default function TranslationsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeTab, setActiveTab] = useState<EntityType>('artist')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [q, setQ] = useState('')
  const [items, setItems] = useState<TranslationItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    const res = await fetch('/api/admin/translations/stats')
    if (res.ok) setStats(await res.json())
    setStatsLoading(false)
  }, [])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      entityType: activeTab,
      page: String(page),
      limit: '30',
    })
    if (statusFilter) params.set('status', statusFilter)
    if (q) params.set('q', q)
    const res = await fetch(`/api/admin/translations/list?${params}`)
    if (res.ok) {
      const data = await res.json()
      setItems(data.items)
      setTotal(data.total)
    }
    setLoading(false)
  }, [activeTab, statusFilter, q, page])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { setPage(1) }, [activeTab, statusFilter, q])
  useEffect(() => { fetchItems() }, [fetchItems])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchItems()
  }

  return (
    <AdminLayout title="Traduções">
      <div className="space-y-6">

        {/* Cards de progresso */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['artist', 'group', 'production', 'news'] as EntityType[]).map(type => {
            const s = stats?.[type]
            return (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  activeTab === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium text-gray-600">{ENTITY_LABELS[type]}</div>
                {statsLoading ? (
                  <div className="mt-1 h-6 bg-gray-100 rounded animate-pulse" />
                ) : (
                  <div className="mt-1 text-2xl font-bold text-gray-900">
                    {s?.translated ?? 0}
                    <span className="text-sm font-normal text-gray-400">/{s?.total ?? 0}</span>
                  </div>
                )}
                {s && s.total > 0 && (
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.round((s.translated / s.total) * 100)}%` }}
                    />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Tabs + filtros */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 px-4 pt-4 border-b border-gray-200 flex-wrap">
            {(['artist', 'group', 'production', 'news'] as EntityType[]).map(type => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === type
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {ENTITY_LABELS[type]}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 pb-3">
              <Link
                href="/admin/translations/log"
                className="text-sm text-gray-500 hover:text-gray-700 px-3"
              >
                Log de alterações →
              </Link>
            </div>
          </div>

          <div className="p-4 flex flex-wrap gap-3 items-center border-b border-gray-100">
            {/* Busca */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </form>

            {/* Filtro de status */}
            <div className="flex gap-1">
              {([['', 'Todos'], ['pending', 'Pendentes'], ['draft', 'Rascunho'], ['approved', 'Aprovados']] as [StatusFilter, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setStatusFilter(val)}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    statusFilter === val
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchItems}
              className="ml-auto p-1.5 text-gray-400 hover:text-gray-600"
              title="Recarregar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Lista */}
          {loading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              {statusFilter === 'pending'
                ? `Nenhum ${ENTITY_LABELS[activeTab].toLowerCase().slice(0, -1)} pendente de tradução`
                : 'Nenhum resultado'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map(item => (
                <li key={item.id}>
                  <Link
                    href={`/admin/translations/${activeTab}/${item.id}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{item.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {item.fields.map(f => FIELD_LABELS[f] ?? f).join(', ')}
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status]}`}>
                      {STATUS_LABELS[item.status]}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Paginação */}
          {total > 30 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">{total} itens</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">Página {page}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={items.length < 30}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
