'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { BatchProgressPanel, type StreamProgress, type StreamLogEntry } from '@/components/admin/news/BatchProgressPanel'
import { Download, Loader2, CalendarDays, X } from 'lucide-react'

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

// Date preset helpers
function todayISO() {
    return new Date().toISOString().split('T')[0]
}
function daysAgoISO(n: number) {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d.toISOString().split('T')[0]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewsImportPage() {
    const [selectedSource, setSelectedSource] = useState<Source | null>(null)
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [dbCount, setDbCount] = useState<number | null>(null)
    const [availableCount, setAvailableCount] = useState<number | null | -1>(null)
    const [streamProgress, setStreamProgress] = useState<StreamProgress | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    const isStreaming = streamProgress?.phase === 'running'

    // Fetch DB count + available count from source API
    const fetchCounts = useCallback((source: string, from: string, to: string) => {
        setDbCount(null)
        setAvailableCount(null)

        const params = new URLSearchParams({ source })
        if (from) params.set('dateFrom', from)
        if (to) params.set('dateTo', to)

        fetch(`/api/admin/news/reprocess?${params}`)
            .then(r => r.json())
            .then(d => setDbCount(typeof d.count === 'number' ? d.count : null))
            .catch(() => setDbCount(null))

        if (from) {
            fetch(`/api/admin/news/import?${params}`)
                .then(r => r.ok ? r.json() : Promise.reject())
                .then(d => setAvailableCount(typeof d.available === 'number' ? d.available : -1))
                .catch(() => setAvailableCount(-1))
        }
    }, [])

    useEffect(() => {
        if (!selectedSource) { setDbCount(null); setAvailableCount(null); return }
        fetchCounts(selectedSource, dateFrom, dateTo)
    }, [selectedSource, dateFrom, dateTo, fetchCounts])

    // ── SSE import ──────────────────────────────────────────────────────────

    const handleImport = async () => {
        if (!selectedSource || !dateFrom) return

        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        const total = availableCount && availableCount > 0 ? (availableCount as number) : 200
        const BATCH = 200

        setStreamProgress({
            phase: 'running',
            label: `Importando ${selectedSource}...`,
            total,
            current: 0, updated: 0, skipped: 0, exists: 0, errors: 0,
            log: [],
        })

        let offset = 0
        let accumImported = 0, accumExists = 0, accumErrors = 0

        while (offset < total && !controller.signal.aborted) {
            const limit = Math.min(BATCH, total - offset)
            const batchParams = new URLSearchParams({
                source: selectedSource,
                limit: String(limit),
                offset: String(offset),
                stream: '1',
            })
            if (dateFrom) batchParams.set('dateFrom', dateFrom)
            if (dateTo) batchParams.set('dateTo', dateTo)

            let batchImported = 0, batchExists = 0, batchErrors = 0, batchDone = false

            try {
                const res = await fetch(`/api/admin/news/import?${batchParams}`, {
                    method: 'POST',
                    signal: controller.signal,
                })
                if (!res.ok || !res.body) {
                    setStreamProgress(prev => prev ? { ...prev, phase: 'error' } : null)
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
                                if (event.result === 'imported') batchImported++
                                else if (event.result === 'exists') batchExists++
                                else batchErrors++

                                const entry: StreamLogEntry = {
                                    title: event.title,
                                    result: event.result === 'imported' ? 'updated' : event.result === 'exists' ? 'exists' : 'error',
                                    artistCount: 0,
                                }
                                const au = accumImported + batchImported
                                const ax = accumExists + batchExists
                                const ae = accumErrors + batchErrors
                                setStreamProgress(prev => prev ? {
                                    ...prev,
                                    current: offset + event.current,
                                    updated: au, exists: ax, errors: ae,
                                    log: [...prev.log, entry].slice(-100),
                                } : null)
                            } else if (event.type === 'done') {
                                batchDone = true
                            } else if (event.type === 'error') {
                                setStreamProgress(prev => prev ? { ...prev, phase: 'error' } : null)
                                return
                            }
                        } catch { /* skip */ }
                    }
                }
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    setStreamProgress(prev => prev ? { ...prev, phase: 'error' } : null)
                }
                return
            }

            accumImported += batchImported
            accumExists  += batchExists
            accumErrors  += batchErrors
            offset += limit
        }

        setStreamProgress(prev => prev ? {
            ...prev, phase: 'done',
            current: total, updated: accumImported, exists: accumExists, errors: accumErrors,
        } : null)
        if (selectedSource) fetchCounts(selectedSource, dateFrom, dateTo)
    }

    const clearPeriod = () => { setDateFrom(''); setDateTo('') }

    const newToImport = availableCount && availableCount > 0 && dbCount !== null
        ? Math.max(0, (availableCount as number) - dbCount)
        : null

    return (
        <AdminLayout title="Importar Notícias">
            <div className="max-w-3xl space-y-6">

                {/* Instructions */}
                <p className="text-zinc-400 text-sm leading-relaxed">
                    Importe artigos históricos de uma fonte externa buscando pela
                    <strong className="text-zinc-300"> API WordPress REST</strong> da fonte. Selecione a fonte
                    e o período desejado. O sistema verificará quantos artigos estão disponíveis e quantos
                    já existem no banco.
                </p>

                {/* Source selector */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Fonte</p>
                    <div className="flex items-center gap-2 flex-wrap">
                        {SOURCES.map(s => {
                            const c = SOURCE_COLORS[s]
                            const active = selectedSource === s
                            return (
                                <button
                                    key={s}
                                    onClick={() => setSelectedSource(prev => prev === s ? null : s)}
                                    disabled={isStreaming}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border disabled:opacity-50 ${
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
                </div>

                {selectedSource && (
                    <>
                        {/* Period */}
                        <div className="space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Período</p>

                            {/* Presets */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {[
                                    { label: 'Hoje',        from: todayISO(),       to: todayISO() },
                                    { label: 'Últimos 7d',  from: daysAgoISO(7),    to: todayISO() },
                                    { label: 'Últimos 30d', from: daysAgoISO(30),   to: todayISO() },
                                    { label: 'Últimos 90d', from: daysAgoISO(90),   to: todayISO() },
                                ].map(preset => (
                                    <button
                                        key={preset.label}
                                        onClick={() => { setDateFrom(preset.from); setDateTo(preset.to) }}
                                        disabled={isStreaming}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 border border-zinc-700 hover:border-purple-500/50 hover:text-purple-300 transition-colors disabled:opacity-50"
                                    >
                                        <CalendarDays size={12} />
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            {/* Manual dates */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    disabled={isStreaming}
                                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
                                />
                                <span className="text-zinc-600 text-sm">até</span>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    disabled={isStreaming}
                                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
                                />
                                {(dateFrom || dateTo) && (
                                    <button
                                        onClick={clearPeriod}
                                        disabled={isStreaming}
                                        className="p-1.5 text-zinc-600 hover:text-zinc-300 disabled:opacity-50"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Counts card */}
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 flex items-center gap-6 flex-wrap">
                            <div className="text-center min-w-[80px]">
                                <p className="text-2xl font-black text-white tabular-nums">
                                    {dbCount === null ? <Loader2 size={20} className="animate-spin mx-auto text-zinc-600" /> : dbCount.toLocaleString('pt-BR')}
                                </p>
                                <p className="text-[11px] text-zinc-500 mt-0.5">no banco{(dateFrom || dateTo) ? ' (período)' : ''}</p>
                            </div>

                            {dateFrom && (
                                <>
                                    <div className="h-8 w-px bg-zinc-800 hidden sm:block" />
                                    <div className="text-center min-w-[80px]">
                                        <p className="text-2xl font-black tabular-nums">
                                            {availableCount === null ? (
                                                <Loader2 size={20} className="animate-spin mx-auto text-zinc-600" />
                                            ) : availableCount === -1 ? (
                                                <span className="text-zinc-600 text-base">N/D</span>
                                            ) : (
                                                <span className={availableCount > (dbCount ?? 0) ? 'text-emerald-400' : 'text-zinc-300'}>
                                                    {(availableCount as number).toLocaleString('pt-BR')}
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-[11px] text-zinc-500 mt-0.5">disponíveis na fonte</p>
                                    </div>

                                    {newToImport !== null && newToImport > 0 && (
                                        <>
                                            <div className="h-8 w-px bg-zinc-800 hidden sm:block" />
                                            <div className="text-center min-w-[80px]">
                                                <p className="text-2xl font-black text-emerald-400 tabular-nums">
                                                    {newToImport.toLocaleString('pt-BR')}
                                                </p>
                                                <p className="text-[11px] text-zinc-500 mt-0.5">novos para importar</p>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            {!dateFrom && (
                                <p className="text-xs text-zinc-600 italic">
                                    Selecione um período para ver quantos estão disponíveis na fonte
                                </p>
                            )}
                        </div>

                        {/* Action */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <button
                                onClick={handleImport}
                                disabled={isStreaming || !dateFrom || availableCount === -1 || availableCount === null}
                                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm"
                            >
                                {isStreaming
                                    ? <Loader2 size={16} className="animate-spin" />
                                    : <Download size={16} />
                                }
                                {isStreaming ? 'Importando...' : 'Importar novos artigos'}
                            </button>
                            {!dateFrom && (
                                <p className="text-xs text-zinc-500">Selecione um período para importar</p>
                            )}
                            {availableCount === -1 && (
                                <p className="text-xs text-amber-400">API da fonte indisponível</p>
                            )}
                        </div>
                    </>
                )}

                {/* Progress */}
                {streamProgress && (
                    <BatchProgressPanel
                        progress={streamProgress}
                        onClose={() => setStreamProgress(null)}
                        updatedLabel="importados"
                        existsLabel="já existiam"
                        doneHint={
                            streamProgress.phase === 'done' && streamProgress.updated === 0 && streamProgress.exists > 0 ? (
                                <span className="text-blue-400/80">
                                    Todos esses artigos já estão no banco. Use{' '}
                                    <strong>Reprocessar</strong> para atualizar o conteúdo.
                                </span>
                            ) : null
                        }
                    />
                )}
            </div>
        </AdminLayout>
    )
}
