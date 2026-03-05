'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { RefreshCw, Trash2, AlertTriangle, CheckCircle2, ServerCrash, Filter } from 'lucide-react'

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

const STATUS_FILTER_OPTIONS = [
    { value: 'errors', label: 'Erros (4xx+5xx)' },
    { value: '4xx',    label: 'Bad Request (4xx)' },
    { value: '5xx',    label: 'Server Error (5xx)' },
    { value: 'all',    label: 'Todos' },
]

function statusColor(status: number) {
    if (status >= 500) return 'text-red-400 bg-red-950/50 border border-red-800/50'
    if (status >= 400) return 'text-orange-400 bg-orange-950/50 border border-orange-800/50'
    if (status >= 300) return 'text-yellow-400 bg-yellow-950/50 border border-yellow-800/50'
    return 'text-green-400 bg-green-950/50 border border-green-800/50'
}

function methodColor(method: string) {
    const m: Record<string, string> = {
        GET: 'text-blue-400', POST: 'text-green-400',
        PUT: 'text-yellow-400', PATCH: 'text-orange-400',
        DELETE: 'text-red-400',
    }
    return m[method] ?? 'text-zinc-400'
}

export default function ServerLogsPage() {
    const [logs, setLogs] = useState<ServerLogEntry[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('errors')
    const [expanded, setExpanded] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/server-logs?status=${filter}&limit=200`)
            const json = await res.json()
            setLogs(json.logs ?? [])
            setTotal(json.total ?? 0)
        } finally {
            setLoading(false)
        }
    }, [filter])

    useEffect(() => { fetchLogs() }, [fetchLogs])

    async function clearOld() {
        if (!confirm('Apagar logs com mais de 7 dias?')) return
        setDeleting(true)
        await fetch('/api/admin/server-logs?days=7', { method: 'DELETE' })
        setDeleting(false)
        fetchLogs()
    }

    const errorCount = logs.filter(l => l.status >= 400).length
    const fivexxCount = logs.filter(l => l.status >= 500).length

    return (
        <AdminLayout title="Server Logs">
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total carregados', value: logs.length, icon: Filter, color: 'zinc' },
                    { label: 'Erros (4xx+5xx)', value: errorCount, icon: AlertTriangle, color: 'orange' },
                    { label: 'Server errors (5xx)', value: fivexxCount, icon: ServerCrash, color: 'red' },
                    { label: 'Sucesso (2xx/3xx)', value: logs.length - errorCount, icon: CheckCircle2, color: 'green' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className={`bg-${color}-950/30 border border-${color}-800/40 rounded-xl p-4`}>
                        <div className="flex items-center justify-between mb-1">
                            <p className={`text-xs text-${color}-400`}>{label}</p>
                            <Icon className={`w-4 h-4 text-${color}-500`} />
                        </div>
                        <p className="text-2xl font-black text-white">{value}</p>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                    {STATUS_FILTER_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setFilter(opt.value)}
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

                <button
                    onClick={fetchLogs}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 text-sm transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </button>

                <button
                    onClick={clearOld}
                    disabled={deleting}
                    className="flex items-center gap-2 px-3 py-2 bg-red-950/50 border border-red-800/50 text-red-400 rounded-lg hover:bg-red-900/50 text-sm transition-colors disabled:opacity-50 ml-auto"
                >
                    <Trash2 className="w-4 h-4" />
                    Limpar &gt;7 dias
                </button>
            </div>

            <p className="text-xs text-zinc-600 mb-4">{total} registros no banco · exibindo {logs.length}</p>

            {/* Log list */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-20 text-zinc-600">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-700" />
                    <p>Nenhum log encontrado para este filtro</p>
                </div>
            ) : (
                <div className="space-y-1.5">
                    {logs.map(log => (
                        <div
                            key={log.id}
                            className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg overflow-hidden"
                        >
                            {/* Row */}
                            <button
                                onClick={() => setExpanded(e => e === log.id ? null : log.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800/30 transition-colors"
                            >
                                <span className={`flex-shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded ${statusColor(log.status)}`}>
                                    {log.status}
                                </span>
                                <span className={`flex-shrink-0 text-xs font-black w-12 ${methodColor(log.method)}`}>
                                    {log.method}
                                </span>
                                <span className="flex-1 text-xs text-zinc-300 font-mono truncate">{log.path}</span>
                                <span className="flex-shrink-0 text-[10px] text-zinc-600 tabular-nums">{log.duration}ms</span>
                                <span className="flex-shrink-0 text-[10px] text-zinc-600 hidden sm:block">
                                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                                </span>
                            </button>

                            {/* Expanded detail */}
                            {expanded === log.id && (
                                <div className="border-t border-zinc-800/50 px-4 py-3 space-y-2 bg-black/20">
                                    {log.error && (
                                        <div>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Erro / Resposta</p>
                                            <pre className="text-xs text-orange-300 font-mono whitespace-pre-wrap break-all bg-orange-950/20 rounded p-2">
                                                {log.error}
                                            </pre>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        {log.ip && (
                                            <div>
                                                <span className="text-zinc-600">IP: </span>
                                                <span className="text-zinc-300 font-mono">{log.ip}</span>
                                            </div>
                                        )}
                                        {log.userAgent && (
                                            <div>
                                                <span className="text-zinc-600">UA: </span>
                                                <span className="text-zinc-400 truncate block">{log.userAgent}</span>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-zinc-600">Data: </span>
                                            <span className="text-zinc-300">{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-600">Duração: </span>
                                            <span className="text-zinc-300">{log.duration}ms</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </AdminLayout>
    )
}
