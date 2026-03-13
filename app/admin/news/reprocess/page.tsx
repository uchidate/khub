'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { BatchProgressPanel, type StreamProgress, type StreamLogEntry } from '@/components/admin/news/BatchProgressPanel'
import {
    RefreshCw, RotateCcw, AlertTriangle, Loader2,
    GitMerge, FlaskConical, CheckCircle, XCircle, CalendarDays, X,
} from 'lucide-react'

// ─── Config ───────────────────────────────────────────────────────────────────

const SOURCES = ['Soompi', 'Koreaboo', 'Dramabeans', 'Asian Junkie', 'HelloKpop', 'Kpopmap'] as const
type Source = typeof SOURCES[number]

const SOURCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    Soompi:         { bg: 'bg-purple-500/15', text: 'text-purple-300',  border: 'border-purple-500/30' },
    Koreaboo:       { bg: 'bg-pink-500/15',   text: 'text-pink-300',    border: 'border-pink-500/30'   },
    Dramabeans:     { bg: 'bg-blue-500/15',   text: 'text-blue-300',    border: 'border-blue-500/30'   },
    'Asian Junkie': { bg: 'bg-amber-500/15',  text: 'text-amber-300',   border: 'border-amber-500/30'  },
    HelloKpop:      { bg: 'bg-emerald-500/15',text: 'text-emerald-300', border: 'border-emerald-500/30'},
    Kpopmap:        { bg: 'bg-violet-500/15', text: 'text-violet-300',  border: 'border-violet-500/30' },
}

function todayISO()        { return new Date().toISOString().split('T')[0] }
function daysAgoISO(n: number) {
    const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]
}

interface GenerateResult {
    success: boolean
    news?: { title: string; artistsCount: number; artists: { name: string }[] }
    error?: string
    duration?: number
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewsReprocessPage() {
    // Source reprocess
    const [selectedSource, setSelectedSource] = useState<Source | null>(null)
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [sourceCount, setSourceCount] = useState<number | null>(null)
    const [sourceTotal, setSourceTotal] = useState(200)
    const [reprocessResume, setReprocessResume] = useState<{
        source: string; dateFrom: string; dateTo: string; offset: number; total: number
    } | null>(null)

    // Streaming progress
    const [streamProgress, setStreamProgress] = useState<StreamProgress | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    // Dedup
    const [dedupRunning, setDedupRunning] = useState(false)
    const [dedupResult, setDedupResult] = useState<{ deleted: number; normalized: number } | null>(null)

    // Generate one
    const [generating, setGenerating] = useState(false)
    const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null)

    const isStreaming = streamProgress?.phase === 'running'

    // Fetch DB count for selected source
    const fetchSourceCount = useCallback((source: string, from: string, to: string) => {
        setSourceCount(null)
        const params = new URLSearchParams({ source })
        if (from) params.set('dateFrom', from)
        if (to) params.set('dateTo', to)
        fetch(`/api/admin/news/reprocess?${params}`)
            .then(r => r.json())
            .then(d => setSourceCount(typeof d.count === 'number' ? d.count : null))
            .catch(() => setSourceCount(null))
    }, [])

    useEffect(() => {
        if (!selectedSource) { setSourceCount(null); return }
        fetchSourceCount(selectedSource, dateFrom, dateTo)
    }, [selectedSource, dateFrom, dateTo, fetchSourceCount])

    // ── Batch candidates reprocess ─────────────────────────────────────────

    const handleBatchReprocess = async () => {
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        setStreamProgress({
            phase: 'running', label: 'Reprocessando candidatos...',
            total: 0, current: 0, updated: 0, skipped: 0, exists: 0, errors: 0, log: [],
        })

        try {
            const res = await fetch('/api/admin/news/reprocess?mode=batch&limit=50&stream=1', {
                method: 'POST', signal: controller.signal,
            })
            if (!res.ok || !res.body) {
                setStreamProgress(prev => prev ? { ...prev, phase: 'error' } : null)
                return
            }

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() ?? ''

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue
                    try {
                        const event = JSON.parse(line.slice(6))
                        if (event.type === 'start') {
                            setStreamProgress(prev => prev ? { ...prev, total: event.total } : null)
                        } else if (event.type === 'item') {
                            const entry: StreamLogEntry = {
                                title: event.title, result: event.result, artistCount: event.artistCount ?? 0,
                            }
                            setStreamProgress(prev => {
                                if (!prev) return null
                                return {
                                    ...prev,
                                    current: event.current,
                                    total: event.total,
                                    updated: prev.updated + (event.result === 'updated' ? 1 : 0),
                                    skipped: prev.skipped + (event.result === 'skipped' ? 1 : 0),
                                    errors:  prev.errors  + (event.result === 'error'   ? 1 : 0),
                                    log: [...prev.log, entry].slice(-100),
                                }
                            })
                        } else if (event.type === 'done') {
                            setStreamProgress(prev => prev ? {
                                ...prev, phase: 'done', current: prev.total,
                                updated: event.updated, skipped: event.skipped, errors: event.errors,
                            } : null)
                        } else if (event.type === 'error') {
                            setStreamProgress(prev => prev ? { ...prev, phase: 'error' } : null)
                        }
                    } catch { /* skip */ }
                }
            }
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                setStreamProgress(prev => prev ? { ...prev, phase: 'error' } : null)
            }
        }
    }

    // ── Source reprocess (batched with offset support) ─────────────────────

    const handleSourceReprocess = async (startOffset = 0) => {
        if (!selectedSource) return
        const total = (dateFrom || dateTo) ? (sourceCount ?? 200) : sourceTotal
        const BATCH = 50

        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller
        setReprocessResume(null)

        setStreamProgress({
            phase: 'running', label: `Reprocessando ${selectedSource}...`,
            total, current: startOffset, updated: 0, skipped: 0, exists: 0, errors: 0, log: [],
        })

        let offset = startOffset
        let accumUpdated = 0, accumSkipped = 0, accumErrors = 0

        while (offset < total && !controller.signal.aborted) {
            const limit = Math.min(BATCH, total - offset)
            const batchParams = new URLSearchParams({
                mode: 'batch', source: selectedSource, all: '1',
                limit: String(limit), offset: String(offset), stream: '1',
            })
            if (dateFrom) batchParams.set('dateFrom', dateFrom)
            if (dateTo)   batchParams.set('dateTo', dateTo)

            let batchUpdated = 0, batchSkipped = 0, batchErrors = 0, batchDone = false

            try {
                const res = await fetch(`/api/admin/news/reprocess?${batchParams}`, {
                    method: 'POST', signal: controller.signal,
                })
                if (!res.ok || !res.body) {
                    setStreamProgress(prev => prev ? { ...prev, phase: 'error' } : null)
                    setReprocessResume({ source: selectedSource, dateFrom, dateTo, offset, total })
                    return
                }

                const reader = res.body.getReader()
                const decoder = new TextDecoder()
                let buffer = ''

                while (!batchDone) {
                    const { done, value } = await reader.read()
                    if (done) break
                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() ?? ''

                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue
                        try {
                            const event = JSON.parse(line.slice(6))
                            if (event.type === 'item') {
                                if (event.result === 'updated') batchUpdated++
                                else if (event.result === 'skipped') batchSkipped++
                                else if (event.result === 'error') batchErrors++

                                const entry: StreamLogEntry = {
                                    title: event.title, result: event.result, artistCount: event.artistCount ?? 0,
                                }
                                setStreamProgress(prev => prev ? {
                                    ...prev,
                                    current: offset + event.current,
                                    updated: accumUpdated + batchUpdated,
                                    skipped: accumSkipped + batchSkipped,
                                    errors:  accumErrors  + batchErrors,
                                    log: [...prev.log, entry].slice(-100),
                                } : null)
                            } else if (event.type === 'done') {
                                batchDone = true
                            } else if (event.type === 'error') {
                                setStreamProgress(prev => prev ? { ...prev, phase: 'error' } : null)
                                setReprocessResume({ source: selectedSource, dateFrom, dateTo, offset, total })
                                return
                            }
                        } catch { /* skip */ }
                    }
                }
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    setStreamProgress(prev => prev ? { ...prev, phase: 'error' } : null)
                    setReprocessResume({ source: selectedSource, dateFrom, dateTo, offset, total })
                }
                return
            }

            accumUpdated += batchUpdated
            accumSkipped += batchSkipped
            accumErrors  += batchErrors
            offset += limit
        }

        setReprocessResume(null)
        setStreamProgress(prev => prev ? {
            ...prev, phase: 'done', current: total,
            updated: accumUpdated, skipped: accumSkipped, errors: accumErrors,
        } : null)
        fetchSourceCount(selectedSource, dateFrom, dateTo)
    }

    // ── Dedup ─────────────────────────────────────────────────────────────

    const handleDedup = async () => {
        setDedupRunning(true)
        setDedupResult(null)
        try {
            const res = await fetch('/api/admin/news/dedup', { method: 'POST' })
            const data = await res.json()
            if (data.ok) setDedupResult({ deleted: data.deleted, normalized: data.normalized })
        } finally {
            setDedupRunning(false)
        }
    }

    // ── Generate one ──────────────────────────────────────────────────────

    const handleGenerateOne = async () => {
        setGenerating(true)
        setGenerateResult(null)
        try {
            const res = await fetch('/api/admin/news/generate-one', { method: 'POST' })
            setGenerateResult(await res.json())
        } catch {
            setGenerateResult({ success: false, error: 'Erro de rede' })
        } finally {
            setGenerating(false)
        }
    }

    return (
        <AdminLayout title="Reprocessar Notícias">
            <div className="max-w-3xl space-y-8">

                {/* ── Card: Candidatos ──────────────────────────────────── */}
                <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-800">
                        <h2 className="font-bold text-white text-base">Reprocessar candidatos</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Re-busca e atualiza artigos sem imagem ou com conteúdo curto/truncado (lote de 50)
                        </p>
                    </div>
                    <div className="px-5 py-4">
                        <button
                            onClick={handleBatchReprocess}
                            disabled={isStreaming}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
                        >
                            {isStreaming
                                ? <Loader2 size={15} className="animate-spin" />
                                : <RefreshCw size={15} />
                            }
                            {isStreaming ? 'Processando...' : 'Reprocessar candidatos'}
                        </button>
                    </div>
                </section>

                {/* ── Card: Por fonte ───────────────────────────────────── */}
                <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-800">
                        <h2 className="font-bold text-white text-base">Reprocessar por fonte</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Reprocessa todos os artigos de uma fonte, re-buscando conteúdo e re-extraindo artistas
                        </p>
                    </div>
                    <div className="px-5 py-5 space-y-4">
                        {/* Source pills */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {SOURCES.map(s => {
                                const c = SOURCE_COLORS[s]
                                const active = selectedSource === s
                                return (
                                    <button
                                        key={s}
                                        onClick={() => { setSelectedSource(prev => prev === s ? null : s); setDateFrom(''); setDateTo(''); setReprocessResume(null) }}
                                        disabled={isStreaming}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border disabled:opacity-50 ${
                                            active && c
                                                ? `${c.bg} ${c.text} ${c.border}`
                                                : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                )
                            })}
                        </div>

                        {selectedSource && (
                            <div className="space-y-4">
                                {/* Period */}
                                <div className="space-y-2">
                                    <p className="text-xs text-zinc-500 font-medium">Período (opcional)</p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {[
                                            { label: 'Últimos 7d',  from: daysAgoISO(7),  to: todayISO() },
                                            { label: 'Últimos 30d', from: daysAgoISO(30), to: todayISO() },
                                            { label: 'Últimos 90d', from: daysAgoISO(90), to: todayISO() },
                                        ].map(preset => (
                                            <button
                                                key={preset.label}
                                                onClick={() => { setDateFrom(preset.from); setDateTo(preset.to) }}
                                                disabled={isStreaming}
                                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-zinc-400 border border-zinc-700 hover:border-purple-500/50 hover:text-purple-300 transition-colors disabled:opacity-50"
                                            >
                                                <CalendarDays size={11} />
                                                {preset.label}
                                            </button>
                                        ))}
                                        <input
                                            type="date" value={dateFrom}
                                            onChange={e => setDateFrom(e.target.value)}
                                            disabled={isStreaming}
                                            className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
                                        />
                                        <span className="text-zinc-600 text-xs">até</span>
                                        <input
                                            type="date" value={dateTo}
                                            onChange={e => setDateTo(e.target.value)}
                                            disabled={isStreaming}
                                            className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
                                        />
                                        {(dateFrom || dateTo) && (
                                            <button onClick={() => { setDateFrom(''); setDateTo('') }} disabled={isStreaming} className="p-1 text-zinc-600 hover:text-zinc-300 disabled:opacity-50">
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Count + quantity selector */}
                                <div className="flex items-center gap-4 text-sm flex-wrap">
                                    <span className="text-zinc-400">
                                        {sourceCount === null ? (
                                            <span className="flex items-center gap-1 text-zinc-600"><Loader2 size={12} className="animate-spin" /> carregando...</span>
                                        ) : (
                                            <><strong className="text-zinc-200">{sourceCount.toLocaleString('pt-BR')}</strong> <span className="text-zinc-500">no banco{(dateFrom || dateTo) ? ' (período)' : ''}</span></>
                                        )}
                                    </span>
                                    {!(dateFrom || dateTo) && (
                                        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                                            Processar
                                            <input
                                                type="number" min={1} max={sourceCount ?? 9999} value={sourceTotal}
                                                onChange={e => setSourceTotal(Math.max(1, parseInt(e.target.value) || 1))}
                                                disabled={isStreaming}
                                                className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-200 text-center focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
                                            />
                                            de {sourceCount ?? '?'}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        onClick={() => handleSourceReprocess(0)}
                                        disabled={isStreaming || sourceCount === null}
                                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-xl hover:border-purple-500/50 hover:text-purple-300 transition-all disabled:opacity-50 text-sm"
                                    >
                                        {isStreaming
                                            ? <Loader2 size={14} className="animate-spin" />
                                            : <RefreshCw size={14} />
                                        }
                                        Reprocessar {(dateFrom || dateTo) ? 'período' : selectedSource}
                                    </button>

                                    {reprocessResume &&
                                     reprocessResume.source === selectedSource &&
                                     reprocessResume.dateFrom === dateFrom &&
                                     reprocessResume.dateTo === dateTo && (
                                        <button
                                            onClick={() => handleSourceReprocess(reprocessResume.offset)}
                                            disabled={isStreaming}
                                            title={`Retomar do artigo ${reprocessResume.offset + 1} de ${reprocessResume.total}`}
                                            className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-amber-700/60 text-amber-400 font-semibold rounded-xl hover:border-amber-500/80 hover:text-amber-300 transition-all disabled:opacity-50 text-sm"
                                        >
                                            <RotateCcw size={14} />
                                            Retomar do {reprocessResume.offset + 1}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Progress panel */}
                {streamProgress && (
                    <BatchProgressPanel
                        progress={streamProgress}
                        onClose={() => setStreamProgress(null)}
                        updatedLabel="reprocessadas"
                        skippedLabel="sem conteúdo"
                    />
                )}

                {/* ── Card: Dedup ───────────────────────────────────────── */}
                <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-800">
                        <h2 className="font-bold text-white text-base">Remover duplicatas</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Identifica artigos com o mesmo URL canônico (strip UTM) e mantém o registro com
                            conteúdo mais completo
                        </p>
                    </div>
                    <div className="px-5 py-4 space-y-3">
                        <button
                            onClick={handleDedup}
                            disabled={dedupRunning || isStreaming}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-xl hover:border-amber-500/50 hover:text-amber-300 transition-all disabled:opacity-50 text-sm"
                        >
                            {dedupRunning
                                ? <Loader2 size={14} className="animate-spin" />
                                : <GitMerge size={14} />
                            }
                            {dedupRunning ? 'Executando...' : 'Executar deduplicação'}
                        </button>

                        {dedupResult && (
                            <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                                <span className="text-emerald-300">
                                    <strong>{dedupResult.deleted}</strong> artigos removidos,{' '}
                                    <strong>{dedupResult.normalized}</strong> URLs normalizadas
                                </span>
                                <button onClick={() => setDedupResult(null)} className="ml-auto text-zinc-500 hover:text-white">✕</button>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Card: Gerar 1 ─────────────────────────────────────── */}
                <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-800">
                        <h2 className="font-bold text-white text-base">Gerar 1 notícia</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Busca e processa um único artigo pendente automaticamente (pipeline completo)
                        </p>
                    </div>
                    <div className="px-5 py-4 space-y-3">
                        <button
                            onClick={handleGenerateOne}
                            disabled={generating || isStreaming}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-xl hover:border-emerald-500/50 hover:text-emerald-300 transition-all disabled:opacity-50 text-sm"
                        >
                            {generating
                                ? <Loader2 size={14} className="animate-spin" />
                                : <FlaskConical size={14} />
                            }
                            {generating ? 'Gerando...' : 'Gerar 1 notícia'}
                        </button>

                        {generateResult && (
                            <div className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${
                                generateResult.success
                                    ? 'bg-emerald-500/10 border-emerald-500/20'
                                    : 'bg-red-500/10 border-red-500/20'
                            }`}>
                                {generateResult.success
                                    ? <CheckCircle size={15} className="text-emerald-400 mt-0.5 shrink-0" />
                                    : <XCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
                                }
                                <div className="flex-1">
                                    {generateResult.success && generateResult.news ? (
                                        <>
                                            <p className="font-bold text-white">{generateResult.news.title}</p>
                                            <p className="text-zinc-400 mt-0.5 text-xs">
                                                {generateResult.news.artistsCount > 0
                                                    ? `Artistas: ${generateResult.news.artists.map(a => a.name).join(', ')}`
                                                    : 'Nenhum artista identificado'
                                                }
                                                {generateResult.duration && ` · ${(generateResult.duration / 1000).toFixed(1)}s`}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-red-400">{generateResult.error}</p>
                                    )}
                                </div>
                                <button onClick={() => setGenerateResult(null)} className="text-zinc-500 hover:text-white">✕</button>
                            </div>
                        )}
                    </div>
                </section>

            </div>
        </AdminLayout>
    )
}
