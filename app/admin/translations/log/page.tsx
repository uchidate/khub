'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface LogEntry {
  id: string
  entityType: string
  entityId: string
  field: string
  locale: string
  previousValue: string | null
  newValue: string
  changedBy: string
  source: string
  createdAt: string
}

const ENTITY_LABELS: Record<string, string> = {
  artist: 'Artista',
  group: 'Grupo',
  production: 'Produção',
  news: 'Notícia',
}

const FIELD_LABELS: Record<string, string> = {
  bio: 'bio',
  synopsis: 'sinopse',
  tagline: 'tagline',
  title: 'título',
  contentMd: 'conteúdo',
}

export default function TranslationLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '50' })
    if (entityTypeFilter) params.set('entityType', entityTypeFilter)
    const res = await fetch(`/api/admin/translations/log?${params}`)
    if (res.ok) {
      const data = await res.json()
      setLogs(data.logs)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    }
    setLoading(false)
  }, [page, entityTypeFilter])

  useEffect(() => { setPage(1) }, [entityTypeFilter])
  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <AdminLayout title="Log de Traduções">
      <div className="max-w-5xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/translations"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" /> Traduções
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <select
              value={entityTypeFilter}
              onChange={e => setEntityTypeFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os tipos</option>
              <option value="artist">Artistas</option>
              <option value="group">Grupos</option>
              <option value="production">Produções</option>
              <option value="news">Notícias</option>
            </select>
            <button
              onClick={fetchLogs}
              className="p-1.5 text-gray-400 hover:text-gray-600"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">{total} entradas</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Nenhum registro encontrado</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Campo</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuário</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Conteúdo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-gray-600">
                          {ENTITY_LABELS[log.entityType] ?? log.entityType}
                        </span>
                        <Link
                          href={`/admin/translations/${log.entityType}/${log.entityId}`}
                          className="text-xs text-blue-500 hover:underline font-mono"
                        >
                          {log.entityId.slice(0, 8)}…
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                        {FIELD_LABELS[log.field] ?? log.field}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {log.changedBy}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="text-gray-700 line-clamp-2 text-xs">{log.newValue}</div>
                      {log.previousValue && (
                        <div className="text-gray-400 line-clamp-1 text-xs mt-0.5">
                          ← {log.previousValue}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
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
