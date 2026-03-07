'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { CheckCircle, Eye, XCircle, ExternalLink, RefreshCw, Flag } from 'lucide-react'

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

interface Stats {
  total: number
  pending: number
  reviewed: number
  resolved: number
  dismissed: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  wrong_info:   'Informação incorreta',
  wrong_image:  'Imagem errada',
  duplicate:    'Duplicado',
  missing_info: 'Info ausente',
  other:        'Outro',
}

const CATEGORY_COLORS: Record<string, string> = {
  wrong_info:   'bg-orange-500/15 text-orange-400 border-orange-500/20',
  wrong_image:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  duplicate:    'bg-red-500/15 text-red-400 border-red-500/20',
  missing_info: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  other:        'bg-zinc-700/50 text-zinc-400 border-zinc-600/20',
}

const ENTITY_META: Record<string, { label: string; color: string; href: (id: string) => string }> = {
  artist:     { label: 'Artista',  color: 'bg-purple-500/20 text-purple-400', href: id => `/artists/${id}` },
  production: { label: 'Produção', color: 'bg-cyan-500/20 text-cyan-400',     href: id => `/productions/${id}` },
  group:      { label: 'Grupo',    color: 'bg-pink-500/20 text-pink-400',      href: id => `/groups/${id}` },
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-orange-500/20 text-orange-400 border-orange-500/30',
  REVIEWED:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  RESOLVED:  'bg-green-500/20 text-green-400 border-green-500/30',
  DISMISSED: 'bg-zinc-700/50 text-zinc-500 border-zinc-600/30',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente', REVIEWED: 'Em revisão', RESOLVED: 'Resolvido', DISMISSED: 'Descartado',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ─── Action buttons ───────────────────────────────────────────────────────────

function ActionButtons({ report, onUpdate, updatingId }: {
  report: Report
  onUpdate: (id: string, status: 'REVIEWED' | 'RESOLVED' | 'DISMISSED') => void
  updatingId: string | null
}) {
  const disabled = updatingId === report.id
  return (
    <div className="flex items-center gap-1">
      {report.status === 'PENDING' && (
        <button onClick={() => onUpdate(report.id, 'REVIEWED')} disabled={disabled}
          title="Marcar como em revisão"
          className="p-1.5 rounded-lg hover:bg-blue-500/20 text-zinc-500 hover:text-blue-400 transition-colors disabled:opacity-40">
          <Eye size={14} />
        </button>
      )}
      {report.status !== 'RESOLVED' && report.status !== 'DISMISSED' && (
        <button onClick={() => onUpdate(report.id, 'RESOLVED')} disabled={disabled}
          title="Marcar como resolvido"
          className="p-1.5 rounded-lg hover:bg-green-500/20 text-zinc-500 hover:text-green-400 transition-colors disabled:opacity-40">
          <CheckCircle size={14} />
        </button>
      )}
      {report.status !== 'DISMISSED' && (
        <button onClick={() => onUpdate(report.id, 'DISMISSED')} disabled={disabled}
          title="Descartar"
          className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-40">
          <XCircle size={14} />
        </button>
      )}
    </div>
  )
}

// ─── Mobile Card ─────────────────────────────────────────────────────────────

function ReportCard({ report, onUpdate, updatingId }: {
  report: Report
  onUpdate: (id: string, status: 'REVIEWED' | 'RESOLVED' | 'DISMISSED') => void
  updatingId: string | null
}) {
  const entity = ENTITY_META[report.entityType]
  return (
    <div className="p-4 border-b border-white/5 last:border-0">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {entity && (
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${entity.color}`}>{entity.label}</span>
          )}
          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${STATUS_STYLES[report.status] ?? ''}`}>
            {STATUS_LABELS[report.status] ?? report.status}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs border ${CATEGORY_COLORS[report.category] ?? 'text-zinc-400'}`}>
            {CATEGORY_LABELS[report.category] ?? report.category}
          </span>
        </div>
        <span className="text-[10px] text-zinc-600 whitespace-nowrap shrink-0">{formatDate(report.createdAt)}</span>
      </div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-white font-medium text-sm">{report.entityName}</span>
        {entity && (
          <Link href={entity.href(report.entityId)} target="_blank" className="text-zinc-600 hover:text-zinc-400 shrink-0">
            <ExternalLink size={12} />
          </Link>
        )}
      </div>
      {report.description && (
        <p className="text-xs text-zinc-500 italic line-clamp-2 mb-2">{report.description}</p>
      )}
      <ActionButtons report={report} onUpdate={onUpdate} updatingId={updatingId} />
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-zinc-900/50 animate-pulse" />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const FILTER_TABS = [
  { key: '',          label: 'Todos' },
  { key: 'PENDING',   label: 'Pendentes' },
  { key: 'REVIEWED',  label: 'Em revisão' },
  { key: 'RESOLVED',  label: 'Resolvidos' },
  { key: 'DISMISSED', label: 'Descartados' },
]

const ENTITY_TABS = [
  { key: '',           label: 'Todos' },
  { key: 'artist',     label: 'Artistas' },
  { key: 'production', label: 'Produções' },
  { key: 'group',      label: 'Grupos' },
]

export default function ReportsPage() {
  const [statusFilter, setStatusFilter]   = useState('')
  const [entityFilter, setEntityFilter]   = useState('')
  const [reports, setReports]             = useState<Report[]>([])
  const [stats, setStats]                 = useState<Stats | null>(null)
  const [total, setTotal]                 = useState(0)
  const [page, setPage]                   = useState(1)
  const [totalPages, setTotalPages]       = useState(1)
  const [loading, setLoading]             = useState(true)
  const [updatingId, setUpdatingId]       = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reports?stats=1')
      if (res.ok) setStats(await res.json())
    } catch { /* ignore */ }
  }, [])

  const fetchReports = useCallback(async (p: number, status: string, entity: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' })
      if (status) params.set('status', status)
      if (entity) params.set('entityType', entity)
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

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { fetchReports(page, statusFilter, entityFilter) }, [fetchReports, page, statusFilter, entityFilter])

  const handleFilterChange = (status: string) => { setStatusFilter(status); setPage(1) }
  const handleEntityChange = (entity: string) => { setEntityFilter(entity); setPage(1) }

  const handleUpdateStatus = async (id: string, status: 'REVIEWED' | 'RESOLVED' | 'DISMISSED') => {
    if (updatingId) return
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        await fetchReports(page, statusFilter, entityFilter)
        await fetchStats()
      }
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <AdminLayout title="Reportes">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 -mt-6 flex-wrap">
          <p className="text-zinc-400 text-sm">Problemas reportados por usuários nas páginas públicas</p>
          <button
            onClick={() => { fetchReports(page, statusFilter, entityFilter); fetchStats() }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors text-sm"
          >
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Total',       value: stats.total,     color: 'text-zinc-300' },
              { label: 'Pendentes',   value: stats.pending,   color: 'text-orange-400' },
              { label: 'Em revisão',  value: stats.reviewed,  color: 'text-blue-400' },
              { label: 'Resolvidos',  value: stats.resolved,  color: 'text-green-400' },
              { label: 'Descartados', value: stats.dismissed, color: 'text-zinc-500' },
            ].map(s => (
              <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          {/* Status tabs */}
          <div className="flex gap-1 flex-wrap">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleFilterChange(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === tab.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {tab.label}
                {tab.key === 'PENDING' && stats?.pending ? (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${statusFilter === tab.key ? 'bg-purple-500/50' : 'bg-orange-500/20 text-orange-400'}`}>
                    {stats.pending}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {/* Entity type tabs */}
          <div className="flex gap-1 flex-wrap">
            <span className="text-xs text-zinc-600 self-center mr-1">Tipo:</span>
            {ENTITY_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleEntityChange(tab.key)}
                className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                  entityFilter === tab.key
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <Skeleton />
        ) : reports.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/30 rounded-2xl border border-zinc-800">
            <Flag size={40} className="text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 font-medium">Nenhum reporte encontrado</p>
            <p className="text-zinc-600 text-sm mt-1">Tente ajustar os filtros</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/30">
              {reports.map(report => (
                <ReportCard key={report.id} report={report} onUpdate={handleUpdateStatus} updatingId={updatingId} />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/30">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900/80 text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">Tipo</th>
                    <th className="px-4 py-3 text-left font-bold">Entidade</th>
                    <th className="px-4 py-3 text-left font-bold">Categoria</th>
                    <th className="px-4 py-3 text-left font-bold">Descrição</th>
                    <th className="px-4 py-3 text-left font-bold">Status</th>
                    <th className="px-4 py-3 text-left font-bold">Data</th>
                    <th className="px-4 py-3 text-left font-bold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {reports.map(report => {
                    const entity = ENTITY_META[report.entityType]
                    return (
                      <tr key={report.id} className={`hover:bg-white/[0.02] transition-colors ${
                        report.status === 'PENDING' ? 'bg-orange-500/[0.03]' : ''
                      }`}>
                        <td className="px-4 py-3">
                          {entity && (
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${entity.color}`}>
                              {entity.label}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-medium truncate max-w-[150px]">{report.entityName}</span>
                            {entity && (
                              <Link href={entity.href(report.entityId)} target="_blank" className="text-zinc-600 hover:text-purple-400 transition-colors">
                                <ExternalLink size={12} />
                              </Link>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs border ${CATEGORY_COLORS[report.category] ?? 'text-zinc-400'}`}>
                            {CATEGORY_LABELS[report.category] ?? report.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-500 max-w-[180px]">
                          <span className="line-clamp-2 text-xs">{report.description || <span className="text-zinc-700 italic">—</span>}</span>
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
                          <ActionButtons report={report} onUpdate={handleUpdateStatus} updatingId={updatingId} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-zinc-600 text-right">
              {total} reporte{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            >
              ← Anterior
            </button>
            <span className="text-sm text-zinc-500">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
