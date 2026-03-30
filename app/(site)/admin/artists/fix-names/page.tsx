'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Languages, RefreshCw, AlertTriangle, CheckCircle, Type, Database, Link2, HelpCircle, Play } from 'lucide-react'
import { AdminButton, StatCard, SectionHeader } from '@/components/admin'

const SYNC_BATCH_SIZE = 250    // 250 × ~750ms ≈ 3min por lote, abaixo do maxDuration=300s
const LINK_BATCH_SIZE = 200

const SYNC_STORAGE_KEY = 'khub-sync-progress'
const LINK_STORAGE_KEY = 'khub-link-progress'

interface SavedProgress {
    offset: number
    totalGlobal: number
    grandEnriched: number
    grandComplete: number
    grandNoData: number
    grandErrors: number
    mode?: string
}

type LogLine = {
    text: string
    type: 'info' | 'success' | 'warning' | 'error' | 'done' | 'progress'
    link?: { href: string; label: string }
}

interface ArtistStats {
    total: number
    withTmdb: number
    withoutTmdb: number
    flagged: number
    complete: number
}

// ── Parsers de linha ──────────────────────────────────────────────────────────

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
            const parts = payload.split(':')
            const artistId = parts[parts.length - 1]
            const name = parts.slice(0, -1).join(':')
            return { text: `➖ Sem TMDB: ${name}`, type: 'warning', link: { href: `/admin/artists/${artistId}`, label: 'Adicionar TMDB ID →' } }
        }
        case 'DUPLICATE': {
            const [fromTo, outroId] = payload.split(':outro=')
            const [from, to] = (fromTo ?? payload).split('→')
            return { text: `⚠️ Duplicata real — nome "${to ?? ''}" já existe (outro=${outroId ?? '?'}): ${from}`, type: 'warning' }
        }
        case 'NAME_CONFLICT': {
            const [fromTo, outroId] = payload.split(':outro=')
            const [from, to] = (fromTo ?? payload).split('→')
            return { text: `🔶 Mesmo nome, artistas diferentes — "${to ?? ''}" corrigido (verificar outro: ${outroId ?? '?'}): ${from}`, type: 'warning', link: outroId ? { href: `/admin/artists/${outroId}`, label: 'Ver outro artista →' } : undefined }
        }
        case 'NAME_CONFLICT_UNRESOLVABLE': {
            const parts = payload.split(':')
            const artistId = parts[parts.length - 1]
            const [from, to] = parts.slice(0, -1).join(':').split('→')
            return { text: `🔴 Conflito irresolvível — "${to ?? ''}" já existe exatamente igual: ${from}`, type: 'error', link: { href: `/admin/artists/${artistId}`, label: 'Editar artista →' } }
        }
        case 'ERROR':
            return { text: `❌ Erro: ${payload}`, type: 'error' }
        case 'DONE': {
            const fmt = payload.replace('fixed=', 'corrigidos: ').replace(',noTmdb=', ' | sem TMDB: ').replace(',duplicates=', ' | duplicatas: ').replace(',nameConflicts=', ' | conflito de nome: ').replace(',errors=', ' | erros: ')
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
            const colonIdx = payload.indexOf(':')
            const name = colonIdx > 0 ? payload.slice(0, colonIdx) : payload
            const fields = colonIdx > 0 ? payload.slice(colonIdx + 1) : ''
            const fieldDisplay = fields
                .replace('bio/pt-BR', 'bio [PT-BR ✓]')
                .replace('bio/en', 'bio [EN]')
            return { text: `✅ ${name} — atualizados: ${fieldDisplay}`, type: 'success' }
        }
        case 'COMPLETE':
            return { text: `✓ Já completo: ${payload}`, type: 'progress' }
        case 'NO_DATA': {
            const parts = payload.split(':')
            const artistId = parts[parts.length - 1]
            const name = parts.slice(0, -1).join(':')
            return { text: `➖ Sem dados no TMDB: ${name}`, type: 'warning', link: { href: `/admin/artists/${artistId}`, label: 'Verificar →' } }
        }
        case 'ERROR':
            return { text: `❌ Erro: ${payload}`, type: 'error' }
        case 'DONE': {
            const fmt = payload.replace('enriched=', 'enriquecidos: ').replace(',complete=', ' | já completos: ').replace(',noData=', ' | sem dados: ').replace(',errors=', ' | erros: ')
            return { text: `🎉 Concluído! ${fmt}`, type: 'done' }
        }
        default:
            return { text: line, type: 'info' }
    }
}

function parseLineLinkTmdb(line: string): LogLine {
    const [type, ...rest] = line.split(':')
    const payload = rest.join(':')
    switch (type) {
        case 'TOTAL_GLOBAL':
            return { text: `🌍 Total de artistas sem TMDB ID: ${payload}`, type: 'info' }
        case 'TOTAL':
            return { text: `📋 Processando ${payload} neste lote`, type: 'info' }
        case 'PROGRESS': {
            const parts = payload.split(':')
            return { text: `⏳ [${parts[0]}] ${parts.slice(1).join(':')}`, type: 'progress' }
        }
        case 'LINKED': {
            const [from, toWithId] = payload.split('→')
            const lastColon = toWithId?.lastIndexOf(':') ?? -1
            const to = lastColon > 0 ? toWithId.slice(0, lastColon) : toWithId
            const id = lastColon > 0 ? toWithId.slice(lastColon + 1) : ''
            return { text: `✅ ${from} → ${to} (TMDB #${id})`, type: 'success' }
        }
        case 'NOT_FOUND':
            return { text: `➖ Sem resultado no TMDB: ${payload}`, type: 'warning' }
        case 'LOW_CONFIDENCE': {
            const parts = payload.split('→')
            const artistName = parts[0]
            const rest2 = parts[1] ?? ''
            const lastColon = rest2.lastIndexOf(':')
            const candidate = lastColon > 0 ? rest2.slice(0, lastColon) : rest2
            const artistId = lastColon > 0 ? rest2.slice(lastColon + 1) : ''
            return {
                text: `🔶 Baixa confiança: "${artistName}" → "${candidate}" (verificar manualmente)`,
                type: 'warning',
                link: artistId ? { href: `/admin/artists/${artistId}`, label: 'Vincular manualmente →' } : undefined,
            }
        }
        case 'ERROR':
            return { text: `❌ Erro: ${payload}`, type: 'error' }
        case 'DONE': {
            const fmt = payload
                .replace('linked=', 'vinculados: ')
                .replace(',notFound=', ' | não encontrados: ')
                .replace(',lowConfidence=', ' | baixa confiança: ')
                .replace(',errors=', ' | erros: ')
            return { text: `🎉 Concluído! ${fmt}`, type: 'done' }
        }
        default:
            return { text: line, type: 'info' }
    }
}

// ── Componente LogPanel ───────────────────────────────────────────────────────

type Stats = { total: number; main: number; secondary: number; errors: number } | null

function LogPanel({
    running, log, stats, onStart, onStartAll, title, description, buttonLabel, buttonAllLabel, statLabels, icon: Icon,
}: {
    running: boolean; log: LogLine[]; stats: Stats; onStart: () => void; onStartAll?: () => void
    title: string; description: string; buttonLabel: string; buttonAllLabel?: string; statLabels: [string, string, string]
    icon: React.ElementType
}) {
    const logRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
    }, [log])

    const lineColor = (type: LogLine['type']) => {
        if (type === 'success') return 'text-green-400'
        if (type === 'error') return 'text-red-400'
        if (type === 'warning') return 'text-yellow-400'
        if (type === 'done') return 'text-accent font-bold'
        if (type === 'progress') return 'text-muted'
        return 'text-foreground'
    }

    return (
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <Icon className="w-5 h-5 text-accent flex-shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-foreground">{title}</p>
                        <p className="text-xs text-muted mt-0.5">{description}</p>
                    </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <AdminButton variant="primary" size="lg" onClick={onStart} disabled={running}>
                        {running ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processando...</> : <><CheckCircle className="w-4 h-4" /> {buttonLabel}</>}
                    </AdminButton>
                    {onStartAll && buttonAllLabel && (
                        <AdminButton variant="warning" size="lg" onClick={onStartAll} disabled={running}>
                            {running ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processando...</> : <><RefreshCw className="w-4 h-4" /> {buttonAllLabel}</>}
                        </AdminButton>
                    )}
                </div>
            </div>

            {stats && (
                <div className="grid grid-cols-3 gap-3">
                    <StatCard label={statLabels[0]} value={stats.main} color="text-green-400" />
                    <StatCard label={statLabels[1]} value={stats.secondary} color="text-yellow-400" />
                    <StatCard label={statLabels[2]} value={stats.errors} color="text-red-400" />
                </div>
            )}

            {log.length > 0 && (
                <div ref={logRef} className="bg-background rounded-lg p-4 max-h-72 overflow-y-auto font-mono text-xs space-y-1 border border-border">
                    {log.map((line, i) => (
                        <div key={i} className={`flex items-center gap-2 ${lineColor(line.type)}`}>
                            <span>{line.text}</span>
                            {line.link && (
                                <Link href={line.link.href} target="_blank" className="ml-1 underline text-amber-400 hover:text-amber-300 whitespace-nowrap">
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

// ── Página principal ──────────────────────────────────────────────────────────

export default function FixNamesAdminPage() {
    const [artistStats, setArtistStats] = useState<ArtistStats | null>(null)
    const [statsLoading, setStatsLoading] = useState(true)

    const [savedSync, setSavedSync] = useState<SavedProgress | null>(null)
    const [savedLink, setSavedLink] = useState<SavedProgress | null>(null)

    const [fixRunning, setFixRunning] = useState(false)
    const [fixLog, setFixLog] = useState<LogLine[]>([])
    const [fixStats, setFixStats] = useState<Stats>(null)

    const [hangulRunning, setHangulRunning] = useState(false)
    const [hangulLog, setHangulLog] = useState<LogLine[]>([])
    const [hangulStats, setHangulStats] = useState<Stats>(null)

    const [syncRunning, setSyncRunning] = useState(false)
    const [syncLog, setSyncLog] = useState<LogLine[]>([])
    const [syncStats, setSyncStats] = useState<Stats>(null)
    const [syncTotalGlobal, setSyncTotalGlobal] = useState(0)
    const [syncProcessed, setSyncProcessed] = useState(0)
    const syncAbortRef = useRef(false)

    const [linkRunning, setLinkRunning] = useState(false)
    const [linkLog, setLinkLog] = useState<LogLine[]>([])
    const [linkStats, setLinkStats] = useState<Stats>(null)
    const [linkTotalGlobal, setLinkTotalGlobal] = useState(0)
    const [linkProcessed, setLinkProcessed] = useState(0)
    const linkAbortRef = useRef(false)

    const syncLogRef = useRef<HTMLDivElement>(null)
    const linkLogRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetch('/api/admin/artists/fix-names')
            .then(r => r.json())
            .then(d => { setArtistStats(d); setStatsLoading(false) })
            .catch(() => setStatsLoading(false))

        // Restaura progresso salvo de sessões anteriores
        try {
            const sync = sessionStorage.getItem(SYNC_STORAGE_KEY)
            const link = sessionStorage.getItem(LINK_STORAGE_KEY)
            if (sync) setSavedSync(JSON.parse(sync))
            if (link) setSavedLink(JSON.parse(link))
        } catch { /* ignore */ }
    }, [])

    useEffect(() => {
        if (syncLogRef.current) syncLogRef.current.scrollTop = syncLogRef.current.scrollHeight
    }, [syncLog])

    useEffect(() => {
        if (linkLogRef.current) linkLogRef.current.scrollTop = linkLogRef.current.scrollHeight
    }, [linkLog])

    async function runStream(
        endpoint: string, body: Record<string, unknown>, parser: (line: string) => LogLine,
        setRunning: (v: boolean) => void, setLog: React.Dispatch<React.SetStateAction<LogLine[]>>,
        setStats: (v: Stats) => void, doneRegex: RegExp, mapDone: (m: RegExpMatchArray) => Stats
    ) {
        setRunning(true)
        setLog([{ text: '🚀 Iniciando...', type: 'info' }])
        setStats(null)
        try {
            const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
            if (!res.ok || !res.body) { setLog(prev => [...prev, { text: `❌ Erro HTTP ${res.status}`, type: 'error' }]); return }
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
                    setLog(prev => [...prev, parser(line)])
                    if (line.startsWith('TOTAL:')) setStats({ main: 0, secondary: 0, errors: 0, total: parseInt(line.replace('TOTAL:', '')) })
                    if (line.startsWith('DONE:')) { const m = line.match(doneRegex); if (m) setStats(mapDone(m)) }
                }
            }
        } catch (e) {
            setLog(prev => [...prev, { text: `❌ Erro: ${e}`, type: 'error' }])
        } finally {
            setRunning(false)
        }
    }

    const startFixNames = useCallback(() => runStream(
        '/api/admin/fix-artist-names', { mode: 'fix-names' }, parseLineFixNames,
        setFixRunning, setFixLog, setFixStats,
        /fixed=(\d+),noTmdb=(\d+),duplicates=(\d+),nameConflicts=(\d+),errors=(\d+)/,
        (m) => ({ total: parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3]) + parseInt(m[4]) + parseInt(m[5]), main: parseInt(m[1]), secondary: parseInt(m[2]) + parseInt(m[3]) + parseInt(m[4]), errors: parseInt(m[5]) })
    ), [])

    const startFillHangul = useCallback(() => runStream(
        '/api/admin/fix-artist-names', { mode: 'fill-hangul' }, parseLineFillHangul,
        setHangulRunning, setHangulLog, setHangulStats,
        /filled=(\d+),notFound=(\d+),errors=(\d+)/,
        (m) => ({ total: parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3]), main: parseInt(m[1]), secondary: parseInt(m[2]), errors: parseInt(m[3]) })
    ), [])

    const runSyncBatches = useCallback(async (mode: 'empty_only' | 'smart' | 'all', resume?: SavedProgress) => {
        syncAbortRef.current = false
        setSyncRunning(true)
        setSavedSync(null)
        setSyncStats(null)

        let offset = resume?.offset ?? 0
        let totalGlobal = resume?.totalGlobal ?? 0
        let grandEnriched = resume?.grandEnriched ?? 0
        let grandComplete = resume?.grandComplete ?? 0
        let grandNoData = resume?.grandNoData ?? 0
        let grandErrors = resume?.grandErrors ?? 0

        if (resume) {
            setSyncTotalGlobal(totalGlobal)
            setSyncProcessed(offset)
            setSyncLog([{ text: `▶️ Retomando do offset ${offset.toLocaleString('pt-BR')} de ${totalGlobal.toLocaleString('pt-BR')} (acumulado: ${grandEnriched} enriquecidos)`, type: 'info' }])
            setSyncStats({ total: totalGlobal, main: grandEnriched, secondary: grandNoData, errors: grandErrors })
        } else {
            setSyncLog([{ text: `🚀 Iniciando sync em lotes de ${SYNC_BATCH_SIZE}...`, type: 'info' }])
            setSyncTotalGlobal(0)
            setSyncProcessed(0)
        }

        try {
            while (!syncAbortRef.current) {
                const res = await fetch('/api/admin/sync-tmdb-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, limit: SYNC_BATCH_SIZE, offset }) })
                if (!res.ok || !res.body) { setSyncLog(prev => [...prev, { text: `❌ Erro HTTP ${res.status}`, type: 'error' }]); break }
                const reader = res.body.getReader()
                const decoder = new TextDecoder()
                let buffer = '', batchSize = 0
                for (;;) {
                    const { done, value } = await reader.read()
                    if (done) break
                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ''
                    for (const line of lines) {
                        if (!line.trim()) continue
                        if (line.startsWith('TOTAL_GLOBAL:')) { totalGlobal = parseInt(line.replace('TOTAL_GLOBAL:', '')); setSyncTotalGlobal(totalGlobal); continue }
                        if (line.startsWith('TOTAL:')) { batchSize = parseInt(line.replace('TOTAL:', '')); const bn = Math.floor(offset / SYNC_BATCH_SIZE) + 1; const tb = totalGlobal > 0 ? Math.ceil(totalGlobal / SYNC_BATCH_SIZE) : '?'; setSyncLog(prev => [...prev, { text: `📦 Lote ${bn}/${tb} — ${batchSize} artistas`, type: 'info' }]); continue }
                        if (line.startsWith('PROGRESS:')) { setSyncProcessed(offset + parseInt(line.split(':')[1].split('/')[0])); setSyncLog(prev => [...prev, parseLineSyncTmdb(line)]); continue }
                        if (line.startsWith('DONE:')) {
                            const m = line.match(/enriched=(\d+),complete=(\d+),noData=(\d+),errors=(\d+)/)
                            if (m) { grandEnriched += parseInt(m[1]); grandComplete += parseInt(m[2]); grandNoData += parseInt(m[3]); grandErrors += parseInt(m[4]); setSyncStats({ total: totalGlobal, main: grandEnriched, secondary: grandNoData, errors: grandErrors }) }
                            continue
                        }
                        setSyncLog(prev => [...prev, parseLineSyncTmdb(line)])
                    }
                }
                offset += SYNC_BATCH_SIZE

                // Salva progresso no sessionStorage após cada lote
                const progress: SavedProgress = { offset, totalGlobal, grandEnriched, grandComplete, grandNoData, grandErrors, mode }
                try { sessionStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(progress)) } catch { /* ignore */ }

                if (batchSize < SYNC_BATCH_SIZE || offset >= totalGlobal) {
                    setSyncLog(prev => [...prev, { text: `🎉 Todos os lotes concluídos! Enriquecidos: ${grandEnriched} | Completos: ${grandComplete} | Sem dados: ${grandNoData} | Erros: ${grandErrors}`, type: 'done' }])
                    setSyncProcessed(totalGlobal)
                    try { sessionStorage.removeItem(SYNC_STORAGE_KEY) } catch { /* ignore */ }
                    break
                }
                await new Promise(r => setTimeout(r, 1500))
                setSyncLog(prev => [...prev, { text: `⏭️ Próximo lote — offset ${offset.toLocaleString('pt-BR')} de ${totalGlobal.toLocaleString('pt-BR')}...`, type: 'info' }])
            }

            // Se abortado, mantém progresso para retomar depois
            if (syncAbortRef.current) {
                const progress: SavedProgress = { offset, totalGlobal, grandEnriched, grandComplete, grandNoData, grandErrors, mode }
                try { sessionStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(progress)); setSavedSync(progress) } catch { /* ignore */ }
                setSyncLog(prev => [...prev, { text: `⏸️ Pausado no offset ${offset.toLocaleString('pt-BR')}. Clique "Retomar" para continuar.`, type: 'info' }])
            }
        } catch (e) {
            setSyncLog(prev => [...prev, { text: `❌ Erro: ${e}`, type: 'error' }])
            // Salva progresso mesmo em caso de erro para permitir retomada
            const progress: SavedProgress = { offset, totalGlobal, grandEnriched, grandComplete, grandNoData, grandErrors, mode }
            try { sessionStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(progress)); setSavedSync(progress) } catch { /* ignore */ }
            setSyncLog(prev => [...prev, { text: `💾 Progresso salvo. Use "Retomar" para continuar do offset ${offset.toLocaleString('pt-BR')}.`, type: 'info' }])
        } finally {
            setSyncRunning(false)
        }
    }, [])

    const startSyncTmdb = useCallback(() => runSyncBatches('empty_only'), [runSyncBatches])
    const startSyncTmdbSmart = useCallback(() => runSyncBatches('smart'), [runSyncBatches])
    const startSyncTmdbAll = useCallback(() => runSyncBatches('all'), [runSyncBatches])
    const resumeSyncTmdb = useCallback(() => savedSync && runSyncBatches((savedSync.mode as 'empty_only' | 'smart' | 'all') ?? 'empty_only', savedSync), [runSyncBatches, savedSync])

    const runLinkBatches = useCallback(async (resume?: SavedProgress) => {
        linkAbortRef.current = false
        setLinkRunning(true)
        setSavedLink(null)
        setLinkStats(null)

        let offset = resume?.offset ?? 0
        let totalGlobal = resume?.totalGlobal ?? 0
        let grandLinked = resume?.grandEnriched ?? 0
        let grandNotFound = resume?.grandNoData ?? 0
        let grandLowConf = resume?.grandComplete ?? 0
        let grandErrors = resume?.grandErrors ?? 0

        if (resume) {
            setLinkTotalGlobal(totalGlobal)
            setLinkProcessed(offset)
            setLinkLog([{ text: `▶️ Retomando do offset ${offset.toLocaleString('pt-BR')} de ${totalGlobal.toLocaleString('pt-BR')} (acumulado: ${grandLinked} vinculados)`, type: 'info' }])
            setLinkStats({ total: totalGlobal, main: grandLinked, secondary: grandNotFound + grandLowConf, errors: grandErrors })
        } else {
            setLinkLog([{ text: `🚀 Iniciando vinculação em lotes de ${LINK_BATCH_SIZE}...`, type: 'info' }])
            setLinkTotalGlobal(0)
            setLinkProcessed(0)
        }

        try {
            while (!linkAbortRef.current) {
                const res = await fetch('/api/admin/link-tmdb-ids', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit: LINK_BATCH_SIZE, offset }) })
                if (!res.ok || !res.body) { setLinkLog(prev => [...prev, { text: `❌ Erro HTTP ${res.status}`, type: 'error' }]); break }
                const reader = res.body.getReader()
                const decoder = new TextDecoder()
                let buffer = '', batchSize = 0
                for (;;) {
                    const { done, value } = await reader.read()
                    if (done) break
                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ''
                    for (const line of lines) {
                        if (!line.trim()) continue
                        if (line.startsWith('TOTAL_GLOBAL:')) { totalGlobal = parseInt(line.replace('TOTAL_GLOBAL:', '')); setLinkTotalGlobal(totalGlobal); continue }
                        if (line.startsWith('TOTAL:')) { batchSize = parseInt(line.replace('TOTAL:', '')); const bn = Math.floor(offset / LINK_BATCH_SIZE) + 1; const tb = totalGlobal > 0 ? Math.ceil(totalGlobal / LINK_BATCH_SIZE) : '?'; setLinkLog(prev => [...prev, { text: `📦 Lote ${bn}/${tb} — ${batchSize} artistas`, type: 'info' }]); continue }
                        if (line.startsWith('PROGRESS:')) { setLinkProcessed(offset + parseInt(line.split(':')[1].split('/')[0])); setLinkLog(prev => [...prev, parseLineLinkTmdb(line)]); continue }
                        if (line.startsWith('DONE:')) {
                            const m = line.match(/linked=(\d+),notFound=(\d+),lowConfidence=(\d+),errors=(\d+)/)
                            if (m) { grandLinked += parseInt(m[1]); grandNotFound += parseInt(m[2]); grandLowConf += parseInt(m[3]); grandErrors += parseInt(m[4]); setLinkStats({ total: totalGlobal, main: grandLinked, secondary: grandNotFound + grandLowConf, errors: grandErrors }) }
                            continue
                        }
                        setLinkLog(prev => [...prev, parseLineLinkTmdb(line)])
                    }
                }
                offset += LINK_BATCH_SIZE

                // Salva progresso após cada lote
                const progress: SavedProgress = { offset, totalGlobal, grandEnriched: grandLinked, grandComplete: grandLowConf, grandNoData: grandNotFound, grandErrors }
                try { sessionStorage.setItem(LINK_STORAGE_KEY, JSON.stringify(progress)) } catch { /* ignore */ }

                if (batchSize < LINK_BATCH_SIZE || offset >= totalGlobal) {
                    setLinkLog(prev => [...prev, { text: `🎉 Concluído! Vinculados: ${grandLinked} | Não encontrados: ${grandNotFound} | Baixa confiança: ${grandLowConf} | Erros: ${grandErrors}`, type: 'done' }])
                    setLinkProcessed(totalGlobal)
                    try { sessionStorage.removeItem(LINK_STORAGE_KEY) } catch { /* ignore */ }
                    break
                }
                await new Promise(r => setTimeout(r, 1500))
                setLinkLog(prev => [...prev, { text: `⏭️ Próximo lote — offset ${offset.toLocaleString('pt-BR')} de ${totalGlobal.toLocaleString('pt-BR')}...`, type: 'info' }])
            }

            if (linkAbortRef.current) {
                const progress: SavedProgress = { offset, totalGlobal, grandEnriched: grandLinked, grandComplete: grandLowConf, grandNoData: grandNotFound, grandErrors }
                try { sessionStorage.setItem(LINK_STORAGE_KEY, JSON.stringify(progress)); setSavedLink(progress) } catch { /* ignore */ }
                setLinkLog(prev => [...prev, { text: `⏸️ Pausado no offset ${offset.toLocaleString('pt-BR')}. Clique "Retomar" para continuar.`, type: 'info' }])
            }
        } catch (e) {
            setLinkLog(prev => [...prev, { text: `❌ Erro: ${e}`, type: 'error' }])
            const progress: SavedProgress = { offset, totalGlobal, grandEnriched: grandLinked, grandComplete: grandLowConf, grandNoData: grandNotFound, grandErrors }
            try { sessionStorage.setItem(LINK_STORAGE_KEY, JSON.stringify(progress)); setSavedLink(progress) } catch { /* ignore */ }
            setLinkLog(prev => [...prev, { text: `💾 Progresso salvo. Use "Retomar" para continuar do offset ${offset.toLocaleString('pt-BR')}.`, type: 'info' }])
        } finally {
            setLinkRunning(false)
        }
    }, [])

    const tmdbCoverage = artistStats ? Math.round((artistStats.withTmdb / artistStats.total) * 100) : 0
    const completionRate = artistStats ? Math.round((artistStats.complete / artistStats.withTmdb) * 100) : 0

    return (
        <AdminLayout title="Enriquecimento de Artistas" subtitle="Vincula TMDB IDs, corrige nomes e sincroniza dados biográficos">
            <div className="space-y-6">

                {/* ── Painel de estatísticas ── */}
                <div className="bg-surface border border-border rounded-xl p-5">
                    <SectionHeader
                        title="Cobertura de dados"
                        actions={statsLoading ? <RefreshCw className="w-4 h-4 text-muted animate-spin" /> : undefined}
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <StatCard label="Total" value={artistStats?.total ?? undefined} color="text-foreground" />
                        <StatCard
                            label="Com TMDB ID"
                            value={artistStats?.withTmdb ?? undefined}
                            color="text-green-400"
                            sub={artistStats ? `${tmdbCoverage}%` : undefined}
                        />
                        <StatCard
                            label="Sem TMDB ID"
                            value={artistStats?.withoutTmdb ?? undefined}
                            color="text-amber-400"
                            sub="não sincronizável"
                        />
                        <StatCard
                            label="Bio + foto + Hangul"
                            value={artistStats?.complete ?? undefined}
                            color="text-blue-400"
                            sub={artistStats ? `${completionRate}% dos com TMDB` : undefined}
                        />
                        <StatCard
                            label="Não coreanos"
                            value={artistStats?.flagged ?? undefined}
                            color="text-muted"
                            sub="excluídos do sync"
                        />
                    </div>

                    {/* Barra de cobertura TMDB */}
                    {artistStats && (
                        <div className="mt-4 space-y-1">
                            <div className="flex justify-between text-xs text-muted">
                                <span>Cobertura TMDB ID</span>
                                <span>{artistStats.withTmdb.toLocaleString('pt-BR')} / {artistStats.total.toLocaleString('pt-BR')}</span>
                            </div>
                            <div className="h-2 bg-surface rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${tmdbCoverage}%` }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Guia de operações ── */}
                <div className="bg-surface border border-amber-500/20 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="grid sm:grid-cols-4 gap-4 flex-1">
                            <div>
                                <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1"><Link2 className="w-3.5 h-3.5 text-amber-400" />Vincular TMDB IDs</p>
                                <p className="text-xs text-muted">Artistas sem tmdbId → busca por nome no TMDB, vincula automaticamente com alta confiança</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1"><Type className="w-3.5 h-3.5 text-amber-400" />Corrigir Nomes</p>
                                <p className="text-xs text-muted">Hangul em nameRomanized → busca nome correto no TMDB, move para nameHangul</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1"><Languages className="w-3.5 h-3.5 text-amber-400" />Preencher Hangul</p>
                                <p className="text-xs text-muted">Tem tmdbId mas sem nameHangul → busca no also_known_as do TMDB</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1"><Database className="w-3.5 h-3.5 text-amber-400" />Sync TMDB</p>
                                <p className="text-xs text-muted">Preenche campos vazios (foto, bio, nascimento, local, gênero) — só para artistas COM tmdbId</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 1. Vincular TMDB IDs (nova operação) ── */}
                <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <Link2 className="w-5 h-5 text-amber-400 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-foreground">Vincular TMDB IDs automaticamente</p>
                                <p className="text-xs text-muted mt-0.5">
                                    Busca cada artista sem tmdbId pelo nome no TMDB. Vincula quando o nome corresponde exatamente (alta confiança). Casos incertos são listados para revisão manual.
                                    {artistStats && <span className="ml-1 text-accent font-medium">→ {artistStats.withoutTmdb.toLocaleString('pt-BR')} artistas elegíveis</span>}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            <AdminButton variant="warning" size="lg" onClick={() => runLinkBatches()} disabled={linkRunning}>
                                {linkRunning ? <><RefreshCw className="w-4 h-4 animate-spin" /> Buscando...</> : <><Link2 className="w-4 h-4" /> Vincular TMDB IDs</>}
                            </AdminButton>
                            {savedLink && !linkRunning && (
                                <AdminButton variant="secondary" size="lg" onClick={() => runLinkBatches(savedLink)} title={`Retomar do offset ${savedLink.offset.toLocaleString('pt-BR')}`}>
                                    <Play className="w-4 h-4" /> Retomar ({savedLink.offset.toLocaleString('pt-BR')}/{savedLink.totalGlobal.toLocaleString('pt-BR')})
                                </AdminButton>
                            )}
                            {linkRunning && (
                                <AdminButton variant="danger" size="lg" onClick={() => { linkAbortRef.current = true }} title="Parar após o lote atual">
                                    ✕ Parar
                                </AdminButton>
                            )}
                        </div>
                    </div>

                    {linkTotalGlobal > 0 && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted">
                                <span>Progresso</span>
                                <span>{linkProcessed.toLocaleString('pt-BR')} / {linkTotalGlobal.toLocaleString('pt-BR')} · {Math.min(100, Math.round((linkProcessed / linkTotalGlobal) * 100))}%</span>
                            </div>
                            <div className="h-2 bg-surface rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round((linkProcessed / linkTotalGlobal) * 100))}%` }} />
                            </div>
                        </div>
                    )}

                    {linkStats && (
                        <div className="grid grid-cols-3 gap-3">
                            <StatCard label="Vinculados" value={linkStats.main} color="text-green-400" />
                            <StatCard label="Sem match / incerto" value={linkStats.secondary} color="text-yellow-400" />
                            <StatCard label="Erros" value={linkStats.errors} color="text-red-400" />
                        </div>
                    )}

                    {linkLog.length > 0 && (
                        <div ref={linkLogRef} className="bg-background rounded-lg p-4 max-h-72 overflow-y-auto font-mono text-xs space-y-1 border border-border">
                            {linkLog.map((line, i) => {
                                const color = line.type === 'success' ? 'text-green-400' : line.type === 'error' ? 'text-red-400' : line.type === 'warning' ? 'text-yellow-400' : line.type === 'done' ? 'text-amber-400 font-bold' : line.type === 'progress' ? 'text-muted' : 'text-foreground'
                                return (
                                    <div key={i} className={`flex items-center gap-2 ${color}`}>
                                        <span>{line.text}</span>
                                        {line.link && <Link href={line.link.href} target="_blank" className="ml-1 underline text-amber-400 hover:text-amber-300 whitespace-nowrap">{line.link.label}</Link>}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <div className="flex items-start gap-2 text-xs text-muted">
                        <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>Após vincular novos TMDB IDs, execute "Sync TMDB" abaixo para preencher foto, bio e outros dados dos artistas recém-vinculados.</span>
                    </div>
                </div>

                {/* ── 2. Corrigir nomes ── */}
                <LogPanel
                    running={fixRunning} log={fixLog} stats={fixStats} onStart={startFixNames}
                    icon={Type}
                    title="Corrigir nomes romanizados incorretos"
                    description="Artistas com Hangul em nameRomanized → busca nome correto no TMDB (requer tmdbId)"
                    buttonLabel="Iniciar correção"
                    statLabels={['Corrigidos', 'Sem TMDB / conflitos', 'Erros']}
                />

                {/* ── 3. Preencher Hangul ── */}
                <LogPanel
                    running={hangulRunning} log={hangulLog} stats={hangulStats} onStart={startFillHangul}
                    icon={Languages}
                    title="Preencher nome em Hangul"
                    description="Artistas com tmdbId mas sem nameHangul → busca Hangul em also_known_as"
                    buttonLabel="Preencher Hangul"
                    statLabels={['Preenchidos', 'Sem dados', 'Erros']}
                />

                {/* ── 4. Sync TMDB ── */}
                <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <Database className="w-5 h-5 text-accent flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-foreground">Sincronizar dados biográficos do TMDB</p>
                                <p className="text-xs text-muted mt-0.5">
                                    Foto, bio, nascimento, local, gênero — processa em lotes de 500.
                                    {artistStats && <span className="ml-1 text-accent font-medium">→ {artistStats.withTmdb.toLocaleString('pt-BR')} artistas elegíveis (com TMDB ID)</span>}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            {savedSync && !syncRunning ? (
                                <AdminButton variant="secondary" size="lg" onClick={resumeSyncTmdb} title={`Retomar do offset ${savedSync.offset.toLocaleString('pt-BR')}`}>
                                    <Play className="w-4 h-4" /> Retomar ({savedSync.offset.toLocaleString('pt-BR')}/{savedSync.totalGlobal.toLocaleString('pt-BR')})
                                </AdminButton>
                            ) : (
                                <AdminButton variant="primary" size="lg" onClick={startSyncTmdb} disabled={syncRunning}>
                                    {syncRunning ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processando...</> : <><CheckCircle className="w-4 h-4" /> Preencher vazios</>}
                                </AdminButton>
                            )}
                            <button
                                onClick={startSyncTmdbSmart}
                                disabled={syncRunning}
                                className="flex items-center gap-2 px-4 py-2 bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-400 disabled:opacity-50 rounded-lg text-sm font-bold transition-colors"
                                title="Atualiza todos os campos não editados manualmente"
                            >
                                {syncRunning ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processando...</> : <><RefreshCw className="w-4 h-4" /> Smart sync</>}
                            </button>
                            <AdminButton variant="warning" size="lg" onClick={startSyncTmdbAll} disabled={syncRunning}>
                                {syncRunning ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processando...</> : <><RefreshCw className="w-4 h-4" /> Forçar todos ({artistStats?.withTmdb.toLocaleString('pt-BR') ?? '…'})</>}
                            </AdminButton>
                            {syncRunning && (
                                <AdminButton variant="danger" size="lg" onClick={() => { syncAbortRef.current = true }} title="Parar após o lote atual">
                                    ✕ Parar
                                </AdminButton>
                            )}
                        </div>
                    </div>

                    {syncTotalGlobal > 0 && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted">
                                <span>Progresso global</span>
                                <span>{syncProcessed.toLocaleString('pt-BR')} / {syncTotalGlobal.toLocaleString('pt-BR')} artistas · {Math.min(100, Math.round((syncProcessed / syncTotalGlobal) * 100))}%</span>
                            </div>
                            <div className="h-2 bg-surface rounded-full overflow-hidden">
                                <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round((syncProcessed / syncTotalGlobal) * 100))}%` }} />
                            </div>
                        </div>
                    )}

                    {syncStats && (
                        <div className="grid grid-cols-3 gap-3">
                            <StatCard label="Enriquecidos" value={syncStats.main} color="text-green-400" />
                            <StatCard label="Sem dados TMDB" value={syncStats.secondary} color="text-yellow-400" />
                            <StatCard label="Erros" value={syncStats.errors} color="text-red-400" />
                        </div>
                    )}

                    {syncLog.length > 0 && (
                        <div ref={syncLogRef} className="bg-background rounded-lg p-4 max-h-72 overflow-y-auto font-mono text-xs space-y-1 border border-border">
                            {syncLog.map((line, i) => {
                                const color = line.type === 'success' ? 'text-green-400' : line.type === 'error' ? 'text-red-400' : line.type === 'warning' ? 'text-yellow-400' : line.type === 'done' ? 'text-accent font-bold' : line.type === 'progress' ? 'text-muted' : 'text-foreground'
                                return (
                                    <div key={i} className={`flex items-center gap-2 ${color}`}>
                                        <span>{line.text}</span>
                                        {line.link && <Link href={line.link.href} target="_blank" className="ml-1 underline text-amber-400 hover:text-amber-300 whitespace-nowrap">{line.link.label}</Link>}
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
