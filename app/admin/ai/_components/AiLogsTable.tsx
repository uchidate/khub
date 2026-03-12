'use client'

import { useState, useCallback } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { FEATURE_LABELS } from '@/lib/services/ai-config-service'
import type { AiFeature } from '@/lib/ai/ai-features'

interface AiLog {
    id:         string
    provider:   string
    model:      string
    feature:    string
    tokensIn:   number
    tokensOut:  number
    cost:       number
    durationMs: number
    status:     string
    errorMsg:   string | null
    createdAt:  string
}

const STATUS_COLORS: Record<string, string> = {
    success:      'text-emerald-400 border-emerald-500/40',
    error:        'text-red-400 border-red-500/40',
    circuit_open: 'text-yellow-400 border-yellow-500/40',
}

const PROVIDER_BADGE: Record<string, string> = {
    deepseek: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    openai:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    claude:   'bg-orange-500/15 text-orange-400 border-orange-500/30',
    ollama:   'bg-purple-500/15 text-purple-400 border-purple-500/30',
    gemini:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
}

function fmtCost(v: number) {
    if (v === 0) return '$0'
    if (v < 0.0001) return `<$0.0001`
    return `$${v.toFixed(4)}`
}

function fmtMs(ms: number) {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
    return `${ms}ms`
}

function fmtDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

interface Props { initialLogs: AiLog[] }

export default function AiLogsTable({ initialLogs }: Props) {
    const [logs,     setLogs]     = useState<AiLog[]>(initialLogs)
    const [loading,  setLoading]  = useState(false)
    const [provider, setProvider] = useState('')
    const [feature,  setFeature]  = useState('')
    const [status,   setStatus]   = useState('')

    const load = useCallback(async (prov = provider, feat = feature, stat = status) => {
        setLoading(true)
        try {
            const p = new URLSearchParams({ limit: '50' })
            if (prov) p.set('provider', prov)
            if (feat) p.set('feature',  feat)
            if (stat) p.set('status',   stat)
            const r    = await fetch(`/api/admin/ai/logs?${p}`)
            const data = await r.json()
            setLogs(data.logs ?? [])
        } finally {
            setLoading(false)
        }
    }, [provider, feature, status])

    function handleFilter(key: 'provider' | 'feature' | 'status', value: string) {
        if (key === 'provider') { setProvider(value); load(value, feature, status) }
        if (key === 'feature')  { setFeature(value);  load(provider, value, status) }
        if (key === 'status')   { setStatus(value);   load(provider, feature, value) }
    }

    return (
        <div className="bg-zinc-900 border border-white/8 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mr-2">Logs recentes</p>

                <select
                    value={provider}
                    onChange={e => handleFilter('provider', e.target.value)}
                    className="text-xs bg-zinc-800 border border-white/10 rounded-lg px-2 py-1 text-zinc-300"
                >
                    <option value="">Todos os providers</option>
                    {['deepseek', 'openai', 'claude', 'ollama', 'gemini'].map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>

                <select
                    value={feature}
                    onChange={e => handleFilter('feature', e.target.value)}
                    className="text-xs bg-zinc-800 border border-white/10 rounded-lg px-2 py-1 text-zinc-300"
                >
                    <option value="">Todas as features</option>
                    {Object.entries(FEATURE_LABELS).filter(([k]) => k !== 'unknown').map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>

                <select
                    value={status}
                    onChange={e => handleFilter('status', e.target.value)}
                    className="text-xs bg-zinc-800 border border-white/10 rounded-lg px-2 py-1 text-zinc-300"
                >
                    <option value="">Todos os status</option>
                    <option value="success">Sucesso</option>
                    <option value="error">Erro</option>
                    <option value="circuit_open">Circuit open</option>
                </select>

                <button
                    onClick={() => load()}
                    disabled={loading}
                    className="ml-auto flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Atualizar
                </button>
            </div>

            {logs.length === 0 ? (
                <p className="text-xs text-zinc-600 py-6 text-center">Nenhum log encontrado</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-white/6 text-zinc-600 text-left">
                                <th className="pb-2 font-medium pr-3">Data</th>
                                <th className="pb-2 font-medium pr-3">Provider</th>
                                <th className="pb-2 font-medium pr-3">Feature</th>
                                <th className="pb-2 font-medium pr-3">Status</th>
                                <th className="pb-2 font-medium pr-3 text-right">Tokens ↑</th>
                                <th className="pb-2 font-medium pr-3 text-right">Tokens ↓</th>
                                <th className="pb-2 font-medium pr-3 text-right">Custo</th>
                                <th className="pb-2 font-medium text-right">Latência</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/4">
                            {logs.map(log => {
                                const statusCls = STATUS_COLORS[log.status] ?? 'text-zinc-400'
                                const provBadge = PROVIDER_BADGE[log.provider] ?? 'bg-zinc-700/30 text-zinc-400 border-zinc-600/30'
                                const featLabel = FEATURE_LABELS[log.feature as AiFeature | 'unknown'] ?? log.feature
                                return (
                                    <tr key={log.id} className="hover:bg-white/2 transition-colors">
                                        <td className="py-2 pr-3 text-zinc-500 whitespace-nowrap tabular-nums">{fmtDate(log.createdAt)}</td>
                                        <td className="py-2 pr-3">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] border ${provBadge}`}>
                                                {log.provider}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-3 text-zinc-400 max-w-[160px] truncate" title={featLabel}>{featLabel}</td>
                                        <td className={`py-2 pr-3 font-medium ${statusCls}`}>
                                            {log.status === 'success' ? '✓' : log.status === 'error' ? '✗' : '⚡'}
                                            {log.errorMsg && (
                                                <span className="ml-1 text-zinc-600 font-normal" title={log.errorMsg}>(?)</span>
                                            )}
                                        </td>
                                        <td className="py-2 pr-3 text-right text-zinc-500 tabular-nums">{log.tokensIn.toLocaleString()}</td>
                                        <td className="py-2 pr-3 text-right text-zinc-500 tabular-nums">{log.tokensOut.toLocaleString()}</td>
                                        <td className="py-2 pr-3 text-right text-zinc-400 tabular-nums">{fmtCost(log.cost)}</td>
                                        <td className="py-2 text-right text-zinc-600 tabular-nums">{fmtMs(log.durationMs)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
