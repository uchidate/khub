'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Users, RefreshCw, Music2, Search, X } from 'lucide-react'
import Image from 'next/image'

interface Artist {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    musicalGroupName: string | null
    musicalGroupId: string | null
    groupSyncAt: string | null
}

type LogLine = { text: string; type: 'info' | 'success' | 'warning' | 'error' | 'done' | 'progress' }

function parseLine(line: string): LogLine {
    const [type, ...rest] = line.split(':')
    const payload = rest.join(':')

    switch (type) {
        case 'TOTAL':
            return { text: `📋 ${payload} artistas para processar`, type: 'info' }
        case 'PROGRESS': {
            const parts = payload.split(':')
            return { text: `⏳ [${parts[0]}] ${parts.slice(1).join(':')}`, type: 'progress' }
        }
        case 'FOUND': {
            const parts = payload.split(':')
            const name = parts[0]
            const group = parts.slice(1).join(':')
            return { text: `✅ ${name} → ${group}`, type: 'success' }
        }
        case 'MB_FOUND': {
            const parts = payload.split(':')
            const artist = parts[0]
            const searchedBy = parts.slice(1).join(':')
            return { text: `🔍 ${artist} encontrado via "${searchedBy}"`, type: 'info' }
        }
        case 'SOLO':
            return { text: `➖ Solo: ${payload}`, type: 'warning' }
        case 'NOT_FOUND':
            return { text: `➖ Não encontrado no MusicBrainz: ${payload}`, type: 'warning' }
        case 'ERROR':
            return { text: `❌ Erro: ${payload}`, type: 'error' }
        case 'DONE':
            return {
                text: `🎉 Concluído! ${payload.replace('found=', 'com grupo: ').replace(',solo=', ' | solo/não encontrado: ').replace(',errors=', ' | erros: ')}`,
                type: 'done'
            }
        default:
            return { text: line, type: 'info' }
    }
}

export default function ArtistGroupsAdminPage() {
    const [artists, setArtists] = useState<Artist[]>([])
    const [filtered, setFiltered] = useState<Artist[]>([])
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'with_group' | 'solo' | 'unsynced'>('all')
    const [loading, setLoading] = useState(true)

    const [running, setRunning] = useState(false)
    const [log, setLog] = useState<LogLine[]>([])
    const [syncLimit, setSyncLimit] = useState(50)
    const [onlyMissing, setOnlyMissing] = useState(true)
    const [stats, setStats] = useState<{ found: number; solo: number; errors: number } | null>(null)
    const logRef = useRef<HTMLDivElement>(null)

    const fetchArtists = useCallback(async () => {
        setLoading(true)
        try {
            const all: Artist[] = []
            let page = 1
            let hasMore = true
            while (hasMore) {
                const res = await fetch(`/api/admin/artists?limit=100&page=${page}`)
                const json = await res.json()
                const items: Artist[] = json.data || []
                all.push(...items)
                hasMore = items.length === 100
                page++
            }
            setArtists(all)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchArtists() }, [fetchArtists])

    useEffect(() => {
        let list = artists
        if (search) {
            const q = search.toLowerCase()
            list = list.filter(a =>
                a.nameRomanized.toLowerCase().includes(q) ||
                (a.nameHangul || '').toLowerCase().includes(q) ||
                (a.musicalGroupName || '').toLowerCase().includes(q)
            )
        }
        if (filter === 'with_group') list = list.filter(a => !!a.musicalGroupName)
        if (filter === 'solo') list = list.filter(a => !a.musicalGroupName && !!a.groupSyncAt)
        if (filter === 'unsynced') list = list.filter(a => !a.groupSyncAt)
        setFiltered(list)
    }, [artists, search, filter])

    const scrollLog = () => setTimeout(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
    }, 50)

    const startSync = useCallback(async () => {
        setRunning(true)
        setLog([{ text: '🚀 Iniciando busca de grupos musicais via MusicBrainz...', type: 'info' }])
        setStats(null)

        try {
            const res = await fetch('/api/admin/sync-artist-groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ limit: syncLimit, onlyMissing }),
            })

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

                    if (line.startsWith('DONE:')) {
                        const match = line.match(/found=(\d+),solo=(\d+),errors=(\d+)/)
                        if (match) {
                            setStats({ found: parseInt(match[1]), solo: parseInt(match[2]), errors: parseInt(match[3]) })
                            await fetchArtists()
                        }
                    }
                }
            }
        } catch (e) {
            setLog(prev => [...prev, { text: `❌ Erro: ${e}`, type: 'error' }])
        } finally {
            setRunning(false)
        }
    }, [syncLimit, onlyMissing, fetchArtists])

    const lineColor = (type: LogLine['type']) => {
        if (type === 'success') return 'text-green-400'
        if (type === 'error') return 'text-red-400'
        if (type === 'warning') return 'text-yellow-400'
        if (type === 'done') return 'text-purple-400 font-bold'
        if (type === 'progress') return 'text-zinc-500'
        return 'text-zinc-300'
    }

    const withGroup = artists.filter(a => !!a.musicalGroupName).length
    const unsynced = artists.filter(a => !a.groupSyncAt).length

    return (
        <AdminLayout title="Grupos Musicais dos Artistas">
            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-white">{artists.length}</p>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Total</p>
                    </div>
                    <div className="bg-zinc-900 border border-purple-500/20 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-purple-400">{withGroup}</p>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Com grupo</p>
                    </div>
                    <div className="bg-zinc-900 border border-amber-500/20 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-amber-400">{unsynced}</p>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Não sincronizados</p>
                    </div>
                </div>

                {/* Sync panel */}
                <div className="bg-zinc-900 border border-purple-500/20 rounded-xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <Music2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-white">Sincronização automática via MusicBrainz</p>
                                <p className="text-xs text-zinc-500 mt-0.5">Busca relações "member of band" para identificar o grupo do artista</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={onlyMissing}
                                    onChange={e => setOnlyMissing(e.target.checked)}
                                    disabled={running}
                                    className="accent-purple-500"
                                />
                                Apenas não sincronizados
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-500 font-medium">Limite:</span>
                                <select
                                    value={syncLimit}
                                    onChange={e => setSyncLimit(Number(e.target.value))}
                                    disabled={running}
                                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
                                >
                                    {[20, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                            <button
                                onClick={startSync}
                                disabled={running}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors"
                            >
                                {running
                                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sincronizando...</>
                                    : <><Users className="w-4 h-4" /> Sincronizar</>
                                }
                            </button>
                        </div>
                    </div>

                    {/* Stats after sync */}
                    {stats && (
                        <div className="mt-4 grid grid-cols-3 gap-3">
                            <div className="bg-black/30 rounded-lg p-3 text-center">
                                <p className="text-lg font-black text-green-400">{stats.found}</p>
                                <p className="text-xs text-zinc-500">Com grupo</p>
                            </div>
                            <div className="bg-black/30 rounded-lg p-3 text-center">
                                <p className="text-lg font-black text-yellow-400">{stats.solo}</p>
                                <p className="text-xs text-zinc-500">Solo/não encontrado</p>
                            </div>
                            <div className="bg-black/30 rounded-lg p-3 text-center">
                                <p className="text-lg font-black text-red-400">{stats.errors}</p>
                                <p className="text-xs text-zinc-500">Erros</p>
                            </div>
                        </div>
                    )}

                    {/* Log */}
                    {log.length > 0 && (
                        <div
                            ref={logRef}
                            className="mt-4 bg-black/40 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-xs space-y-1 border border-white/5"
                        >
                            {log.map((line, i) => (
                                <div key={i} className={lineColor(line.type)}>{line.text}</div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        {search ? (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        ) : (
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        )}
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar artista ou grupo..."
                            className="w-full px-4 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {([
                            ['all', 'Todos'],
                            ['with_group', 'Com grupo'],
                            ['solo', 'Solo'],
                            ['unsynced', 'Não sincronizados'],
                        ] as const).map(([val, label]) => (
                            <button
                                key={val}
                                onClick={() => setFilter(val)}
                                className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${filter === val ? 'bg-purple-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Artist list */}
                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-16 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.length === 0 && (
                            <div className="text-center py-16 text-zinc-500">Nenhum artista encontrado</div>
                        )}
                        {filtered.map(artist => (
                            <div
                                key={artist.id}
                                className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl"
                            >
                                {artist.primaryImageUrl ? (
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                                        <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill sizes="40px" className="object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-black text-zinc-400 flex-shrink-0">
                                        {artist.nameRomanized[0]}
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-sm truncate">{artist.nameRomanized}</p>
                                    {artist.nameHangul && <p className="text-xs text-zinc-500 truncate">{artist.nameHangul}</p>}
                                </div>

                                <div className="flex-shrink-0">
                                    {artist.musicalGroupName ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-full text-xs font-bold">
                                            <Music2 className="w-3 h-3" />
                                            {artist.musicalGroupName}
                                        </span>
                                    ) : artist.groupSyncAt ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-500 rounded-full text-xs">
                                            Solo / não encontrado
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-bold">
                                            Não sincronizado
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
