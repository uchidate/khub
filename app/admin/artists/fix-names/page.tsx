'use client'

import { useState, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Languages, RefreshCw, AlertTriangle, CheckCircle, Type } from 'lucide-react'

type LogLine = { text: string; type: 'info' | 'success' | 'warning' | 'error' | 'done' | 'progress' }

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
        case 'NO_TMDB':
            return { text: `➖ Sem TMDB: ${payload}`, type: 'warning' }
        case 'ERROR':
            return { text: `❌ Erro: ${payload}`, type: 'error' }
        case 'DONE':
            return { text: `🎉 Concluído! ${payload.replace('fixed=', 'corrigidos: ').replace(',noTmdb=', ' | sem TMDB: ').replace(',errors=', ' | erros: ')}`, type: 'done' }
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
    title,
    description,
    buttonLabel,
    statLabels,
}: {
    running: boolean
    log: LogLine[]
    stats: Stats
    onStart: () => void
    title: string
    description: string
    buttonLabel: string
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
                <button
                    onClick={onStart}
                    disabled={running}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors flex-shrink-0"
                >
                    {running
                        ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processando...</>
                        : <><CheckCircle className="w-4 h-4" /> {buttonLabel}</>
                    }
                </button>
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
                        <div key={i} className={lineColor(line.type)}>{line.text}</div>
                    ))}
                </div>
            )}
        </div>
    )
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

    async function runStream(
        mode: string,
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
            const res = await fetch('/api/admin/fix-artist-names', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode }),
            })

            if (!res.ok || !res.body) {
                setLog(prev => [...prev, { text: `❌ Erro HTTP ${res.status}`, type: 'error' }])
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
        'fix-names',
        parseLineFixNames,
        setFixRunning,
        setFixLog,
        setFixStats,
        /fixed=(\d+),noTmdb=(\d+),errors=(\d+)/,
        (m) => ({ total: parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3]), main: parseInt(m[1]), secondary: parseInt(m[2]), errors: parseInt(m[3]) })
    ), [])

    const startFillHangul = useCallback(() => runStream(
        'fill-hangul',
        parseLineFillHangul,
        setHangulRunning,
        setHangulLog,
        setHangulStats,
        /filled=(\d+),notFound=(\d+),errors=(\d+)/,
        (m) => ({ total: parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3]), main: parseInt(m[1]), secondary: parseInt(m[2]), errors: parseInt(m[3]) })
    ), [])

    return (
        <AdminLayout title="Corrigir Nomes de Artistas">
            <div className="space-y-6">
                {/* Info card */}
                <div className="bg-zinc-900 border border-amber-500/20 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-bold text-white flex items-center gap-2">
                                    <Type className="w-4 h-4 text-amber-400" />
                                    Corrigir Nomes Romanizados
                                </p>
                                <ul className="mt-1.5 space-y-1 text-xs text-zinc-400">
                                    <li>• Encontra artistas onde <code className="text-amber-300 bg-zinc-800 px-1 rounded">nameRomanized</code> contém caracteres coreanos</li>
                                    <li>• Busca o nome romanizado correto no TMDB via <code className="text-amber-300 bg-zinc-800 px-1 rounded">tmdbId</code></li>
                                    <li>• Move o nome coreano para <code className="text-amber-300 bg-zinc-800 px-1 rounded">nameHangul</code> (se vazio) e extrai <code className="text-amber-300 bg-zinc-800 px-1 rounded">stageNames</code></li>
                                </ul>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white flex items-center gap-2">
                                    <Languages className="w-4 h-4 text-amber-400" />
                                    Preencher Hangul
                                </p>
                                <ul className="mt-1.5 space-y-1 text-xs text-zinc-400">
                                    <li>• Encontra artistas com <code className="text-amber-300 bg-zinc-800 px-1 rounded">tmdbId</code> mas sem <code className="text-amber-300 bg-zinc-800 px-1 rounded">nameHangul</code></li>
                                    <li>• Busca o nome em Hangul no campo <code className="text-amber-300 bg-zinc-800 px-1 rounded">also_known_as</code> do TMDB</li>
                                    <li>• Preenche <code className="text-amber-300 bg-zinc-800 px-1 rounded">nameHangul</code> e <code className="text-amber-300 bg-zinc-800 px-1 rounded">stageNames</code> (se vazio)</li>
                                </ul>
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
                    statLabels={['Corrigidos', 'Sem TMDB', 'Erros']}
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
            </div>
        </AdminLayout>
    )
}
