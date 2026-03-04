'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Bot, Search, RefreshCw, ChevronLeft, ChevronRight, Globe, TrendingUp, FileText } from 'lucide-react'
import { getBotGroup } from '@/lib/utils/bot-detector'

// ─── Types ──────────────────────────────────────────────────────────────────

interface BotLog {
    id: string
    bot: string
    path: string
    ip: string | null
    userAgent: string
    referer: string | null
    createdAt: string
}

interface Stats {
    total: number
    byBot: { bot: string; count: number }[]
    topPaths: { path: string; count: number }[]
    days: number
}

// ─── Config ─────────────────────────────────────────────────────────────────

const BOT_COLORS: Record<string, string> = {
    'Googlebot':             'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'Googlebot-Image':       'text-blue-300 bg-blue-300/10 border-blue-300/20',
    'Googlebot-Video':       'text-blue-300 bg-blue-300/10 border-blue-300/20',
    'Google-InspectionTool': 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    'AdsBot-Google':         'text-sky-400 bg-sky-400/10 border-sky-400/20',
    'GoogleOther':           'text-sky-300 bg-sky-300/10 border-sky-300/20',
    'Bingbot':               'text-teal-400 bg-teal-400/10 border-teal-400/20',
    'BingPreview':           'text-teal-300 bg-teal-300/10 border-teal-300/20',
    'Applebot':              'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
    'DuckDuckBot':           'text-orange-400 bg-orange-400/10 border-orange-400/20',
    'YandexBot':             'text-red-400 bg-red-400/10 border-red-400/20',
    'Baiduspider':           'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    'FacebookBot':           'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
    'Twitterbot':            'text-sky-500 bg-sky-500/10 border-sky-500/20',
    'LinkedInBot':           'text-blue-500 bg-blue-500/10 border-blue-500/20',
    'Discordbot':            'text-violet-400 bg-violet-400/10 border-violet-400/20',
    'SemrushBot':            'text-amber-400 bg-amber-400/10 border-amber-400/20',
    'AhrefsBot':             'text-orange-500 bg-orange-500/10 border-orange-500/20',
}

const DEFAULT_BOT_COLOR = 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'

function botColor(bot: string) {
    return BOT_COLORS[bot] ?? DEFAULT_BOT_COLOR
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
}

function timeAgo(iso: string) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60) return `${diff}s atrás`
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
    return `${Math.floor(diff / 86400)}d atrás`
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BotLogsPage() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [logs, setLogs] = useState<BotLog[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [pages, setPages] = useState(1)
    const [loading, setLoading] = useState(true)
    const [statsLoading, setStatsLoading] = useState(true)

    const [days, setDays] = useState(7)
    const [botFilter, setBotFilter] = useState('')
    const [pathFilter, setPathFilter] = useState('')
    const pathInput = useRef('')

    const fetchStats = useCallback(async () => {
        setStatsLoading(true)
        try {
            const r = await fetch(`/api/admin/bot-logs?stats=1&days=${days}${botFilter ? `&bot=${encodeURIComponent(botFilter)}` : ''}`)
            if (r.ok) setStats(await r.json())
        } finally {
            setStatsLoading(false)
        }
    }, [days, botFilter])

    const fetchLogs = useCallback(async (p = 1) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                days: String(days),
                page: String(p),
                limit: '50',
            })
            if (botFilter) params.set('bot', botFilter)
            if (pathFilter) params.set('path', pathFilter)
            const r = await fetch(`/api/admin/bot-logs?${params}`)
            if (r.ok) {
                const data = await r.json()
                setLogs(data.logs)
                setTotal(data.total)
                setPages(data.pages)
                setPage(p)
            }
        } finally {
            setLoading(false)
        }
    }, [days, botFilter, pathFilter])

    useEffect(() => {
        fetchStats()
        fetchLogs(1)
    }, [fetchStats, fetchLogs])

    function handleBotFilter(bot: string) {
        setBotFilter(prev => prev === bot ? '' : bot)
        setPage(1)
    }

    return (
        <AdminLayout title="Robôs de Busca">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Bot className="w-6 h-6 text-violet-400" />
                        <div>
                            <h1 className="text-xl font-bold text-white">Robôs de Busca</h1>
                            <p className="text-xs text-zinc-400">Crawls detectados passivamente por User-Agent</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Days filter */}
                        {([7, 14, 30] as const).map(d => (
                            <button
                                key={d}
                                onClick={() => { setDays(d); setPage(1) }}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${days === d ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                            >
                                {d}d
                            </button>
                        ))}
                        <button
                            onClick={() => { fetchStats(); fetchLogs(1) }}
                            className="p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                            title="Recarregar"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-violet-500/10">
                            <Globe className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-400">Total de crawls</p>
                            <p className="text-2xl font-bold text-white">
                                {statsLoading ? '—' : (stats?.total ?? 0).toLocaleString('pt-BR')}
                            </p>
                            <p className="text-xs text-zinc-500">últimos {days} dias</p>
                        </div>
                    </div>

                    {/* By Bot */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Bot className="w-4 h-4 text-violet-400" />
                            <p className="text-xs font-medium text-zinc-300">Por robô</p>
                        </div>
                        {statsLoading ? (
                            <div className="space-y-1">
                                {[1, 2, 3].map(i => <div key={i} className="h-4 bg-zinc-800 rounded animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {(stats?.byBot ?? []).map(({ bot, count }) => (
                                    <button
                                        key={bot}
                                        onClick={() => handleBotFilter(bot)}
                                        className={`w-full flex items-center justify-between gap-2 px-2 py-1 rounded text-xs transition-colors ${botFilter === bot ? 'bg-violet-600/20' : 'hover:bg-zinc-800'}`}
                                    >
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-bold ${botColor(bot)}`}>
                                            {bot}
                                        </span>
                                        <span className="text-zinc-300 font-mono">{count.toLocaleString('pt-BR')}</span>
                                    </button>
                                ))}
                                {(!stats?.byBot?.length) && <p className="text-zinc-500 text-xs">Nenhum dado</p>}
                            </div>
                        )}
                    </div>

                    {/* Top paths */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-4 h-4 text-violet-400" />
                            <p className="text-xs font-medium text-zinc-300">Páginas mais rastreadas</p>
                        </div>
                        {statsLoading ? (
                            <div className="space-y-1">
                                {[1, 2, 3].map(i => <div key={i} className="h-4 bg-zinc-800 rounded animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {(stats?.topPaths ?? []).map(({ path, count }) => (
                                    <div key={path} className="flex items-center justify-between gap-2 text-xs">
                                        <span className="text-zinc-400 truncate font-mono text-[10px]">{path}</span>
                                        <span className="text-zinc-300 font-mono shrink-0">{count}</span>
                                    </div>
                                ))}
                                {(!stats?.topPaths?.length) && <p className="text-zinc-500 text-xs">Nenhum dado</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 items-center">
                    {botFilter && (
                        <button
                            onClick={() => setBotFilter('')}
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-bold ${botColor(botFilter)}`}
                        >
                            {botFilter} ×
                        </button>
                    )}
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Filtrar por path..."
                            defaultValue={pathFilter}
                            onChange={e => { pathInput.current = e.target.value }}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    setPathFilter(pathInput.current)
                                    setPage(1)
                                }
                            }}
                            className="bg-zinc-900 border border-zinc-700 rounded pl-8 pr-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 w-56"
                        />
                    </div>
                    <span className="text-xs text-zinc-500">{total.toLocaleString('pt-BR')} resultado(s)</span>
                </div>

                {/* Table */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800">
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Robô</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Path</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">IP</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Quando</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Referer</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 10 }).map((_, i) => (
                                        <tr key={i} className="border-b border-zinc-800/50">
                                            {Array.from({ length: 5 }).map((_, j) => (
                                                <td key={j} className="px-4 py-3">
                                                    <div className="h-4 bg-zinc-800 rounded animate-pulse" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                            Nenhum crawl registrado nos últimos {days} dias
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map(log => (
                                        <tr key={log.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-bold whitespace-nowrap ${botColor(log.bot)}`}>
                                                    {log.bot}
                                                </span>
                                                <p className="text-[10px] text-zinc-600 mt-0.5">{getBotGroup(log.bot)}</p>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-zinc-300 max-w-[280px]">
                                                <span className="truncate block" title={log.path}>{log.path}</span>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                                                {log.ip ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap" title={formatDate(log.createdAt)}>
                                                {timeAgo(log.createdAt)}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-zinc-500 max-w-[200px]">
                                                {log.referer ? (
                                                    <span className="truncate block font-mono text-[10px]" title={log.referer}>{log.referer}</span>
                                                ) : '—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
                            <span className="text-xs text-zinc-500">
                                Página {page} de {pages}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => fetchLogs(page - 1)}
                                    disabled={page === 1}
                                    className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 text-zinc-400 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => fetchLogs(page + 1)}
                                    disabled={page === pages}
                                    className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 text-zinc-400 transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    )
}
