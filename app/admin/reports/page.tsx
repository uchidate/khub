'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { CheckCircle, Eye, XCircle, ExternalLink } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Report {
  id: string
  entityType: string
  entityId: string
  entityName: string
  category: string
  description: string | null
  status: string
  createdAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  wrong_info:   'Informação incorreta',
  wrong_image:  'Imagem errada',
  duplicate:    'Duplicado',
  missing_info: 'Info ausente',
  other:        'Outro',
}

const ENTITY_LABELS: Record<string, { label: string; color: string; href: (id: string) => string }> = {
  artist:     { label: 'Artista',   color: 'bg-purple-500/20 text-purple-400', href: id => `/artists/${id}` },
  production: { label: 'Produção',  color: 'bg-cyan-500/20 text-cyan-400',     href: id => `/productions/${id}` },
  group:      { label: 'Grupo',     color: 'bg-pink-500/20 text-pink-400',      href: id => `/groups/${id}` },
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-orange-500/20 text-orange-400 border-orange-500/30',
  REVIEWED:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  RESOLVED:  'bg-green-500/20 text-green-400 border-green-500/30',
  DISMISSED: 'bg-zinc-700/50 text-zinc-500 border-zinc-600/30',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:   'Pendente',
  REVIEWED:  'Em revisão',
  RESOLVED:  'Resolvido',
  DISMISSED: 'Descartado',
}

const FILTER_TABS = [
  { key: '', label: 'Todos' },
  { key: 'PENDING', label: 'Pendentes' },
  { key: 'REVIEWED', label: 'Em revisão' },
  { key: 'RESOLVED', label: 'Resolvidos' },
  { key: 'DISMISSED', label: 'Descartados' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [reports, setReports] = useState<Report[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [fetchKey, setFetchKey] = useState(0)

  // Fetch on filter/page change
  const fetchReports = useCallback(async (p: number, status: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' })
      if (status) params.set('status', status)
      const res = await fetch(`/api/admin/reports?${params}`)
      if (res.ok) {
        const data = await res.json()
        setReports(data.items)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial + re-fetch
  useState(() => {
    fetchReports(page, statusFilter)
  })

  const refetch = () => {
    setFetchKey(k => k + 1)
    fetchReports(page, statusFilter)
  }

  const handleFilterChange = (status: string) => {
    setStatusFilter(status)
    setPage(1)
    fetchReports(1, status)
  }

  const handlePageChange = (p: number) => {
    setPage(p)
    fetchReports(p, statusFilter)
  }

  const handleUpdateStatus = async (id: string, status: 'REVIEWED' | 'RESOLVED' | 'DISMISSED') => {
    if (updatingId) return
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) refetch()
    } finally {
      setUpdatingId(null)
    }
  }

  // Suppress unused warning
  void fetchKey

  return (
    <AdminLayout title="Reportes">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-zinc-400">
            Problemas reportados por usuários nas páginas públicas
            {total > 0 && <span className="ml-2 text-zinc-500">({total} total)</span>}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 border-b border-white/5 pb-0">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-b-2 -mb-px ${
                statusFilter === tab.key
                  ? 'text-white border-purple-500 bg-purple-500/10'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-zinc-500">Carregando...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">Nenhum report encontrado</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900/80 text-zinc-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-black">Tipo</th>
                  <th className="px-4 py-3 text-left font-black">Entidade</th>
                  <th className="px-4 py-3 text-left font-black">Categoria</th>
                  <th className="px-4 py-3 text-left font-black">Descrição</th>
                  <th className="px-4 py-3 text-left font-black">Status</th>
                  <th className="px-4 py-3 text-left font-black">Data</th>
                  <th className="px-4 py-3 text-left font-black">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reports.map(report => {
                  const entity = ENTITY_LABELS[report.entityType]
                  return (
                    <tr key={report.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${entity?.color ?? 'text-zinc-400'}`}>
                          {entity?.label ?? report.entityType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-medium truncate max-w-[160px]">{report.entityName}</span>
                          {entity && (
                            <Link href={entity.href(report.entityId)} target="_blank" className="text-zinc-600 hover:text-zinc-400">
                              <ExternalLink size={12} />
                            </Link>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {CATEGORY_LABELS[report.category] ?? report.category}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 max-w-[200px] truncate">
                        {report.description || <span className="text-zinc-700 italic text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${STATUS_STYLES[report.status] ?? ''}`}>
                          {STATUS_LABELS[report.status] ?? report.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 text-xs whitespace-nowrap">
                        {formatDate(report.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {report.status === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateStatus(report.id, 'REVIEWED')}
                              disabled={updatingId === report.id}
                              title="Marcar como em revisão"
                              className="p-1.5 rounded hover:bg-blue-500/20 text-zinc-600 hover:text-blue-400 transition-colors disabled:opacity-40"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                          {report.status !== 'RESOLVED' && report.status !== 'DISMISSED' && (
                            <button
                              onClick={() => handleUpdateStatus(report.id, 'RESOLVED')}
                              disabled={updatingId === report.id}
                              title="Marcar como resolvido"
                              className="p-1.5 rounded hover:bg-green-500/20 text-zinc-600 hover:text-green-400 transition-colors disabled:opacity-40"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          {report.status !== 'DISMISSED' && (
                            <button
                              onClick={() => handleUpdateStatus(report.id, 'DISMISSED')}
                              disabled={updatingId === report.id}
                              title="Descartar report"
                              className="p-1.5 rounded hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-40"
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <span className="text-zinc-500 text-sm">Página {page} de {totalPages}</span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
