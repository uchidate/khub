'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
    RefreshCw, Trash2, AlertTriangle, CheckCircle2, ServerCrash,
    ChevronDown, ChevronRight, Search, X, Globe, Clock, Layers, Info,
} from 'lucide-react'

interface ServerLogEntry {
    id: string
    createdAt: string
    method: string
    path: string
    status: number
    duration: number
    error: string | null
    body: string | null
    userAgent: string | null
    ip: string | null
}

interface Counts {
    errors: number
    fivexx: number
    fourxx: number
    all: number
}

const STATUS_FILTERS = [
    { value: 'errors', label: 'Todos erros' },
    { value: '5xx',    label: '5xx Servidor' },
    { value: '4xx',    label: '4xx Cliente' },
    { value: 'all',    label: 'Todos' },
]

const METHOD_COLORS: Record<string, string> = {
    GET: 'text-blue-400', POST: 'text-green-400',
    PUT: 'text-yellow-400', PATCH: 'text-orange-400',
    DELETE: 'text-red-400',
}

function statusBadge(status: number) {
    if (status >= 500) return 'text-red-300 bg-red-950/60 border border-red-700/50'
    if (status >= 400) return 'text-orange-300 bg-orange-950/60 border border-orange-700/50'
    if (status >= 300) return 'text-yellow-300 bg-yellow-950/60 border border-yellow-700/50'
    return 'text-green-300 bg-green-950/60 border border-green-700/50'
}

function leftBorder(status: number) {
    if (status >= 500) return 'border-l-red-600/60'
    if (status >= 400) return 'border-l-orange-600/60'
    return 'border-l-zinc-700/40'
}

function durationColor(ms: number) {
    if (ms >= 3000) return 'text-red-400'
    if (ms >= 1000) return 'text-orange-400'
    if (ms >= 500)  return 'text-yellow-500'
    return 'text-zinc-500'
}

function formatTimeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60)   return `${diff}s`
    if (diff < 3600) return `${Math.floor(diff / 60)}min`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function parseUserAgent(ua: string | null): string {
    if (!ua) return '—'
    if (/curl/i.test(ua))       return 'cURL'
    if (/PostmanRuntime/i.test(ua)) return 'Postman'
    if (/python/i.test(ua))     return 'Python'
    if (/Googlebot/i.test(ua))  return 'Googlebot'
    if (/bot|crawl|spider/i.test(ua)) return 'Bot'
    if (/iPhone/i.test(ua))     return 'iOS'
    if (/Android/i.test(ua))    return 'Android'
    if (/Chrome/i.test(ua))     return 'Chrome'
    if (/Firefox/i.test(ua))    return 'Firefox'
    if (/Safari/i.test(ua))     return 'Safari'
    return ua.slice(0, 30)
}

export default function ServerLogsPage() {
    const [logs, setLogs]         = useState<ServerLogEntry[]>([])
    const [total, setTotal]       = useState(0)
    const [pages, setPages]       = useState(1)
    const [page, setPage]         = useState(1)
    const [counts, setCounts]     = useState<Counts>({ errors: 0, fivexx: 0, fourxx: 0, all: 0 })
    const [loading, setLoading]   = useState(true)
    const [filter, setFilter]     = useState('errors')
    const [search, setSearch]     = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [expanded, setExpanded] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [clearMenu, setClearMenu] = useState(false)
    const [autoRefresh, setAutoRefresh] = useState(false)
    const clearMenuRef = useRef<HTMLDivElement>(null)

    const fetchLogs = useCallback(async (p = page) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ status: filter, limit: '100', page: String(p) })
            if (search) params.set('path', search)
            const res  = await fetch(`/api/admin/server-logs?${params}`)
            const json = await res.json()
            setLogs(json.logs ?? [])
            setTotal(json.total ?? 0)
            setPages(json.pages ?? 1)
            setPage(json.page ?? 1)
            if (json.counts) setCounts(json.counts)
        } finally {
            setLoading(false)
        }
    }, [filter, search, page])

    useEffect(() => { fetchLogs(1) }, [filter, search])
    useEffect(() => { fetchLogs(page) }, [page]) // eslint-disable-line

    // Auto-refresh a cada 30s
    useEffect(() => {
        if (!autoRefresh) return
        const id = setInterval(() => fetchLogs(page), 30000)
        return () => clearInterval(id)
    }, [autoRefresh, fetchLogs, page])

    // Fechar menu ao clicar fora
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (clearMenuRef.current && !clearMenuRef.current.contains(e.target as Node)) {
                setClearMenu(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    async function clearLogs(days: number) {
        if (!confirm(days === 0 ? 'Apagar TODOS os logs?' : `Apagar logs com mais de ${days} dias?`)) return
        setClearMenu(false)
        setDeleting(true)
        await fetch(`/api/admin/server-logs?days=${days}`, { method: 'DELETE' })
        setDeleting(false)
        fetchLogs(1)
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setSearch(searchInput)
        setPage(1)
    }

    return (
        <AdminLayout title="Server Logs">
            <div className="space-y-5">

                {/* Coverage note */}
                <div className="flex items-start gap-3 bg-blue-950/30 border border-blue-800/40 rounded-xl px-4 py-3 text-xs text-blue-300">
                    <Info size={14} className="flex-shrink-0 mt-0.5 text-blue-400" />
                    <div className="space-y-1">
                        <p className="font-bold text-blue-200">Cobertura de logs</p>
                        <p className="text-blue-300/80">
                            Este painel captura erros 4xx/5xx das rotas monitoradas com <code className="bg-blue-900/40 px-1 rounded font-mono">withLogging</code>.
                            Erros <strong>502 / 504</strong> são gerados pelo nginx (proxy reverso) antes de chegar ao app — <strong>não aparecem aqui</strong>.
                        </p>
                        <p className="text-blue-400/70 font-mono mt-1">
                            Para 502/504:{' '}
                            <span className="text-blue-300/70">ssh root@31.97.255.107 &quot;tail -50 /var/log/nginx/error.log&quot;</span>
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-zinc-500 font-medium">Total</p>
                            <Layers size={14} className="text-zinc-600" />
                        </div>
                        <p className="text-2xl font-black text-white">{counts.all.toLocaleString('pt-BR')}</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">registros no banco</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-zinc-500 font-medium">Todos erros</p>
                            <AlertTriangle size={14} className="text-orange-500" />
                        </div>
                        <p className="text-2xl font-black text-orange-400">{counts.errors.toLocaleString('pt-BR')}</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">4xx + 5xx</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-zinc-500 font-medium">Server errors</p>
                            <ServerCrash size={14} className="text-red-500" />
                        </div>
                        <p className="text-2xl font-black text-red-400">{counts.fivexx.toLocaleString('pt-BR')}</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">status 5xx</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-zinc-500 font-medium">Bad requests</p>
                            <AlertTriangle size={14} className="text-yellow-500" />
                        </div>
                        <p className="text-2xl font-black text-yellow-400">{counts.fourxx.toLocaleString('pt-BR')}</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">status 4xx</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Status filter */}
                    <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                        {STATUS_FILTERS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => { setFilter(opt.value); setPage(1) }}
                                className={`px-3 py-2 text-xs font-bold transition-colors ${
                                    filter === opt.value
                                        ? 'bg-purple-600 text-white'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Path search */}
                    <form onSubmit={handleSearch} className="flex items-center gap-1 flex-1 min-w-[180px] max-w-xs">
                        <div className="relative flex-1">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                            <input
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                placeholder="Filtrar por path..."
                                className="w-full pl-8 pr-8 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
                            />
                            {searchInput && (
                                <button type="button" onClick={() => { setSearchInput(''); setSearch('') }} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Auto-refresh toggle */}
                    <button
                        onClick={() => setAutoRefresh(v => !v)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                            autoRefresh
                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                        }`}
                        title={autoRefresh ? 'Auto-refresh ativo (30s)' : 'Ativar auto-refresh'}
                    >
                        <RefreshCw size={12} className={autoRefresh ? 'animate-spin' : ''} />
                        {autoRefresh ? '30s' : 'Auto'}
                    </button>

                    {/* Refresh */}
                    <button
                        onClick={() => fetchLogs(page)}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Atualizar</span>
                    </button>

                    {/* Clear dropdown */}
                    <div className="relative ml-auto" ref={clearMenuRef}>
                        <button
                            onClick={() => setClearMenu(v => !v)}
                            disabled={deleting}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-950/40 border border-red-800/40 text-red-400 hover:bg-red-900/40 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                        >
                            <Trash2 size={12} />
                            <span className="hidden sm:inline">Limpar</span>
                            <ChevronDown size={12} />
                        </button>
                        {clearMenu && (
                            <div className="absolute right-0 top-full mt-1 z-20 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden w-44">
                                {[
                                    { label: 'Mais de 7 dias', days: 7 },
                                    { label: 'Mais de 30 dias', days: 30 },
                                    { label: 'Tudo', days: 0 },
                                ].map(({ label, days }) => (
                                    <button
                                        key={days}
                                        onClick={() => clearLogs(days)}
                                        className={`w-full flex items-center gap-2 px-4 py-3 text-xs font-bold transition-colors border-b border-zinc-800 last:border-0 ${
                                            days === 0
                                                ? 'text-red-400 hover:bg-red-950/30'
                                                : 'text-zinc-300 hover:bg-zinc-800'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Count */}
                <p className="text-xs text-zinc-600">
                    {total.toLocaleString('pt-BR')} registro{total !== 1 ? 's' : ''}
                    {search && <span className="ml-1 text-purple-400">com &ldquo;{search}&rdquo;</span>}
                    {pages > 1 && <span> · página {page} de {pages}</span>}
                </p>

                {/* Log list */}
                {loading ? (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/50 last:border-0">
                                <div className="w-10 h-5 rounded bg-zinc-800 animate-pulse" />
                                <div className="w-10 h-4 rounded bg-zinc-800 animate-pulse" />
                                <div className="flex-1 h-4 rounded bg-zinc-800 animate-pulse" />
                                <div className="w-12 h-4 rounded bg-zinc-800 animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 text-center py-16">
                        <CheckCircle2 size={36} className="mx-auto mb-3 text-green-700 opacity-60" />
                        <p className="text-zinc-500 text-sm">Nenhum log encontrado</p>
                        {search && <p className="text-zinc-600 text-xs mt-1">para o filtro &ldquo;{search}&rdquo;</p>}
                    </div>
                ) : (
                    <div className="rounded-xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800/50">
                        {logs.map(log => (
                            <div key={log.id} className={`border-l-2 ${leftBorder(log.status)}`}>
                                {/* Row */}
                                <button
                                    onClick={() => setExpanded(e => e === log.id ? null : log.id)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-zinc-900/60 transition-colors"
                                >
                                    {/* Expand indicator */}
                                    <span className="text-zinc-700 flex-shrink-0">
                                        {expanded === log.id
                                            ? <ChevronDown size={12} />
                                            : <ChevronRight size={12} />
                                        }
                                    </span>

                                    {/* Status */}
                                    <span className={`flex-shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded tabular-nums ${statusBadge(log.status)}`}>
                                        {log.status}
                                    </span>

                                    {/* Method */}
                                    <span className={`flex-shrink-0 text-[10px] font-black w-10 ${METHOD_COLORS[log.method] ?? 'text-zinc-400'}`}>
                                        {log.method}
                                    </span>

                                    {/* Path */}
                                    <span className="flex-1 text-xs text-zinc-300 font-mono truncate min-w-0">
                                        {log.path}
                                    </span>

                                    {/* Duration */}
                                    <span className={`flex-shrink-0 text-[10px] tabular-nums font-mono ${durationColor(log.duration)}`}>
                                        {log.duration}ms
                                    </span>

                                    {/* UA (desktop) */}
                                    <span className="hidden lg:block flex-shrink-0 text-[10px] text-zinc-600 w-16 truncate text-right">
                                        {parseUserAgent(log.userAgent)}
                                    </span>

                                    {/* Time */}
                                    <span
                                        className="flex-shrink-0 text-[10px] text-zinc-600 w-10 text-right"
                                        title={new Date(log.createdAt).toLocaleString('pt-BR')}
                                    >
                                        {formatTimeAgo(log.createdAt)}
                                    </span>
                                </button>

                                {/* Expanded */}
                                {expanded === log.id && (
                                    <div className="border-t border-zinc-800/60 px-4 py-4 bg-black/20 space-y-3">
                                        {/* Error message */}
                                        {log.error && (
                                            <div>
                                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1.5">Erro / Resposta</p>
                                                <pre className="text-xs text-orange-300 font-mono whitespace-pre-wrap break-all bg-orange-950/20 border border-orange-900/40 rounded-lg p-3 max-h-64 overflow-y-auto">
                                                    {log.error}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Meta grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                                            <div className="flex items-center gap-2">
                                                <Globe size={11} className="text-zinc-600 flex-shrink-0" />
                                                <span className="text-zinc-600">IP:</span>
                                                <span className="text-zinc-300 font-mono">{log.ip ?? '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={11} className="text-zinc-600 flex-shrink-0" />
                                                <span className="text-zinc-600">Data:</span>
                                                <span className="text-zinc-300">{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                                            </div>
                                            <div className="flex items-start gap-2 sm:col-span-2">
                                                <span className="text-zinc-600 flex-shrink-0">UA:</span>
                                                <span className="text-zinc-400 break-all">{log.userAgent ?? '—'}</span>
                                            </div>
                                            {log.body && log.body !== log.error && (
                                                <div className="sm:col-span-2">
                                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Request Body</p>
                                                    <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap break-all bg-zinc-900 border border-zinc-800 rounded p-2">
                                                        {log.body}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pages > 1 && (
                    <div className="flex items-center justify-between text-xs">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none font-bold transition-colors"
                        >
                            ← Anterior
                        </button>
                        <span className="text-zinc-500">{page} / {pages}</span>
                        <button
                            onClick={() => setPage(p => Math.min(pages, p + 1))}
                            disabled={page >= pages}
                            className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none font-bold transition-colors"
                        >
                            Próxima →
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
