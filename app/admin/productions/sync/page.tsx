'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { RefreshCw, Film, Wand2, Square } from 'lucide-react'

const SYNC_BATCH_SIZE = 100  // 100 × ~300ms + 3 TMDB calls ≈ 1-2min por lote
const STORAGE_KEY = 'khub-sync-productions-progress'

interface SavedProgress {
    offset: number
    totalGlobal: number
    grandEnriched: number
    grandComplete: number
    grandNoData: number
    grandErrors: number
    mode: string
}

type LogLine = {
    text: string
    type: 'info' | 'success' | 'warning' | 'error' | 'done' | 'progress'
    link?: { href: string; label: string }
}

function parseLine(line: string): LogLine {
    const [type, ...rest] = line.split(':')
    const payload = rest.join(':')
    switch (type) {
        case 'TOTAL_GLOBAL':
            return { text: `🌍 Total elegível: ${Number(payload).toLocaleString('pt-BR')} produções`, type: 'info' }
        case 'TOTAL':
            return { text: `📋 ${payload} produções neste lote`, type: 'info' }
        case 'PROGRESS': {
            const parts = payload.split(':')
            return { text: `⏳ [${parts[0]}] ${parts.slice(1).join(':')}`, type: 'progress' }
        }
        case 'ENRICHED': {
            const colonIdx = payload.indexOf(':')
            const name = colonIdx > -1 ? payload.slice(0, colonIdx) : payload
            const fields = colonIdx > -1 ? payload.slice(colonIdx + 1) : ''
            return { text: `✅ ${name} — atualizados: ${fields}`, type: 'success' }
        }
        case 'COMPLETE':
            return { text: `✓ Já completa: ${payload}`, type: 'progress' }
        case 'NO_DATA': {
            const lastColon = payload.lastIndexOf(':')
            const name = lastColon > 0 ? payload.slice(0, lastColon) : payload
            const prodId = lastColon > 0 ? payload.slice(lastColon + 1) : ''
            return {
                text: `➖ Sem dados no TMDB: ${name}`,
                type: 'warning',
                link: prodId ? { href: `/admin/productions/${prodId}`, label: 'Verificar →' } : undefined,
            }
        }
        case 'ERROR':
            return { text: `❌ Erro: ${payload}`, type: 'error' }
        case 'DONE': {
            const fmt = payload
                .replace('enriched=', 'enriquecidas: ')
                .replace(',complete=', ' | já completas: ')
                .replace(',noData=', ' | sem dados TMDB: ')
                .replace(',errors=', ' | erros: ')
            return { text: `🎉 Concluído! ${fmt}`, type: 'done' }
        }
        default:
            return { text: line, type: 'info' }
    }
}

const lineColor = (type: LogLine['type']) => {
    if (type === 'success') return 'text-green-400'
    if (type === 'error') return 'text-red-400'
    if (type === 'warning') return 'text-yellow-400'
    if (type === 'done') return 'text-purple-400 font-bold'
    if (type === 'progress') return 'text-zinc-500'
    return 'text-zinc-300'
}

export default function SyncProductionsTmdbPage() {
    const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null)
    const [running, setRunning] = useState(false)
    const [log, setLog] = useState<LogLine[]>([])
    const [totalGlobal, setTotalGlobal] = useState(0)
    const [processed, setProcessed] = useState(0)
    const [stats, setStats] = useState<{ enriched: number; noData: number; errors: number } | null>(null)
    const abortRef = useRef(false)
    const logEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY)
            if (saved) setSavedProgress(JSON.parse(saved))
        } catch { /* ignore */ }
    }, [])

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [log])

    const runBatches = useCallback(async (mode: 'empty_only' | 'smart' | 'all', resume?: SavedProgress) => {
        abortRef.current = false
        setRunning(true)
        setSavedProgress(null)
        setStats(null)

        let offset = resume?.offset ?? 0
        let total = resume?.totalGlobal ?? 0
        let grandEnriched = resume?.grandEnriched ?? 0
        let grandComplete = resume?.grandComplete ?? 0
        let grandNoData = resume?.grandNoData ?? 0
        let grandErrors = resume?.grandErrors ?? 0

        if (resume) {
            setTotalGlobal(total)
            setProcessed(offset)
            setLog([{
                text: `▶️ Retomando do offset ${offset.toLocaleString('pt-BR')} de ${total.toLocaleString('pt-BR')} (acumulado: ${grandEnriched} enriquecidas)`,
                type: 'info',
            }])
            setStats({ enriched: grandEnriched, noData: grandNoData, errors: grandErrors })
        } else {
            setLog([{ text: `🚀 Iniciando sync (modo: ${mode}) em lotes de ${SYNC_BATCH_SIZE}...`, type: 'info' }])
            setTotalGlobal(0)
            setProcessed(0)
        }

        try {
            while (!abortRef.current) {
                const res = await fetch('/api/admin/sync-tmdb-productions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode, limit: SYNC_BATCH_SIZE, offset }),
                })

                if (!res.ok || !res.body) {
                    setLog(prev => [...prev, { text: `❌ Erro HTTP ${res.status}`, type: 'error' }])
                    break
                }

                const reader = res.body.getReader()
                const decoder = new TextDecoder()
                let buffer = ''
                let batchSize = 0

                for (;;) {
                    const { done, value } = await reader.read()
                    if (done) break
                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ''

                    for (const line of lines) {
                        if (!line.trim()) continue

                        if (line.startsWith('TOTAL_GLOBAL:')) {
                            total = parseInt(line.replace('TOTAL_GLOBAL:', ''))
                            setTotalGlobal(total)
                            continue
                        }
                        if (line.startsWith('TOTAL:')) {
                            batchSize = parseInt(line.replace('TOTAL:', ''))
                            const batchNum = Math.floor(offset / SYNC_BATCH_SIZE) + 1
                            const totalBatches = total > 0 ? Math.ceil(total / SYNC_BATCH_SIZE) : '?'
                            setLog(prev => [...prev, {
                                text: `📦 Lote ${batchNum}/${totalBatches} — ${batchSize} produções`,
                                type: 'info',
                            }])
                            continue
                        }
                        if (line.startsWith('PROGRESS:')) {
                            setProcessed(offset + parseInt(line.split(':')[1].split('/')[0]))
                        }
                        if (line.startsWith('DONE:')) {
                            const m = line.match(/enriched=(\d+),complete=(\d+),noData=(\d+),errors=(\d+)/)
                            if (m) {
                                grandEnriched += parseInt(m[1])
                                grandComplete += parseInt(m[2])
                                grandNoData += parseInt(m[3])
                                grandErrors += parseInt(m[4])
                                setStats({ enriched: grandEnriched, noData: grandNoData, errors: grandErrors })
                            }
                            continue
                        }

                        setLog(prev => [...prev, parseLine(line)])
                    }
                }

                offset += SYNC_BATCH_SIZE

                const progress: SavedProgress = { offset, totalGlobal: total, grandEnriched, grandComplete, grandNoData, grandErrors, mode }
                try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(progress)) } catch { /* ignore */ }

                if (batchSize < SYNC_BATCH_SIZE || offset >= total) {
                    setLog(prev => [...prev, {
                        text: `🎉 Todos os lotes concluídos! Enriquecidas: ${grandEnriched} | Completas: ${grandComplete} | Sem dados: ${grandNoData} | Erros: ${grandErrors}`,
                        type: 'done',
                    }])
                    setProcessed(total)
                    try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
                    break
                }

                await new Promise(r => setTimeout(r, 1500))
                setLog(prev => [...prev, {
                    text: `⏭️ Próximo lote — offset ${offset.toLocaleString('pt-BR')} de ${total.toLocaleString('pt-BR')}...`,
                    type: 'info',
                }])
            }

            if (abortRef.current) {
                const progress: SavedProgress = { offset, totalGlobal: total, grandEnriched, grandComplete, grandNoData, grandErrors, mode }
                try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); setSavedProgress(progress) } catch { /* ignore */ }
                setLog(prev => [...prev, {
                    text: `⏸️ Pausado no offset ${offset.toLocaleString('pt-BR')}. Clique "Retomar" para continuar.`,
                    type: 'info',
                }])
            }
        } catch (e) {
            setLog(prev => [...prev, { text: `❌ Erro inesperado: ${e}`, type: 'error' }])
            const progress: SavedProgress = { offset, totalGlobal: total, grandEnriched, grandComplete, grandNoData, grandErrors, mode }
            try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); setSavedProgress(progress) } catch { /* ignore */ }
            setLog(prev => [...prev, {
                text: `💾 Progresso salvo. Use "Retomar" para continuar do offset ${offset.toLocaleString('pt-BR')}.`,
                type: 'info',
            }])
        } finally {
            setRunning(false)
        }
    }, [])

    const pct = totalGlobal > 0 ? Math.round((processed / totalGlobal) * 100) : 0

    return (
        <AdminLayout title="Sincronizar TMDB — Produções">
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-zinc-800 rounded-xl">
                        <Film className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white">Sincronizar dados do TMDB — Produções</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">
                            Atualiza em lote: sinopse, poster, backdrop, tagline, ano, nota, trailer, episódios, canal e mais
                        </p>
                    </div>
                    <Link
                        href="/admin/productions"
                        className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        ← Produções
                    </Link>
                </div>

                {/* Retomar progresso salvo */}
                {savedProgress && !running && (
                    <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                        <div>
                            <p className="text-sm font-bold text-amber-400">Sync pausado — progresso salvo</p>
                            <p className="text-xs text-zinc-400 mt-0.5">
                                Offset {savedProgress.offset.toLocaleString('pt-BR')} de {savedProgress.totalGlobal.toLocaleString('pt-BR')} ·
                                modo: {savedProgress.mode} · {savedProgress.grandEnriched} enriquecidas
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => runBatches((savedProgress.mode as 'empty_only' | 'smart' | 'all') ?? 'empty_only', savedProgress)}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-bold transition-colors"
                            >
                                ▶️ Retomar
                            </button>
                            <button
                                onClick={() => { try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ } setSavedProgress(null) }}
                                className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-sm transition-colors"
                            >
                                Descartar
                            </button>
                        </div>
                    </div>
                )}

                {/* Modos de sync */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ModeCard
                        title="Preencher vazios"
                        description="Só preenche campos nulos. Seguro e não-destrutivo."
                        color="purple"
                        disabled={running}
                        onClick={() => runBatches('empty_only')}
                        icon={<Wand2 className="w-4 h-4" />}
                    />
                    <ModeCard
                        title="Smart sync"
                        description="Atualiza tudo, exceto sinopse marcada como 'manual'."
                        color="teal"
                        disabled={running}
                        onClick={() => runBatches('smart')}
                        icon={<RefreshCw className="w-4 h-4" />}
                    />
                    <ModeCard
                        title="Forçar todos"
                        description="Sobrescreve absolutamente todos os campos com TMDB."
                        color="amber"
                        disabled={running}
                        onClick={() => runBatches('all')}
                        icon={<RefreshCw className="w-4 h-4" />}
                    />
                </div>

                {/* Progresso geral */}
                {(running || processed > 0) && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-zinc-400">
                            <span>{processed.toLocaleString('pt-BR')} / {totalGlobal.toLocaleString('pt-BR')} produções</span>
                            <span>{pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Estatísticas */}
                {stats && (
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-black/30 border border-green-500/20 rounded-lg p-3 text-center">
                            <p className="text-2xl font-black text-green-400">{stats.enriched}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-widest font-bold">Enriquecidas</p>
                        </div>
                        <div className="bg-black/30 border border-yellow-500/20 rounded-lg p-3 text-center">
                            <p className="text-2xl font-black text-yellow-400">{stats.noData}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-widest font-bold">Sem dados TMDB</p>
                        </div>
                        <div className="bg-black/30 border border-red-500/20 rounded-lg p-3 text-center">
                            <p className="text-2xl font-black text-red-400">{stats.errors}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-widest font-bold">Erros</p>
                        </div>
                    </div>
                )}

                {/* Parar */}
                {running && (
                    <div className="flex justify-end">
                        <button
                            onClick={() => { abortRef.current = true }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors"
                        >
                            <Square className="w-4 h-4" />
                            Parar (salva progresso)
                        </button>
                    </div>
                )}

                {/* Log */}
                {log.length > 0 && (
                    <div className="bg-black/40 rounded-xl p-4 max-h-96 overflow-y-auto font-mono text-xs space-y-1 border border-white/5">
                        {log.map((line, i) => (
                            <div key={i} className={`flex items-start gap-2 ${lineColor(line.type)}`}>
                                <span className="flex-1">{line.text}</span>
                                {line.link && (
                                    <Link
                                        href={line.link.href}
                                        target="_blank"
                                        className="underline text-amber-400 hover:text-amber-300 whitespace-nowrap flex-shrink-0"
                                    >
                                        {line.link.label}
                                    </Link>
                                )}
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}

function ModeCard({
    title, description, color, disabled, onClick, icon,
}: {
    title: string
    description: string
    color: 'purple' | 'teal' | 'amber'
    disabled: boolean
    onClick: () => void
    icon: React.ReactNode
}) {
    const colors = {
        purple: 'border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400',
        teal:   'border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10 text-teal-400',
        amber:  'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400',
    }
    const btnColors = {
        purple: 'bg-purple-600 hover:bg-purple-500',
        teal:   'bg-teal-600 hover:bg-teal-500',
        amber:  'bg-amber-600 hover:bg-amber-500',
    }
    return (
        <div className={`rounded-xl border p-4 space-y-3 transition-colors ${colors[color]}`}>
            <div>
                <p className="text-sm font-black text-white">{title}</p>
                <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{description}</p>
            </div>
            <button
                onClick={onClick}
                disabled={disabled}
                className={`w-full flex items-center justify-center gap-2 py-2 ${btnColors[color]} disabled:opacity-40 text-white rounded-lg text-sm font-bold transition-colors`}
            >
                {disabled ? <RefreshCw className="w-4 h-4 animate-spin" /> : icon}
                {disabled ? 'Processando...' : title}
            </button>
        </div>
    )
}
