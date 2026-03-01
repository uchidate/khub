'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Languages, RefreshCw, AlertTriangle, CheckCircle, Type, Database } from 'lucide-react'

type LogLine = {
    text: string
    type: 'info' | 'success' | 'warning' | 'error' | 'done' | 'progress'
    link?: { href: string; label: string }
}

function parseLineFixNames(line: string): LogLine {
    const [type, ...rest] = line.split(':')
    const payload = rest.join(':')

    switch (type) {
        case 'TOTAL':
            return { text: `📋 ${payload} artistas com nome coreano em nameRomanized`, type: 'info' }
        case 'PROGRESS': {
            const parts = payload.split(':')
            return { text: `⏳ [${parts[0]}] ${parts.slice(1).join(':')}`, type: 'progress' }
        }
        case 'FIXED': {
            const [from, to] = payload.split('→')
            return { text: `✅ ${from} → ${to}`, type: 'success' }
        }
        case 'NO_TMDB': {
            // formato: NO_TMDB:{name}:{id}
            const parts = payload.split(':')
            const artistId = parts[parts.length - 1]
            const name = parts.slice(0, -1).join(':')
            return {
                text: `➖ Sem TMDB: ${name}`,
                type: 'warning',
                link: { href: `/admin/artists/${artistId}`, label: 'Adicionar TMDB ID →' },
            }
        }
        case 'DUPLICATE': {
            const [fromTo, outroId] = payload.split(':outro=')
            const [from, to] = (fromTo ?? payload).split('→')
            return { text: `⚠️ Duplicata real — nome "${to ?? ''}" já existe (outro=${outroId ?? '?'}): ${from}`, type: 'warning' }
        }
        case 'NAME_CONFLICT': {
            // formato: NAME_CONFLICT:{from}→{to}:outro={id}
            const [fromTo, outroId] = payload.split(':outro=')
            const [from, to] = (fromTo ?? payload).split('→')
            return {
                text: `🔶 Mesmo nome, artistas diferentes — "${to ?? ''}" corrigido (verificar outro: ${outroId ?? '?'}): ${from}`,
                type: 'warning',
                link: outroId ? { href: `/admin/artists/${outroId}`, label: 'Ver outro artista →' } : undefined,
            }
        }
        case 'NAME_CONFLICT_UNRESOLVABLE': {
            // formato: NAME_CONFLICT_UNRESOLVABLE:{from}→{to}:{id}
            const parts = payload.split(':')
            const artistId = parts[parts.length - 1]
            const [from, to] = parts.slice(0, -1).join(':').split('→')
            return {
                text: `🔴 Conflito irresolvível — "${to ?? ''}" já existe exatamente igual: ${from} (disambiguação manual necessária)`,
                type: 'error',
                link: { href: `/admin/artists/${artistId}`, label: 'Editar artista →' },
            }
        }
        case 'ERROR':
            return { text: `❌ Erro: ${payload}`, type: 'error' }
        case 'DONE': {
            const fmt = payload
                .replace('fixed=', 'corrigidos: ')
                .replace(',noTmdb=', ' | sem TMDB: ')
                .replace(',duplicates=', ' | duplicatas: ')
                .replace(',nameConflicts=', ' | conflito de nome: ')
                .replace(',errors=', ' | erros: ')
            return { text: `🎉 Concluído! ${fmt}`, type: 'done' }
        }
        default:
            return { text: line, type: 'info' }
    }
}

function parseLineFillHangul(line: string): LogLine {
    const [type, ...rest] = line.split(':')
    const payload = rest.join(':')

    switch (type) {
        case 'TOTAL':
            return { text: `📋 ${payload} artistas sem nome em Hangul`, type: 'info' }
        case 'PROGRESS': {
            const parts = payload.split(':')
            return { text: `⏳ [${parts[0]}] ${parts.slice(1).join(':')}`, type: 'progress' }
        }
        case 'FILLED': {
            const [name, hangul] = payload.split(':')
            return { text: `✅ ${name} → ${hangul}`, type: 'success' }
        }
        case 'NOT_FOUND':
            return { text: `➖ Sem Hangul no TMDB: ${payload}`, type: 'warning' }
        case 'ERROR':
            return { text: `❌ Erro: ${payload}`, type: 'error' }
        case 'DONE':
            return { text: `🎉 Concluído! ${payload.replace('filled=', 'preenchidos: ').replace(',notFound=', ' | sem dados: ').replace(',errors=', ' | erros: ')}`, type: 'done' }
        default:
            return { text: line, type: 'info' }
    }
}

type Stats = { total: number; main: number; secondary: number; errors: number } | null

function LogPanel({
    running,
    log,
    stats,
    onStart,
    onStartAll,
    title,
    description,
    buttonLabel,
    buttonAllLabel,
    statLabels,
}: {
    running: boolean
    log: LogLine[]
    stats: Stats
    onStart: () => void
    onStartAll?: () => void
    title: string
    description: string
    buttonLabel: string
    buttonAllLabel?: string
    statLabels: [string, string, string]
}) {
    const logRef = useRef<HTMLDivElement>(null)

    const lineColor = (type: LogLine['type']) => {
        if (type === 'success') return 'text-green-400'
        if (type === 'error') return 'text-red-400'
        if (type === 'warning') return 'text-yellow-400'
        if (type === 'done') return 'text-purple-400 font-bold'
        if (type === 'progress') return 'text-zinc-500'
        return 'text-zinc-300'
    }

    return (
        <div className="bg-zinc-900 border border-purple-500/20 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <Languages className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-white">{title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
                    </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <button
                        onClick={onStart}
                        disabled={running}
                        className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors"
                    >
                        {running
                            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processando...</>
                            : <><CheckCircle className="w-4 h-4" /> {buttonLabel}</>
                        }
                    </button>
                    {onStartAll && buttonAllLabel && (
                        <button
                            onClick={onStartAll}
                            disabled={running}
                            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors"
                        >
                            {running
                                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processando...</>
                                : <><RefreshCw className="w-4 h-4" /> {buttonAllLabel}</>
                            }
                        </button>
                    )}
                </div>
            </div>

            {stats && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-black/30 border border-green-500/20 rounded-lg p-3 text-center">
                        <p className="text-xl font-black text-green-400">{stats.main}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-widest font-bold">{statLabels[0]}</p>
                    </div>
                    <div className="bg-black/30 border border-yellow-500/20 rounded-lg p-3 text-center">
                        <p className="text-xl font-black text-yellow-400">{stats.secondary}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-widest font-bold">{statLabels[1]}</p>
                    </div>
                    <div className="bg-black/30 border border-red-500/20 rounded-lg p-3 text-center">
                        <p className="text-xl font-black text-red-400">{stats.errors}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-widest font-bold">{statLabels[2]}</p>
                    </div>
                </div>
            )}

            {log.length > 0 && (
                <div
                    ref={logRef}
                    className="bg-black/40 rounded-lg p-4 max-h-72 overflow-y-auto font-mono text-xs space-y-1 border border-white/5"
                >
                    {log.map((line, i) => (
                        <div key={i} className={`flex items-center gap-2 ${lineColor(line.type)}`}>
                            <span>{line.text}</span>
                            {line.link && (
                                <Link
                                    href={line.link.href}
                                    target="_blank"
                                    className="ml-1 underline text-amber-400 hover:text-amber-300 whitespace-nowrap"
                                >
                                    {line.link.label}
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function parseLineSyncTmdb(line: string): LogLine {
    const [type, ...rest] = line.split(':')
    const payload = rest.join(':')

    switch (type) {
        case 'TOTAL':
            return { text: `📋 ${payload} artistas com tmdbId para sincronizar`, type: 'info' }
        case 'PROGRESS': {
            const parts = payload.split(':')
            return { text: `⏳ [${parts[0]}] ${parts.slice(1).join(':')}`, type: 'progress' }
        }
        case 'ENRICHED': {
            const [name, fields] = payload.split(':')
            return { text: `✅ ${name} — atualizados: ${fields}`, type: 'success' }
        }
        case 'COMPLETE':
            return { text: `✓ Já completo: ${payload}`, type: 'progress' }
        case 'NO_DATA': {
            const parts = payload.split(':')
            const artistId = parts[parts.length - 1]
            const name = parts.slice(0, -1).join(':')
            return {
                text: `➖ Sem dados no TMDB: ${name}`,
                type: 'warning',
                link: { href: `/admin/artists/${artistId}`, label: 'Verificar →' },
            }
        }
        case 'ERROR':
            return { text: `❌ Erro: ${payload}`, type: 'error' }
        case 'DONE': {
            const fmt = payload
                .replace('enriched=', 'enriquecidos: ')
                .replace(',complete=', ' | já completos: ')
                .replace(',noData=', ' | sem dados: ')
                .replace(',errors=', ' | erros: ')
            return { text: `🎉 Concluído! ${fmt}`, type: 'done' }
        }
        default:
            return { text: line, type: 'info' }
    }
}

export default function FixNamesAdminPage() {
    // Estado para Corrigir Nomes
    const [fixRunning, setFixRunning] = useState(false)
    const [fixLog, setFixLog] = useState<LogLine[]>([])
    const [fixStats, setFixStats] = useState<Stats>(null)

    // Estado para Preencher Hangul
    const [hangulRunning, setHangulRunning] = useState(false)
    const [hangulLog, setHangulLog] = useState<LogLine[]>([])
    const [hangulStats, setHangulStats] = useState<Stats>(null)

    // Estado para Sync TMDB (batched)
    const [syncRunning, setSyncRunning] = useState(false)
    const [syncLog, setSyncLog] = useState<LogLine[]>([])
    const [syncStats, setSyncStats] = useState<Stats>(null)
    const [syncTotalGlobal, setSyncTotalGlobal] = useState(0)
    const [syncProcessed, setSyncProcessed] = useState(0)
    const syncAbortRef = useRef(false)

    async function runStream(
        endpoint: string,
        body: Record<string, unknown>,
        parser: (line: string) => LogLine,
        setRunning: (v: boolean) => void,
        setLog: React.Dispatch<React.SetStateAction<LogLine[]>>,
        setStats: (v: Stats) => void,
        doneRegex: RegExp,
        mapDone: (m: RegExpMatchArray) => Stats
    ) {
        setRunning(true)
        setLog([{ text: '🚀 Iniciando...', type: 'info' }])
        setStats(null)

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            if (!res.ok || !res.body) {
                setLog(prev => [...prev, { text: `❌ Erro HTTP ${res.status}`, type: 'error' }])
                return
            }

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            for (;;) {
                const { done, value } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (!line.trim()) continue
                    const parsed = parser(line)
                    setLog(prev => [...prev, parsed])

                    if (line.startsWith('TOTAL:')) {
                        const total = parseInt(line.replace('TOTAL:', ''))
                        setStats({ main: 0, secondary: 0, errors: 0, total })
                    }
                    if (line.startsWith('DONE:')) {
                        const m = line.match(doneRegex)
                        if (m) setStats(mapDone(m))
                    }
                }
            }
        } catch (e) {
            setLog(prev => [...prev, { text: `❌ Erro: ${e}`, type: 'error' }])
        } finally {
            setRunning(false)
        }
    }

    const startFixNames = useCallback(() => runStream(
        '/api/admin/fix-artist-names',
        { mode: 'fix-names' },
        parseLineFixNames,
        setFixRunning,
        setFixLog,
        setFixStats,
        /fixed=(\d+),noTmdb=(\d+),duplicates=(\d+),nameConflicts=(\d+),errors=(\d+)/,
        (m) => ({
            total: parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3]) + parseInt(m[4]) + parseInt(m[5]),
            main: parseInt(m[1]),
            secondary: parseInt(m[2]) + parseInt(m[3]) + parseInt(m[4]),
            errors: parseInt(m[5]),
        })
    ), [])

    const startFillHangul = useCallback(() => runStream(
        '/api/admin/fix-artist-names',
        { mode: 'fill-hangul' },
        parseLineFillHangul,
        setHangulRunning,
        setHangulLog,
        setHangulStats,
        /filled=(\d+),notFound=(\d+),errors=(\d+)/,
        (m) => ({ total: parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3]), main: parseInt(m[1]), secondary: parseInt(m[2]), errors: parseInt(m[3]) })
    ), [])

    const BATCH_SIZE = 500

    const runSyncBatches = useCallback(async (mode: 'empty_only' | 'all') => {
        syncAbortRef.current = false
        setSyncRunning(true)
        setSyncLog([{ text: '🚀 Iniciando sync em lotes de 500...', type: 'info' }])
        setSyncStats(null)
        setSyncTotalGlobal(0)
        setSyncProcessed(0)

        let offset = 0
        let totalGlobal = 0
        let grandEnriched = 0, grandComplete = 0, grandNoData = 0, grandErrors = 0

        try {
            while (!syncAbortRef.current) {
                const res = await fetch('/api/admin/sync-tmdb-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode, limit: BATCH_SIZE, offset }),
                })

                if (!res.ok || !res.body) {
                    setSyncLog(prev => [...prev, { text: `❌ Erro HTTP ${res.status}`, type: 'error' }])
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
                            totalGlobal = parseInt(line.replace('TOTAL_GLOBAL:', ''))
                            setSyncTotalGlobal(totalGlobal)
                            continue
                        }
                        if (line.startsWith('TOTAL:')) {
                            batchSize = parseInt(line.replace('TOTAL:', ''))
                            const batchNum = Math.floor(offset / BATCH_SIZE) + 1
                            const totalBatches = totalGlobal > 0 ? Math.ceil(totalGlobal / BATCH_SIZE) : '?'
                            setSyncLog(prev => [...prev, {
                                text: `📦 Lote ${batchNum}/${totalBatches} — ${batchSize} artistas`,
                                type: 'info',
                            }])
                            continue
                        }
                        if (line.startsWith('PROGRESS:')) {
                            const n = parseInt(line.split(':')[1].split('/')[0])
                            setSyncProcessed(offset + n)
                            setSyncLog(prev => [...prev, parseLineSyncTmdb(line)])
                            continue
                        }
                        if (line.startsWith('DONE:')) {
                            const m = line.match(/enriched=(\d+),complete=(\d+),noData=(\d+),errors=(\d+)/)
                            if (m) {
                                grandEnriched += parseInt(m[1])
                                grandComplete += parseInt(m[2])
                                grandNoData += parseInt(m[3])
                                grandErrors += parseInt(m[4])
                                setSyncStats({
                                    total: totalGlobal,
                                    main: grandEnriched,
                                    secondary: grandNoData,
                                    errors: grandErrors,
                                })
                            }
                            continue
                        }

                        setSyncLog(prev => [...prev, parseLineSyncTmdb(line)])
                    }
                }

                offset += BATCH_SIZE

                if (batchSize < BATCH_SIZE || offset >= totalGlobal) {
                    setSyncLog(prev => [...prev, {
                        text: `🎉 Todos os lotes concluídos! Enriquecidos: ${grandEnriched} | Completos: ${grandComplete} | Sem dados: ${grandNoData} | Erros: ${grandErrors}`,
                        type: 'done',
                    }])
                    setSyncProcessed(totalGlobal)
                    break
                }

                await new Promise(r => setTimeout(r, 1500))
                setSyncLog(prev => [...prev, {
                    text: `⏭️ Próximo lote — offset ${offset} de ${totalGlobal}...`,
                    type: 'info',
                }])
            }
        } catch (e) {
            setSyncLog(prev => [...prev, { text: `❌ Erro: ${e}`, type: 'error' }])
        } finally {
            setSyncRunning(false)
        }
    }, [BATCH_SIZE])

    const startSyncTmdb = useCallback(() => runSyncBatches('empty_only'), [runSyncBatches])
    const startSyncTmdbAll = useCallback(() => runSyncBatches('all'), [runSyncBatches])

    return (
        <AdminLayout title="Enriquecimento de Artistas via TMDB">
            <div className="space-y-6">
                {/* Info card */}
                <div className="bg-zinc-900 border border-amber-500/20 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="grid sm:grid-cols-3 gap-4 flex-1">
                            <div>
                                <p className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                                    <Type className="w-3.5 h-3.5 text-amber-400" />
                                    Corrigir Nomes
                                </p>
                                <p className="text-xs text-zinc-500">Hangul em nameRomanized → busca nome correto no TMDB, move para nameHangul</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                                    <Languages className="w-3.5 h-3.5 text-amber-400" />
                                    Preencher Hangul
                                </p>
                                <p className="text-xs text-zinc-500">Tem tmdbId mas sem nameHangul → busca no also_known_as do TMDB</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                                    <Database className="w-3.5 h-3.5 text-amber-400" />
                                    Sync TMDB
                                </p>
                                <p className="text-xs text-zinc-500">Preenche campos vazios (foto, bio, nascimento, local, gênero) para todos com tmdbId</p>
                            </div>
                        </div>
                    </div>
                </div>

                <LogPanel
                    running={fixRunning}
                    log={fixLog}
                    stats={fixStats}
                    onStart={startFixNames}
                    title="Corrigir nomes romanizados incorretos"
                    description="Artistas com Hangul em nameRomanized → busca nome correto no TMDB"
                    buttonLabel="Iniciar correção"
                    statLabels={['Corrigidos', 'Sem TMDB / conflitos', 'Erros']}
                />

                <LogPanel
                    running={hangulRunning}
                    log={hangulLog}
                    stats={hangulStats}
                    onStart={startFillHangul}
                    title="Preencher nome em Hangul"
                    description="Artistas com tmdbId mas sem nameHangul → busca Hangul em also_known_as"
                    buttonLabel="Preencher Hangul"
                    statLabels={['Preenchidos', 'Sem dados', 'Erros']}
                />

                {/* Sync TMDB — custom panel com barra de progresso global */}
                <div className="bg-zinc-900 border border-purple-500/20 rounded-xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <Database className="w-5 h-5 text-purple-400 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-white">Sincronizar dados biográficos do TMDB</p>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    Para artistas com tmdbId: foto, bio, nascimento, local, gênero — processa em lotes de 500
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            <button
                                onClick={startSyncTmdb}
                                disabled={syncRunning}
                                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors"
                            >
                                {syncRunning
                                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processando...</>
                                    : <><CheckCircle className="w-4 h-4" /> Preencher vazios</>
                                }
                            </button>
                            <button
                                onClick={startSyncTmdbAll}
                                disabled={syncRunning}
                                className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors"
                            >
                                {syncRunning
                                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processando...</>
                                    : <><RefreshCw className="w-4 h-4" /> Forçar todos</>
                                }
                            </button>
                            {syncRunning && (
                                <button
                                    onClick={() => { syncAbortRef.current = true }}
                                    className="px-3 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition-colors"
                                    title="Parar após o lote atual"
                                >
                                    ✕ Parar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Barra de progresso global */}
                    {syncTotalGlobal > 0 && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-zinc-400">
                                <span>Progresso global</span>
                                <span>{syncProcessed.toLocaleString('pt-BR')} / {syncTotalGlobal.toLocaleString('pt-BR')} artistas</span>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.round((syncProcessed / syncTotalGlobal) * 100))}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Totais acumulados */}
                    {syncStats && (
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-black/30 border border-green-500/20 rounded-lg p-3 text-center">
                                <p className="text-xl font-black text-green-400">{syncStats.main}</p>
                                <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-widest font-bold">Enriquecidos</p>
                            </div>
                            <div className="bg-black/30 border border-yellow-500/20 rounded-lg p-3 text-center">
                                <p className="text-xl font-black text-yellow-400">{syncStats.secondary}</p>
                                <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-widest font-bold">Sem dados TMDB</p>
                            </div>
                            <div className="bg-black/30 border border-red-500/20 rounded-lg p-3 text-center">
                                <p className="text-xl font-black text-red-400">{syncStats.errors}</p>
                                <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-widest font-bold">Erros</p>
                            </div>
                        </div>
                    )}

                    {/* Log */}
                    {syncLog.length > 0 && (
                        <div className="bg-black/40 rounded-lg p-4 max-h-72 overflow-y-auto font-mono text-xs space-y-1 border border-white/5">
                            {syncLog.map((line, i) => {
                                const color = line.type === 'success' ? 'text-green-400'
                                    : line.type === 'error' ? 'text-red-400'
                                    : line.type === 'warning' ? 'text-yellow-400'
                                    : line.type === 'done' ? 'text-purple-400 font-bold'
                                    : line.type === 'progress' ? 'text-zinc-500'
                                    : 'text-zinc-300'
                                return (
                                    <div key={i} className={`flex items-center gap-2 ${color}`}>
                                        <span>{line.text}</span>
                                        {line.link && (
                                            <Link href={line.link.href} target="_blank" className="ml-1 underline text-amber-400 hover:text-amber-300 whitespace-nowrap">
                                                {line.link.label}
                                            </Link>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    )
}
