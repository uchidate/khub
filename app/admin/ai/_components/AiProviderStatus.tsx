'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Zap, AlertTriangle, FlaskConical } from 'lucide-react'

interface ProviderStatus {
    name:                     string
    configured:               boolean
    circuitOpen:              boolean
    circuitCooldownRemaining: number
    consecutiveFailures:      number
    stats: {
        requests: number
        failures: number
        cost:     number
    }
}

interface StatusResponse {
    providers: ProviderStatus[]
    testedProvider?: string
    testLatencyMs?:  number
}

function StatusDot({ ok, warn }: { ok: boolean; warn?: boolean }) {
    if (!ok) return <span className="w-2 h-2 rounded-full bg-zinc-700 shrink-0" />
    if (warn) return <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0 animate-pulse" />
    return <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
}

function fmtCost(v: number) {
    if (v === 0) return '$0.00'
    if (v < 0.001) return `<$0.001`
    return `$${v.toFixed(4)}`
}

export default function AiProviderStatus() {
    const [data,    setData]    = useState<StatusResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [testing, setTesting] = useState(false)
    const [error,   setError]   = useState<string | null>(null)

    const load = useCallback((withTest = false) => {
        if (withTest) setTesting(true); else setLoading(true)
        const url = withTest ? '/api/admin/ai/status?test=true' : '/api/admin/ai/status'
        fetch(url)
            .then(r => r.json())
            .then(setData)
            .catch(() => setError('Erro ao carregar status'))
            .finally(() => { setLoading(false); setTesting(false) })
    }, [])

    useEffect(() => { load() }, [load])

    return (
        <div className="bg-zinc-900 border border-white/8 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Status dos providers</p>
                <div className="flex items-center gap-2">
                    {(loading || testing) && <Loader2 className="w-3 h-3 text-zinc-600 animate-spin" />}
                    <button
                        onClick={() => load(true)}
                        disabled={loading || testing}
                        title="Executar teste de latência ao vivo (faz chamada real à API)"
                        className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors disabled:opacity-40"
                    >
                        <FlaskConical className="w-3 h-3" />
                        {testing ? 'Testando...' : 'Testar'}
                    </button>
                </div>
            </div>

            {error && (
                <p className="text-xs text-red-400">{error}</p>
            )}

            {!loading && !error && data && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {data.providers.map(p => (
                        <div key={p.name} className="bg-zinc-800/50 rounded-lg p-3 border border-white/6 space-y-2">
                            <div className="flex items-center gap-2">
                                <StatusDot ok={p.configured && !p.circuitOpen} warn={p.configured && p.circuitOpen} />
                                <span className="text-xs font-semibold text-zinc-200 capitalize">{p.name}</span>
                            </div>

                            {!p.configured ? (
                                <span className="text-[10px] text-zinc-600">Não configurado</span>
                            ) : p.circuitOpen ? (
                                <div className="flex items-center gap-1 text-yellow-500">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span className="text-[10px]">Circuit open ({p.circuitCooldownRemaining}s)</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-emerald-500">
                                    <Zap className="w-3 h-3" />
                                    <span className="text-[10px]">Disponível</span>
                                </div>
                            )}

                            <div className="text-[10px] text-zinc-600 space-y-0.5">
                                <p>{p.stats.requests} req · {p.stats.failures} erros</p>
                                <p>{fmtCost(p.stats.cost)} sessão</p>
                                {p.name === data.testedProvider && data.testLatencyMs && (
                                    <p className="text-zinc-500">{data.testLatencyMs}ms ping</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
