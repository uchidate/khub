'use client'

import { useEffect, useState, useCallback, useRef, Fragment } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
    Bot, Search, RefreshCw, ChevronLeft, ChevronRight,
    Globe, TrendingUp, FileText, BarChart2, Clock,
    ChevronDown, ChevronUp, X, ExternalLink, Layers,
} from 'lucide-react'
import { getBotGroup, BOT_GROUPS } from '@/lib/utils/bot-detector'

const BASE_URL = 'https://www.hallyuhub.com.br'

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

interface TimelinePoint {
    date: string
    count: number
}

interface Stats {
    total: number
    byBot: { bot: string; count: number }[]
    topPaths: { path: string; count: number }[]
    bySection: { section: string; count: number }[]
    timeline: TimelinePoint[]
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

const GROUP_BAR_COLORS: Record<string, string> = {
    'Google': 'bg-blue-500',
    'Bing':   'bg-teal-500',
    'Social': 'bg-indigo-500',
    'SEO':    'bg-amber-500',
    'Outros': 'bg-zinc-500',
}

const SECTION_COLORS: Record<string, { bar: string; text: string; bg: string; border: string }> = {
    'News':      { bar: 'bg-purple-500', text: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
    'Artistas':  { bar: 'bg-pink-500',   text: 'text-pink-400',   bg: 'bg-pink-400/10',   border: 'border-pink-400/20' },
    'Produções': { bar: 'bg-blue-500',   text: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20' },
    'Grupos':    { bar: 'bg-cyan-500',   text: 'text-cyan-400',   bg: 'bg-cyan-400/10',   border: 'border-cyan-400/20' },
    'Home':      { bar: 'bg-green-500',  text: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/20' },
    'Outros':    { bar: 'bg-zinc-500',   text: 'text-zinc-400',   bg: 'bg-zinc-400/10',   border: 'border-zinc-400/20' },
}

const SECTION_PATH_MAP: Record<string, string> = {
    'News': '/news', 'Artistas': '/artists', 'Produções': '/productions', 'Grupos': '/groups', 'Home': '/',
}

const DEFAULT_BOT_COLOR = 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'

function botColor(bot: string) {
    return BOT_COLORS[bot] ?? DEFAULT_BOT_COLOR
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
}

function timeAgo(iso: string) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60) return `${diff}s atrás`
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
    return `${Math.floor(diff / 86400)}d atrás`
}

// ─── Timeline Chart ──────────────────────────────────────────────────────────

function TimelineChart({ data, days }: { data: TimelinePoint[]; days: number }) {
    if (!data.length) return <p className="text-zinc-500 text-xs py-4">Sem dados no período</p>

    const max = Math.max(...data.map(d => d.count), 1)

    function showLabel(i: number, total: number) {
        if (total <= 7)  return true
        if (total <= 14) return i % 2 === 0
        return i % 5 === 0 || i === total - 1
    }

    return (
        <div>
            <div className="flex items-end gap-0.5 h-24">
                {data.map(({ date, count }) => (
                    <div key={date} className="flex-1 group relative flex flex-col items-center justify-end">
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 border border-zinc-700">
                            {count.toLocaleString('pt-BR')}
                        </div>
                        <div
                            className="w-full bg-violet-500/60 hover:bg-violet-400 rounded-sm transition-colors min-h-[2px]"
                            style={{ height: `${(count / max) * 100}%` }}
                        />
                    </div>
                ))}
            </div>
            <div className="flex gap-0.5 mt-1.5">
                {data.map(({ date }, i) => (
                    <div key={date} className="flex-1 text-center overflow-hidden">
                        {showLabel(i, data.length) ? (
                            <span className="text-[9px] text-zinc-600">
                                {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </span>
                        ) : null}
                    </div>
                ))}
            </div>
            <p className="text-[10px] text-zinc-600 mt-1">
                Pico: {Math.max(...data.map(d => d.count)).toLocaleString('pt-BR')} crawls num dia
                {' · '}Média: {Math.round(data.reduce((s, d) => s + d.count, 0) / data.length).toLocaleString('pt-BR')}/dia
                {' · '}Período: {days}d
            </p>
        </div>
    )
}

// ─── Log Card (mobile) ───────────────────────────────────────────────────────

function LogCard({ log, expanded, onToggle }: { log: BotLog; expanded: boolean; onToggle: () => void }) {
    return (
        <div
            className={`border-b border-zinc-800/50 transition-colors ${expanded ? 'bg-zinc-800/20' : ''}`}
        >
            <button
                className="w-full text-left px-4 py-3 flex items-start gap-3"
                onClick={onToggle}
            >
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-bold whitespace-nowrap ${botColor(log.bot)}`}>
                            {log.bot}
                        </span>
                        <span className="text-[10px] text-zinc-600">{getBotGroup(log.bot)}</span>
                        <span className="text-[10px] text-zinc-500 ml-auto">{timeAgo(log.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-xs text-zinc-300 truncate">{log.path}</span>
                        <a
                            href={`${BASE_URL}${log.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="shrink-0 text-zinc-600 hover:text-emerald-400 transition-colors"
                        >
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
                <div className="shrink-0 text-zinc-600 mt-0.5">
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
            </button>
            {expanded && (
                <div className="px-4 pb-3 space-y-2 bg-zinc-950/50">
                    <div>
                        <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">User-Agent</p>
                        <p className="font-mono text-[11px] text-zinc-300 break-all leading-relaxed">{log.userAgent || '—'}</p>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-600">
                        {log.ip && <span>IP: <span className="text-zinc-500 font-mono">{log.ip}</span></span>}
                        <span>Data: <span className="text-zinc-500">{formatDate(log.createdAt)}</span></span>
                        {log.referer && <span className="break-all">Referer: <span className="text-zinc-500 font-mono">{log.referer}</span></span>}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BotLogsPage() {
    const [stats, setStats]               = useState<Stats | null>(null)
    const [logs, setLogs]                 = useState<BotLog[]>([])
    const [total, setTotal]               = useState(0)
    const [page, setPage]                 = useState(1)
    const [pages, setPages]               = useState(1)
    const [loading, setLoading]           = useState(true)
    const [statsLoading, setStatsLoading] = useState(true)
    const [expandedId, setExpandedId]     = useState<string | null>(null)
    const [autoRefresh, setAutoRefresh]   = useState(false)

    const [days, setDays]                         = useState(7)
    const [botFilter, setBotFilter]               = useState('')
    const [pathFilter, setPathFilter]             = useState('')
    const [pathInputValue, setPathInputValue]     = useState('')

    const debounceTimer = useRef<ReturnType<typeof setTimeout>>()

    // ── Fetch ────────────────────────────────────────────────────────────────

    const fetchStats = useCallback(async () => {
        setStatsLoading(true)
        try {
            const params = new URLSearchParams({ stats: '1', days: String(days) })
            if (botFilter) params.set('bot', botFilter)
            if (pathFilter) params.set('path', pathFilter)
            const r = await fetch(`/api/admin/bot-logs?${params}`)
            if (r.ok) setStats(await r.json())
        } finally {
            setStatsLoading(false)
        }
    }, [days, botFilter, pathFilter])

    const fetchLogs = useCallback(async (p = 1) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ days: String(days), page: String(p), limit: '50' })
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

    useEffect(() => {
        if (!autoRefresh) return
        const id = setInterval(() => {
            fetchStats()
            fetchLogs(page)
        }, 30_000)
        return () => clearInterval(id)
    }, [autoRefresh, fetchStats, fetchLogs, page])

    // ── Handlers ─────────────────────────────────────────────────────────────

    function handleBotFilter(bot: string) {
        setBotFilter(prev => prev === bot ? '' : bot)
    }

    function handlePathChange(value: string) {
        setPathInputValue(value)
        clearTimeout(debounceTimer.current)
        debounceTimer.current = setTimeout(() => setPathFilter(value), 300)
    }

    function handlePathClick(path: string) {
        if (!path) return
        clearTimeout(debounceTimer.current)
        setPathInputValue(path)
        setPathFilter(path)
    }

    function clearPath() {
        clearTimeout(debounceTimer.current)
        setPathInputValue('')
        setPathFilter('')
    }

    // ── Derived ──────────────────────────────────────────────────────────────

    const groupTotals = stats
        ? Object.entries(BOT_GROUPS)
            .map(([group, bots]) => ({
                group,
                count: (stats.byBot ?? [])
                    .filter(b => bots.includes(b.bot))
                    .reduce((sum, b) => sum + b.count, 0),
            }))
            .filter(g => g.count > 0)
            .sort((a, b) => b.count - a.count)
        : []

    const byBotMax   = stats?.byBot?.length   ? Math.max(...stats.byBot.map(b => b.count))   : 1
    const topPathMax = stats?.topPaths?.length ? Math.max(...stats.topPaths.map(p => p.count)) : 1

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <AdminLayout title="Robôs de Busca">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                        <Bot className="w-5 h-5 text-violet-400 shrink-0" />
                        <div>
                            <h1 className="text-base sm:text-xl font-bold text-white leading-tight">Robôs de Busca</h1>
                            <p className="text-[10px] sm:text-xs text-zinc-400">Crawls detectados por User-Agent</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {([7, 14, 30] as const).map(d => (
                            <button
                                key={d}
                                onClick={() => setDays(d)}
                                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${days === d ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                            >
                                {d}d
                            </button>
                        ))}
                        <button
                            onClick={() => setAutoRefresh(prev => !prev)}
                            title={autoRefresh ? 'Auto-refresh ativo — clique para pausar' : 'Ativar auto-refresh'}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${autoRefresh ? 'bg-green-600/10 text-green-400 border-green-600/30' : 'bg-zinc-800 text-zinc-400 border-transparent hover:bg-zinc-700'}`}
                        >
                            <Clock className="w-3 h-3" />
                            <span className="hidden sm:inline">{autoRefresh ? 'Ao vivo' : '30s'}</span>
                        </button>
                        <button
                            onClick={() => { fetchStats(); fetchLogs(1) }}
                            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                            title="Recarregar"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* ── Stats cards ────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">

                    {/* Total + Group Breakdown */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-4 h-4 text-violet-400" />
                            <p className="text-xs font-medium text-zinc-300">Total de crawls</p>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">
                            {statsLoading ? '—' : (stats?.total ?? 0).toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-zinc-500 mb-4">últimos {days} dias</p>
                        <div className="space-y-2.5">
                            {statsLoading ? (
                                [1, 2, 3].map(i => <div key={i} className="h-5 bg-zinc-800 rounded animate-pulse" />)
                            ) : groupTotals.map(({ group, count }) => {
                                const pct = stats?.total ? Math.round(count / stats.total * 100) : 0
                                return (
                                    <div key={group}>
                                        <div className="flex justify-between text-[10px] mb-1">
                                            <span className="text-zinc-400 font-medium">{group}</span>
                                            <span className="text-zinc-300 font-mono">
                                                {count.toLocaleString('pt-BR')}
                                                <span className="text-zinc-600 ml-1">({pct}%)</span>
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${GROUP_BAR_COLORS[group] ?? 'bg-zinc-500'}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                            {!statsLoading && !groupTotals.length && (
                                <p className="text-zinc-600 text-xs">Sem dados no período</p>
                            )}
                        </div>
                    </div>

                    {/* By Bot */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Bot className="w-4 h-4 text-violet-400" />
                            <p className="text-xs font-medium text-zinc-300">Por robô</p>
                            {botFilter && (
                                <button
                                    onClick={() => setBotFilter('')}
                                    className="ml-auto text-[10px] text-zinc-500 hover:text-white flex items-center gap-0.5"
                                >
                                    <X className="w-3 h-3" /> limpar
                                </button>
                            )}
                        </div>
                        {statsLoading ? (
                            <div className="space-y-2">
                                {[1, 2, 3, 4].map(i => <div key={i} className="h-8 bg-zinc-800 rounded animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="space-y-1 max-h-56 overflow-y-auto pr-1 -mr-1">
                                {(stats?.byBot ?? []).map(({ bot, count }) => (
                                    <button
                                        key={bot}
                                        onClick={() => handleBotFilter(bot)}
                                        className={`w-full px-2 py-1.5 rounded transition-colors text-left space-y-1 ${botFilter === bot ? 'bg-violet-600/20 ring-1 ring-violet-600/30' : 'hover:bg-zinc-800'}`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-bold ${botColor(bot)}`}>
                                                {bot}
                                            </span>
                                            <span className="text-zinc-300 font-mono text-xs shrink-0">
                                                {count.toLocaleString('pt-BR')}
                                            </span>
                                        </div>
                                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${botFilter === bot ? 'bg-violet-400' : 'bg-violet-600/50'}`}
                                                style={{ width: `${byBotMax ? (count / byBotMax) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </button>
                                ))}
                                {!stats?.byBot?.length && <p className="text-zinc-500 text-xs">Nenhum dado</p>}
                            </div>
                        )}
                    </div>

                    {/* By Section */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Layers className="w-4 h-4 text-violet-400" />
                            <p className="text-xs font-medium text-zinc-300">Por seção</p>
                        </div>
                        {statsLoading ? (
                            <div className="space-y-2">
                                {[1, 2, 3, 4].map(i => <div key={i} className="h-8 bg-zinc-800 rounded animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="space-y-1 max-h-56 overflow-y-auto pr-1 -mr-1">
                                {(stats?.bySection ?? []).map(({ section, count }) => {
                                    const colors = SECTION_COLORS[section] ?? SECTION_COLORS['Outros']
                                    const pct = stats?.total ? Math.round(count / stats.total * 100) : 0
                                    return (
                                        <button
                                            key={section}
                                            onClick={() => handlePathClick(SECTION_PATH_MAP[section] ?? '')}
                                            className="w-full px-2 py-1.5 rounded hover:bg-zinc-800 transition-colors text-left space-y-1"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-bold ${colors.text} ${colors.bg} ${colors.border}`}>
                                                    {section}
                                                </span>
                                                <span className="text-zinc-300 font-mono text-xs shrink-0">
                                                    {count.toLocaleString('pt-BR')}
                                                    <span className="text-zinc-600 ml-1">({pct}%)</span>
                                                </span>
                                            </div>
                                            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${colors.bar}`}
                                                    style={{ width: `${stats?.total ? (count / stats.total) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </button>
                                    )
                                })}
                                {!stats?.bySection?.length && <p className="text-zinc-500 text-xs">Nenhum dado</p>}
                            </div>
                        )}
                    </div>

                    {/* Top Paths */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-4 h-4 text-violet-400" />
                            <p className="text-xs font-medium text-zinc-300">Páginas mais rastreadas</p>
                        </div>
                        {statsLoading ? (
                            <div className="space-y-2">
                                {[1, 2, 3, 4].map(i => <div key={i} className="h-8 bg-zinc-800 rounded animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="space-y-1 max-h-56 overflow-y-auto pr-1 -mr-1">
                                {(stats?.topPaths ?? []).map(({ path, count }) => (
                                    <div key={path} className="group rounded hover:bg-zinc-800 transition-colors">
                                        <div className="flex items-center gap-1 px-2 pt-1.5">
                                            <button
                                                onClick={() => handlePathClick(path)}
                                                title={`Filtrar por: ${path}`}
                                                className="flex-1 text-left min-w-0"
                                            >
                                                <span className="text-zinc-400 font-mono text-[10px] truncate block">{path}</span>
                                            </button>
                                            <a
                                                href={`${BASE_URL}${path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title={`Abrir ${BASE_URL}${path}`}
                                                onClick={e => e.stopPropagation()}
                                                className="shrink-0 text-zinc-600 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                            <span className="text-zinc-300 font-mono text-xs shrink-0">{count}</span>
                                        </div>
                                        <button onClick={() => handlePathClick(path)} className="w-full px-2 pb-1.5">
                                            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mt-1">
                                                <div
                                                    className="h-full rounded-full bg-emerald-600/50 transition-all"
                                                    style={{ width: `${topPathMax ? (count / topPathMax) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </button>
                                    </div>
                                ))}
                                {!stats?.topPaths?.length && <p className="text-zinc-500 text-xs">Nenhum dado</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Timeline chart ─────────────────────────────────────── */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart2 className="w-4 h-4 text-violet-400" />
                        <p className="text-xs font-medium text-zinc-300">Atividade por dia</p>
                    </div>
                    {statsLoading ? (
                        <div className="flex items-end gap-0.5 h-24">
                            {Array.from({ length: days }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex-1 bg-zinc-800 rounded-sm animate-pulse"
                                    style={{ height: `${20 + Math.random() * 80}%` }}
                                />
                            ))}
                        </div>
                    ) : (
                        <TimelineChart data={stats?.timeline ?? []} days={days} />
                    )}
                </div>

                {/* ── Filters ────────────────────────────────────────────── */}
                <div className="flex flex-wrap gap-2 items-center">
                    {botFilter && (
                        <button
                            onClick={() => setBotFilter('')}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-bold ${botColor(botFilter)}`}
                        >
                            {botFilter}
                            <X className="w-3 h-3 ml-0.5" />
                        </button>
                    )}
                    <div className="relative flex-1 min-w-[160px] max-w-xs">
                        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Filtrar por path..."
                            value={pathInputValue}
                            onChange={e => handlePathChange(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded pl-8 pr-8 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                        />
                        {pathInputValue && (
                            <button
                                onClick={clearPath}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <span className="text-xs text-zinc-500">{total.toLocaleString('pt-BR')} resultado(s)</span>
                </div>

                {/* ── Log list ───────────────────────────────────────────── */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">

                    {/* Mobile: cards */}
                    <div className="md:hidden">
                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="px-4 py-3 border-b border-zinc-800/50 space-y-2">
                                    <div className="h-4 bg-zinc-800 rounded animate-pulse w-1/2" />
                                    <div className="h-3 bg-zinc-800 rounded animate-pulse w-3/4" />
                                </div>
                            ))
                        ) : logs.length === 0 ? (
                            <div className="px-4 py-12 text-center text-zinc-500">
                                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                Nenhum crawl nos últimos {days} dias
                            </div>
                        ) : logs.map(log => (
                            <LogCard
                                key={log.id}
                                log={log}
                                expanded={expandedId === log.id}
                                onToggle={() => setExpandedId(prev => prev === log.id ? null : log.id)}
                            />
                        ))}
                    </div>

                    {/* Desktop: table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800">
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Robô</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Path</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">IP</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Quando</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Referer</th>
                                    <th className="w-8" />
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 10 }).map((_, i) => (
                                        <tr key={i} className="border-b border-zinc-800/50">
                                            {Array.from({ length: 6 }).map((_, j) => (
                                                <td key={j} className="px-4 py-3">
                                                    <div className="h-4 bg-zinc-800 rounded animate-pulse" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                            Nenhum crawl registrado nos últimos {days} dias
                                        </td>
                                    </tr>
                                ) : logs.map(log => (
                                    <Fragment key={log.id}>
                                        <tr
                                            className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer select-none ${expandedId === log.id ? 'bg-zinc-800/20' : ''}`}
                                            onClick={() => setExpandedId(prev => prev === log.id ? null : log.id)}
                                        >
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-bold whitespace-nowrap ${botColor(log.bot)}`}>
                                                    {log.bot}
                                                </span>
                                                <p className="text-[10px] text-zinc-600 mt-0.5">{getBotGroup(log.bot)}</p>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-zinc-300 max-w-[280px]">
                                                <div className="flex items-center gap-1.5 group/path min-w-0">
                                                    <span className="truncate" title={log.path}>{log.path}</span>
                                                    <a
                                                        href={`${BASE_URL}${log.path}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title={`Abrir ${BASE_URL}${log.path}`}
                                                        onClick={e => e.stopPropagation()}
                                                        className="shrink-0 text-zinc-600 hover:text-emerald-400 transition-colors opacity-0 group-hover/path:opacity-100"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
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
                                            <td className="px-2 py-3 text-zinc-600">
                                                {expandedId === log.id
                                                    ? <ChevronUp className="w-3.5 h-3.5" />
                                                    : <ChevronDown className="w-3.5 h-3.5" />}
                                            </td>
                                        </tr>
                                        {expandedId === log.id && (
                                            <tr className="border-b border-zinc-800/50 bg-zinc-950/50">
                                                <td colSpan={6} className="px-4 py-3">
                                                    <div className="space-y-2">
                                                        <div>
                                                            <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">User-Agent</p>
                                                            <p className="font-mono text-[11px] text-zinc-300 break-all leading-relaxed">
                                                                {log.userAgent || '—'}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-600">
                                                            <span>ID: <span className="text-zinc-500 font-mono">{log.id}</span></span>
                                                            <span>Data exata: <span className="text-zinc-500">{formatDate(log.createdAt)}</span></span>
                                                            {log.referer && (
                                                                <span className="break-all">Referer: <span className="text-zinc-500 font-mono">{log.referer}</span></span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
                            <span className="text-xs text-zinc-500">
                                Pág. {page}/{pages} · {total.toLocaleString('pt-BR')} total
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
