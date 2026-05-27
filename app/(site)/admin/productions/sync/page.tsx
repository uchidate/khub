'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { RefreshCw, Film, Wand2, Square, ShieldAlert } from 'lucide-react'
import { AdminButton, StatCard } from '@/components/admin'

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
    if (type === 'done') return 'text-accent font-bold'
    if (type === 'progress') return 'text-muted'
    return 'text-foreground'
}

export default function SyncProductionsTmdbPage() {
    const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null)
    const [running, setRunning] = useState(false)
    const [log, setLog] = useState<LogLine[]>([])
    const [totalGlobal, setTotalGlobal] = useState(0)
    const [processed, setProcessed] = useState(0)
    const [stats, setStats] = useState<{ enriched: number; noData: number; errors: number } | null>(null)
    const [allowFullOverwrite, setAllowFullOverwrite] = useState(false)
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

    const runBatches = useCallback(async (mode: 'empty_only' | 'smart' | 'all', resume?: SavedProgress, confirmOverwrite = false) => {
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
                    body: JSON.stringify({ mode, limit: SYNC_BATCH_SIZE, offset, confirmOverwrite }),
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
                    <div className="p-2 bg-surface rounded-xl">
                        <Film className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-foreground">Sincronizar dados do TMDB — Produções</h1>
                        <p className="text-sm text-muted mt-0.5">
                            Atualiza em lote: sinopse, poster, backdrop, tagline, ano, nota, trailer, episódios, canal e mais
                        </p>
                    </div>
                    <Link
                        href="/admin/productions"
                        className="ml-auto text-xs text-muted hover:text-foreground transition-colors"
                    >
                        ← Produções
                    </Link>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
                    <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-2">
                        <p className="text-sm font-bold text-foreground">Recuperação manual com risco de sobrescrita</p>
                        <p className="text-xs text-muted leading-relaxed">
                            O fluxo editorial principal agora é a fila de enriquecimento com prompt e retorno do Gemini. Prefira <strong>Preencher vazios</strong>; o modo completo pode substituir metadados previamente curados.
                        </p>
                        <label className="inline-flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={allowFullOverwrite}
                                onChange={event => setAllowFullOverwrite(event.target.checked)}
                                className="accent-amber-500"
                            />
                            Liberar temporariamente o modo “Forçar todos” nesta sessão
                        </label>
                    </div>
                </div>

                {/* Retomar progresso salvo */}
                {savedProgress && !running && (
                    <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                        <div>
                            <p className="text-sm font-bold text-amber-400">Sync pausado — progresso salvo</p>
                            <p className="text-xs text-muted mt-0.5">
                                Offset {savedProgress.offset.toLocaleString('pt-BR')} de {savedProgress.totalGlobal.toLocaleString('pt-BR')} ·
                                modo: {savedProgress.mode} · {savedProgress.grandEnriched} enriquecidas
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <AdminButton
                                variant="warning"
                                size="md"
                                disabled={savedProgress.mode === 'all' && !allowFullOverwrite}
                                onClick={() => runBatches((savedProgress.mode as 'empty_only' | 'smart' | 'all') ?? 'empty_only', savedProgress, savedProgress.mode === 'all' && allowFullOverwrite)}
                            >
                                ▶️ Retomar
                            </AdminButton>
                            <AdminButton
                                variant="secondary"
                                size="md"
                                onClick={() => { try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ } setSavedProgress(null) }}
                            >
                                Descartar
                            </AdminButton>
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
                        description="Preenche dados faltantes e preserva sinopse manual ou já revisada."
                        color="teal"
                        disabled={running}
                        onClick={() => runBatches('smart')}
                        icon={<RefreshCw className="w-4 h-4" />}
                    />
                    <ModeCard
                        title="Forçar todos"
                        description="Sobrescreve metadados com TMDB. Exige liberação explícita acima."
                        color="amber"
                        disabled={running || !allowFullOverwrite}
                        onClick={() => runBatches('all', undefined, true)}
                        icon={<RefreshCw className="w-4 h-4" />}
                    />
                </div>

                {/* Progresso geral */}
                {(running || processed > 0) && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted">
                            <span>{processed.toLocaleString('pt-BR')} / {totalGlobal.toLocaleString('pt-BR')} produções</span>
                            <span>{pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                            <div
                                className="h-full bg-accent rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Estatísticas */}
                {stats && (
                    <div className="grid grid-cols-3 gap-3">
                        <StatCard label="Enriquecidas" value={stats.enriched} color="text-green-400" />
                        <StatCard label="Sem dados TMDB" value={stats.noData} color="text-yellow-400" />
                        <StatCard label="Erros" value={stats.errors} color="text-red-400" />
                    </div>
                )}

                {/* Parar */}
                {running && (
                    <div className="flex justify-end">
                        <AdminButton
                            variant="danger"
                            size="md"
                            onClick={() => { abortRef.current = true }}
                        >
                            <Square className="w-4 h-4" />
                            Parar (salva progresso)
                        </AdminButton>
                    </div>
                )}

                {/* Log */}
                {log.length > 0 && (
                    <div className="bg-background rounded-xl p-4 max-h-96 overflow-y-auto font-mono text-xs space-y-1 border border-border">
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
        purple: 'border-accent/30 bg-accent/5 hover:bg-accent/10 text-accent',
        teal:   'border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10 text-teal-400',
        amber:  'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400',
    }
    const btnColors = {
        purple: 'bg-accent hover:bg-accent/90',
        teal:   'bg-teal-600 hover:bg-teal-500',
        amber:  'bg-amber-600 hover:bg-amber-500',
    }
    return (
        <div className={`rounded-xl border p-4 space-y-3 transition-colors ${colors[color]}`}>
            <div>
                <p className="text-sm font-black text-foreground">{title}</p>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">{description}</p>
            </div>
            <button
                onClick={onClick}
                disabled={disabled}
                className={`w-full flex items-center justify-center gap-2 py-2 ${btnColors[color]} disabled:opacity-40 text-foreground rounded-lg text-sm font-bold transition-colors`}
            >
                {disabled ? <RefreshCw className="w-4 h-4 animate-spin" /> : icon}
                {disabled ? 'Processando...' : title}
            </button>
        </div>
    )
}
