'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { AdminTableSkeleton, AdminEmptyState } from '@/components/admin'
import { ArrowLeft, RefreshCw, ChevronDown, ClipboardList } from 'lucide-react'
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

const SOURCE_STYLES: Record<string, string> = {
  ai:     'bg-purple-900/40 text-purple-400 border-purple-700/30',
  manual: 'bg-surface text-muted border-border',
  tmdb:   'bg-blue-900/40 text-blue-400 border-blue-700/30',
}

export default function TranslationLogPage() {
  const toast = useAdminToast()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (entityTypeFilter) params.set('entityType', entityTypeFilter)
      const res = await fetch(`/api/admin/translations/log?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [page, entityTypeFilter, toast])

  useEffect(() => { setPage(1) }, [entityTypeFilter])
  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <AdminLayout title="Log de Traduções" subtitle="Histórico de todas as traduções automáticas e manuais aplicadas">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/admin/translations"
            className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Traduções
          </Link>
          <div className="ml-auto flex items-center gap-3">
            {/* Filtro de tipo */}
            <div className="relative">
              <select
                value={entityTypeFilter}
                onChange={e => setEntityTypeFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-purple-500/50 cursor-pointer"
              >
                <option value="">Todos os tipos</option>
                <option value="artist">Artistas</option>
                <option value="group">Grupos</option>
                <option value="production">Produções</option>
                <option value="news">Notícias</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
            </div>
            <button
              onClick={fetchLogs}
              className="p-1.5 text-muted hover:text-muted transition-colors rounded-lg hover:bg-surface"
              title="Recarregar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-widest">
              Histórico
            </span>
            <span className="text-xs text-muted">{total} entradas</span>
          </div>

          {loading ? (
            <AdminTableSkeleton rows={8} />
          ) : logs.length === 0 ? (
            <AdminEmptyState
              icon={<ClipboardList className="w-8 h-8" />}
              title="Nenhum registro encontrado"
              size="sm"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2.5 text-[11px] font-bold text-muted uppercase tracking-widest whitespace-nowrap">Data</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-bold text-muted uppercase tracking-widest">Tipo</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-bold text-muted uppercase tracking-widest">Campo</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-bold text-muted uppercase tracking-widest">Fonte</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-bold text-muted uppercase tracking-widest">Usuário</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-bold text-muted uppercase tracking-widest">Conteúdo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-surface transition-colors">
                      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap font-mono tabular-nums">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium text-foreground">
                            {ENTITY_LABELS[log.entityType] ?? log.entityType}
                          </span>
                          <Link
                            href={`/admin/translations/${log.entityType}/${log.entityId}`}
                            className="text-xs text-purple-400 hover:text-purple-300 hover:underline font-mono transition-colors"
                          >
                            {log.entityId.slice(0, 8)}…
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-surface border border-border px-1.5 py-0.5 rounded text-muted">
                          {FIELD_LABELS[log.field] ?? log.field}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {log.source ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${SOURCE_STYLES[log.source] ?? 'bg-surface text-muted border-border'}`}>
                            {log.source}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                        {log.changedBy}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="text-foreground line-clamp-2 text-xs leading-relaxed">{log.newValue}</div>
                        {log.previousValue && (
                          <div className="text-muted line-clamp-1 text-xs mt-0.5">
                            ← {log.previousValue}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted">Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-xs border border-border rounded-lg disabled:opacity-40 hover:bg-surface text-muted transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-xs border border-border rounded-lg disabled:opacity-40 hover:bg-surface text-muted transition-colors"
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
