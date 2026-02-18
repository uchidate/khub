'use client'

import { useState, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Languages, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'

type LogLine = { text: string; type: 'info' | 'success' | 'warning' | 'error' | 'done' | 'progress' }

function parseLine(line: string): LogLine {
    const [type, ...rest] = line.split(':')
    const payload = rest.join(':')

    switch (type) {
        case 'TOTAL':
            return { text: `📋 ${payload} artistas com nome coreano em nameRomanized`, type: 'info' }
        case 'PROGRESS': {
            // Format: PROGRESS:i+1/artists.length:nameRomanized
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

export default function FixNamesAdminPage() {
    const [running, setRunning] = useState(false)
    const [log, setLog] = useState<LogLine[]>([])
    const [stats, setStats] = useState<{ total: number; fixed: number; noTmdb: number; errors: number } | null>(null)
    const logRef = useRef<HTMLDivElement>(null)

    const scrollLog = () => {
        setTimeout(() => {
            if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
        }, 50)
    }

    const startFix = useCallback(async () => {
        setRunning(true)
        setLog([{ text: '🚀 Iniciando correção de nomes...', type: 'info' }])
        setStats(null)

        try {
            const res = await fetch('/api/admin/fix-artist-names', { method: 'POST' })

            if (!res.ok || !res.body) {
                setLog(prev => [...prev, { text: `❌ Erro HTTP ${res.status}`, type: 'error' }])
                return
            }

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            let done = false

            while (!done) {
                const result = await reader.read()
                done = result.done
                if (done) break
                buffer += decoder.decode(result.value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (!line.trim()) continue
                    const parsed = parseLine(line)
                    setLog(prev => [...prev, parsed])
                    scrollLog()

                    // Parse DONE line for final stats
                    if (line.startsWith('DONE:')) {
                        const match = line.match(/fixed=(\d+),noTmdb=(\d+),errors=(\d+)/)
                        if (match) {
                            setStats({
                                total: parseInt(match[1]) + parseInt(match[2]) + parseInt(match[3]),
                                fixed: parseInt(match[1]),
                                noTmdb: parseInt(match[2]),
                                errors: parseInt(match[3]),
                            })
                        }
                    }
                    // Parse TOTAL line
                    if (line.startsWith('TOTAL:')) {
                        const total = parseInt(line.replace('TOTAL:', ''))
                        setStats(prev => ({ fixed: 0, noTmdb: 0, errors: 0, ...prev, total }))
                    }
                }
            }
        } catch (e) {
            setLog(prev => [...prev, { text: `❌ Erro: ${e}`, type: 'error' }])
        } finally {
            setRunning(false)
        }
    }, [])

    const lineColor = (type: LogLine['type']) => {
        if (type === 'success') return 'text-green-400'
        if (type === 'error') return 'text-red-400'
        if (type === 'warning') return 'text-yellow-400'
        if (type === 'done') return 'text-purple-400 font-bold'
        if (type === 'progress') return 'text-zinc-500'
        return 'text-zinc-300'
    }

    return (
        <AdminLayout title="Corrigir Nomes de Artistas">
            <div className="space-y-6">
                {/* Info card */}
                <div className="bg-zinc-900 border border-amber-500/20 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-white">O que esta ferramenta faz</p>
                            <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                                <li>• Encontra artistas onde <code className="text-amber-300 bg-zinc-800 px-1 rounded">nameRomanized</code> contém caracteres coreanos</li>
                                <li>• Busca o nome romanizado correto no TMDB via <code className="text-amber-300 bg-zinc-800 px-1 rounded">tmdbId</code></li>
                                <li>• Move o nome coreano para <code className="text-amber-300 bg-zinc-800 px-1 rounded">nameHangul</code> (se vazio)</li>
                                <li>• Extrai <code className="text-amber-300 bg-zinc-800 px-1 rounded">stageNames</code> do campo <code className="text-amber-300 bg-zinc-800 px-1 rounded">also_known_as</code> do TMDB</li>
                                <li>• Artistas sem <code className="text-amber-300 bg-zinc-800 px-1 rounded">tmdbId</code> são reportados como "Sem TMDB" e não alterados</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Stats (shown after run) */}
                {stats && (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-zinc-900 border border-green-500/20 rounded-xl p-4 text-center">
                            <p className="text-2xl font-black text-green-400">{stats.fixed}</p>
                            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Corrigidos</p>
                        </div>
                        <div className="bg-zinc-900 border border-yellow-500/20 rounded-xl p-4 text-center">
                            <p className="text-2xl font-black text-yellow-400">{stats.noTmdb}</p>
                            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Sem TMDB</p>
                        </div>
                        <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-4 text-center">
                            <p className="text-2xl font-black text-red-400">{stats.errors}</p>
                            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Erros</p>
                        </div>
                    </div>
                )}

                {/* Action panel */}
                <div className="bg-zinc-900 border border-purple-500/20 rounded-xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <Languages className="w-5 h-5 text-purple-400 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-white">Correção automática via TMDB</p>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    Processa artistas com nomes coreanos no campo romanizado e busca o nome correto
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={startFix}
                            disabled={running}
                            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors flex-shrink-0"
                        >
                            {running
                                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Corrigindo...</>
                                : <><CheckCircle className="w-4 h-4" /> Iniciar correção</>
                            }
                        </button>
                    </div>

                    {/* Log output */}
                    {log.length > 0 && (
                        <div
                            ref={logRef}
                            className="mt-4 bg-black/40 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs space-y-1 border border-white/5"
                        >
                            {log.map((line, i) => (
                                <div key={i} className={lineColor(line.type)}>{line.text}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    )
}
