'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminEmptyState, StatCard } from '@/components/admin'
import { AdminButton } from '@/components/admin'
import {
    RefreshCw, Trash2, CheckCircle2,
    ChevronDown, ChevronRight, Search, X, Globe, Clock, Info,
    ShieldAlert,
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

interface NginxGatewayEntry {
    ts: string
    status: number
    method: string
    path: string
    duration: number
    ip: string
    ua: string
}

interface NginxLogsResponse {
    logs: NginxGatewayEntry[]
    counts: { total: number; s502: number; s504: number }
    available: boolean
    message?: string
    error?: string
}

const TABS = [
    { value: 'app',     label: 'App Logs' },
    { value: 'gateway', label: 'Gateway (502/504)' },
]

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
    return 'text-muted'
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
    const [activeTab, setActiveTab] = useState<'app' | 'gateway'>('app')

    // App logs state
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

    // Gateway logs state
    const [gwLogs, setGwLogs]         = useState<NginxGatewayEntry[]>([])
    const [gwCounts, setGwCounts]     = useState({ total: 0, s502: 0, s504: 0 })
    const [gwLoading, setGwLoading]   = useState(false)
    const [gwAvailable, setGwAvailable] = useState<boolean | null>(null)
    const [gwMessage, setGwMessage]   = useState<string | undefined>()
    const [gwExpanded, setGwExpanded] = useState<number | null>(null)

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

    const fetchGwLogs = useCallback(async () => {
        setGwLoading(true)
        try {
            const res  = await fetch('/api/admin/nginx-logs')
            const json = await res.json() as NginxLogsResponse
            setGwLogs(json.logs ?? [])
            setGwCounts(json.counts ?? { total: 0, s502: 0, s504: 0 })
            setGwAvailable(json.available)
            setGwMessage(json.message)
        } finally {
            setGwLoading(false)
        }
    }, [])

    useEffect(() => { fetchLogs(1) }, [filter, search])
    useEffect(() => { fetchLogs(page) }, [page])
    useEffect(() => { if (activeTab === 'gateway') fetchGwLogs() }, [activeTab, fetchGwLogs])

    // Auto-refresh a cada 30s
    useEffect(() => {
        if (!autoRefresh) return
        const id = setInterval(() => {
            if (activeTab === 'app') fetchLogs(page)
            else fetchGwLogs()
        }, 30000)
        return () => clearInterval(id)
    }, [autoRefresh, fetchLogs, fetchGwLogs, activeTab, page])

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

                {/* Tabs */}
                <div className="flex bg-surface border border-border rounded-lg overflow-hidden w-fit">
                    {TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value as 'app' | 'gateway')}
                            className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 ${
                                activeTab === tab.value
                                    ? 'bg-accent text-white'
                                    : 'text-muted hover:text-foreground hover:bg-surface'
                            }`}
                        >
                            {tab.value === 'gateway' && <ShieldAlert size={12} />}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── APP LOGS TAB ── */}
                {activeTab === 'app' && (<>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Total" value={counts.all} color="text-foreground" sub="registros no banco" />
                    <StatCard label="Todos erros" value={counts.errors} color="text-orange-400" sub="4xx + 5xx" />
                    <StatCard label="Server errors" value={counts.fivexx} color="text-red-400" sub="status 5xx" />
                    <StatCard label="Bad requests" value={counts.fourxx} color="text-yellow-400" sub="status 4xx" />
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Status filter */}
                    <div className="flex bg-surface border border-border rounded-lg overflow-hidden flex-shrink-0">
                        {STATUS_FILTERS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => { setFilter(opt.value); setPage(1) }}
                                className={`px-3 py-2 text-xs font-bold transition-colors ${
                                    filter === opt.value
                                        ? 'bg-accent text-white'
                                        : 'text-muted hover:text-foreground hover:bg-surface'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Path search */}
                    <form onSubmit={handleSearch} className="flex items-center gap-1 flex-1 min-w-[180px] max-w-xs">
                        <div className="relative flex-1">
                            <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                            <input
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                placeholder="Filtrar por path..."
                                className="w-full px-4 pr-10 py-2 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50"
                            />
                            {searchInput && (
                                <button type="button" onClick={() => { setSearchInput(''); setSearch('') }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
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
                                : 'bg-surface border-border text-muted hover:text-foreground'
                        }`}
                        title={autoRefresh ? 'Auto-refresh ativo (30s)' : 'Ativar auto-refresh'}
                    >
                        <RefreshCw size={12} className={autoRefresh ? 'animate-spin' : ''} />
                        {autoRefresh ? '30s' : 'Auto'}
                    </button>

                    {/* Refresh */}
                    <AdminButton
                        onClick={() => fetchLogs(page)}
                        disabled={loading}
                        variant="secondary"
                        size="sm"
                    >
                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Atualizar</span>
                    </AdminButton>

                    {/* Clear dropdown */}
                    <div className="relative ml-auto" ref={clearMenuRef}>
                        <AdminButton
                            onClick={() => setClearMenu(v => !v)}
                            disabled={deleting}
                            variant="danger"
                            size="sm"
                        >
                            <Trash2 size={12} />
                            <span className="hidden sm:inline">Limpar</span>
                            <ChevronDown size={12} />
                        </AdminButton>
                        {clearMenu && (
                            <div className="absolute right-0 top-full mt-1 z-20 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden w-44">
                                {[
                                    { label: 'Mais de 7 dias', days: 7 },
                                    { label: 'Mais de 30 dias', days: 30 },
                                    { label: 'Tudo', days: 0 },
                                ].map(({ label, days }) => (
                                    <button
                                        key={days}
                                        onClick={() => clearLogs(days)}
                                        className={`w-full flex items-center gap-2 px-4 py-3 text-xs font-bold transition-colors border-b border-border last:border-0 ${
                                            days === 0
                                                ? 'text-red-400 hover:bg-red-950/30'
                                                : 'text-foreground hover:bg-surface'
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
                <p className="text-xs text-muted">
                    {total.toLocaleString('pt-BR')} registro{total !== 1 ? 's' : ''}
                    {search && <span className="ml-1 text-purple-400">com &ldquo;{search}&rdquo;</span>}
                    {pages > 1 && <span> · página {page} de {pages}</span>}
                </p>

                {/* Log list */}
                {loading ? (
                    <div className="rounded-xl border border-border bg-surface">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                                <div className="w-10 h-5 rounded bg-surface animate-pulse" />
                                <div className="w-10 h-4 rounded bg-surface animate-pulse" />
                                <div className="flex-1 h-4 rounded bg-surface animate-pulse" />
                                <div className="w-12 h-4 rounded bg-surface animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="rounded-xl border border-border bg-surface">
                        <AdminEmptyState
                            icon={<CheckCircle2 className="w-8 h-8 text-green-700 opacity-60" />}
                            title="Nenhum log encontrado"
                            description={search ? `para o filtro "${search}"` : undefined}
                        />
                    </div>
                ) : (
                    <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                        {logs.map(log => (
                            <div key={log.id} className={`border-l-2 ${leftBorder(log.status)}`}>
                                {/* Row */}
                                <button
                                    onClick={() => setExpanded(e => e === log.id ? null : log.id)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-surface transition-colors"
                                >
                                    {/* Expand indicator */}
                                    <span className="text-muted flex-shrink-0">
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
                                    <span className={`flex-shrink-0 text-[10px] font-black w-10 ${METHOD_COLORS[log.method] ?? 'text-muted'}`}>
                                        {log.method}
                                    </span>

                                    {/* Path */}
                                    <span className="flex-1 text-xs text-foreground font-mono truncate min-w-0">
                                        {log.path}
                                    </span>

                                    {/* Duration */}
                                    <span className={`flex-shrink-0 text-[10px] tabular-nums font-mono ${durationColor(log.duration)}`}>
                                        {log.duration}ms
                                    </span>

                                    {/* UA (desktop) */}
                                    <span className="hidden lg:block flex-shrink-0 text-[10px] text-muted w-16 truncate text-right">
                                        {parseUserAgent(log.userAgent)}
                                    </span>

                                    {/* Time */}
                                    <span
                                        className="flex-shrink-0 text-[10px] text-muted w-10 text-right"
                                        title={new Date(log.createdAt).toLocaleString('pt-BR')}
                                    >
                                        {formatTimeAgo(log.createdAt)}
                                    </span>
                                </button>

                                {/* Expanded */}
                                {expanded === log.id && (
                                    <div className="border-t border-border px-4 py-4 bg-black/20 space-y-3">
                                        {/* Error message */}
                                        {log.error && (
                                            <div>
                                                <p className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1.5">Erro / Resposta</p>
                                                <pre className="text-xs text-orange-300 font-mono whitespace-pre-wrap break-all bg-orange-950/20 border border-orange-900/40 rounded-lg p-3 max-h-64 overflow-y-auto">
                                                    {log.error}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Meta grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                                            <div className="flex items-center gap-2">
                                                <Globe size={11} className="text-muted flex-shrink-0" />
                                                <span className="text-muted">IP:</span>
                                                <span className="text-foreground font-mono">{log.ip ?? '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={11} className="text-muted flex-shrink-0" />
                                                <span className="text-muted">Data:</span>
                                                <span className="text-foreground">{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                                            </div>
                                            <div className="flex items-start gap-2 sm:col-span-2">
                                                <span className="text-muted flex-shrink-0">UA:</span>
                                                <span className="text-muted break-all">{log.userAgent ?? '—'}</span>
                                            </div>
                                            {log.body && log.body !== log.error && (
                                                <div className="sm:col-span-2">
                                                    <p className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">Request Body</p>
                                                    <pre className="text-xs text-muted font-mono whitespace-pre-wrap break-all bg-surface border border-border rounded p-2">
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
                        <AdminButton
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            variant="secondary"
                            size="sm"
                        >
                            ← Anterior
                        </AdminButton>
                        <span className="text-muted">{page} / {pages}</span>
                        <AdminButton
                            onClick={() => setPage(p => Math.min(pages, p + 1))}
                            disabled={page >= pages}
                            variant="secondary"
                            size="sm"
                        >
                            Próxima →
                        </AdminButton>
                    </div>
                )}
                </>)}

                {/* ── GATEWAY ERRORS TAB ── */}
                {activeTab === 'gateway' && (<>

                {/* Info note */}
                <div className="flex items-start gap-3 bg-red-950/20 border border-red-800/30 rounded-xl px-4 py-3 text-xs text-red-300">
                    <Info size={14} className="flex-shrink-0 mt-0.5 text-red-400" />
                    <div className="space-y-1">
                        <p className="font-bold text-red-200">Erros de Gateway — nginx</p>
                        <p className="text-red-300/80">
                            Registros de <strong>502 Bad Gateway</strong> e <strong>504 Gateway Timeout</strong> capturados diretamente
                            pelo nginx antes de chegar ao app. Lidos do arquivo{' '}
                            <code className="bg-red-900/40 px-1 rounded font-mono">/var/log/nginx/gateway-errors.log</code>.
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <StatCard label="Total" value={gwCounts.total} color="text-foreground" sub={`últimas ${gwCounts.total > 0 ? gwCounts.total : '—'} entradas`} />
                    <StatCard label="502 Bad Gateway" value={gwCounts.s502} color="text-red-400" sub="app inacessível" />
                    <StatCard label="504 Timeout" value={gwCounts.s504} color="text-orange-400" sub="resposta lenta" />
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 justify-end">
                    <button
                        onClick={() => setAutoRefresh(v => !v)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                            autoRefresh
                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                : 'bg-surface border-border text-muted hover:text-foreground'
                        }`}
                    >
                        <RefreshCw size={12} className={autoRefresh ? 'animate-spin' : ''} />
                        {autoRefresh ? '30s' : 'Auto'}
                    </button>
                    <AdminButton
                        onClick={fetchGwLogs}
                        disabled={gwLoading}
                        variant="secondary"
                        size="sm"
                    >
                        <RefreshCw size={12} className={gwLoading ? 'animate-spin' : ''} />
                        Atualizar
                    </AdminButton>
                </div>

                {/* Gateway log list */}
                {gwAvailable === false ? (
                    <div className="rounded-xl border border-border bg-surface">
                        <AdminEmptyState
                            icon={<ShieldAlert className="w-8 h-8 text-muted opacity-60" />}
                            title="Log não disponível"
                            description={gwMessage ?? 'Arquivo de log nginx não encontrado. Verifique o bind mount e a configuração do nginx.'}
                        />
                    </div>
                ) : gwLoading ? (
                    <div className="rounded-xl border border-border bg-surface">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                                <div className="w-10 h-5 rounded bg-surface animate-pulse" />
                                <div className="w-10 h-4 rounded bg-surface animate-pulse" />
                                <div className="flex-1 h-4 rounded bg-surface animate-pulse" />
                                <div className="w-12 h-4 rounded bg-surface animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : gwLogs.length === 0 ? (
                    <div className="rounded-xl border border-border bg-surface">
                        <AdminEmptyState
                            icon={<CheckCircle2 className="w-8 h-8 text-green-700 opacity-60" />}
                            title="Nenhum erro de gateway registrado"
                        />
                    </div>
                ) : (
                    <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                        {gwLogs.map((log, idx) => (
                            <div key={idx} className="border-l-2 border-l-red-600/60">
                                <button
                                    onClick={() => setGwExpanded(e => e === idx ? null : idx)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-surface transition-colors"
                                >
                                    <span className="text-muted flex-shrink-0">
                                        {gwExpanded === idx ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                    </span>
                                    <span className={`flex-shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded tabular-nums ${statusBadge(log.status)}`}>
                                        {log.status}
                                    </span>
                                    <span className={`flex-shrink-0 text-[10px] font-black w-10 ${METHOD_COLORS[log.method] ?? 'text-muted'}`}>
                                        {log.method}
                                    </span>
                                    <span className="flex-1 text-xs text-foreground font-mono truncate min-w-0">
                                        {log.path}
                                    </span>
                                    <span className={`flex-shrink-0 text-[10px] tabular-nums font-mono ${durationColor(Math.round(log.duration * 1000))}`}>
                                        {(log.duration * 1000).toFixed(0)}ms
                                    </span>
                                    <span className="hidden lg:block flex-shrink-0 text-[10px] text-muted w-16 truncate text-right">
                                        {parseUserAgent(log.ua)}
                                    </span>
                                    <span
                                        className="flex-shrink-0 text-[10px] text-muted w-10 text-right"
                                        title={new Date(log.ts).toLocaleString('pt-BR')}
                                    >
                                        {formatTimeAgo(log.ts)}
                                    </span>
                                </button>
                                {gwExpanded === idx && (
                                    <div className="border-t border-border px-4 py-4 bg-black/20">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                                            <div className="flex items-center gap-2">
                                                <Globe size={11} className="text-muted flex-shrink-0" />
                                                <span className="text-muted">IP:</span>
                                                <span className="text-foreground font-mono">{log.ip || '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={11} className="text-muted flex-shrink-0" />
                                                <span className="text-muted">Data:</span>
                                                <span className="text-foreground">{new Date(log.ts).toLocaleString('pt-BR')}</span>
                                            </div>
                                            <div className="flex items-start gap-2 sm:col-span-2">
                                                <span className="text-muted flex-shrink-0">UA:</span>
                                                <span className="text-muted break-all">{log.ua || '—'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                </>)}

            </div>
        </AdminLayout>
    )
}
