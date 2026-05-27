'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminEmptyState } from '@/components/admin'
import Image from 'next/image'
import Link from 'next/link'
import { Sparkles, Search, TrendingUp, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react'

interface ArtistEnrichStatus {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    slug: string | null
    trendingScore: number
    hasBio: boolean
    hasEditorial: boolean
    hasCuriosidades: boolean
    nCuriosidades: number
    hasHeight: boolean
    hasBloodType: boolean
    hasFanInfo: boolean
    hasAwards: boolean
    hasMusicalStyle: boolean
    enrichedAt: string | null
    score: number
}

interface QueueResponse {
    artists: ArtistEnrichStatus[]
    total: number
    page: number
    pages: number
    pageSize: number
}

type FilterMode = 'incomplete' | 'enriched' | 'all'

const FILTER_LABELS: Record<FilterMode, string> = {
    incomplete: 'Incompletos',
    enriched: 'Enriquecidos',
    all: 'Todos',
}

const FIELD_DOTS: Array<{ key: keyof ArtistEnrichStatus; abbr: string; label: string }> = [
    { key: 'hasBio',          abbr: 'BI', label: 'Bio' },
    { key: 'hasEditorial',    abbr: 'ED', label: 'Editorial' },
    { key: 'hasCuriosidades', abbr: 'CU', label: 'Curiosidades' },
    { key: 'hasHeight',       abbr: 'AL', label: 'Altura' },
    { key: 'hasBloodType',    abbr: 'SA', label: 'Tipo Sanguíneo' },
    { key: 'hasFanInfo',      abbr: 'FA', label: 'Fandom' },
    { key: 'hasAwards',       abbr: 'PR', label: 'Prêmios' },
]

function completudeScore(a: ArtistEnrichStatus): number {
    return Math.round(
        FIELD_DOTS.filter(f => a[f.key as keyof ArtistEnrichStatus]).length / FIELD_DOTS.length * 100
    )
}

function ScoreBar({ score }: { score: number }) {
    const color = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
    return (
        <div className="flex items-center gap-2 shrink-0">
            <div className="w-14 h-1.5 bg-border rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
            </div>
            <span className="text-[10px] text-muted font-bold w-7">{score}%</span>
        </div>
    )
}

export default function ArtistEnrichQueuePage() {
    const [data, setData] = useState<QueueResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<FilterMode>('incomplete')
    const [page, setPage] = useState(1)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const load = useCallback(async (q: string, f: FilterMode, p: number) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ filter: f, page: String(p) })
            if (q.trim()) params.set('q', q.trim())
            const res = await fetch(`/api/admin/artists/enrich-queue?${params}`)
            if (!res.ok) return
            const json = await res.json()
            const artists = (json.artists as ArtistEnrichStatus[]).map(a => ({
                ...a,
                score: completudeScore(a),
            }))
            setData({ ...json, artists })
        } finally {
            setLoading(false)
        }
    }, [])

    // Ao mudar filtro ou página: carregar imediatamente
    useEffect(() => {
        load(search, filter, page)
    }, [filter, page]) // eslint-disable-line react-hooks/exhaustive-deps

    // Ao digitar na busca: debounce + reset para página 1
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            setPage(1)
            load(search, filter, 1)
        }, search ? 400 : 0)
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

    const artists = data?.artists ?? []
    const total = data?.total ?? 0
    const pages = data?.pages ?? 1

    return (
        <AdminLayout
            title="Enriquecimento de Artistas"
            subtitle="Gere o JSON no Gemini com prompts/idol-enrich.md e aplique aqui."
            actions={
                <button
                    onClick={() => load(search, filter, page)}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg text-xs text-muted hover:text-foreground transition-colors shrink-0"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </button>
            }
        >
            <div className="max-w-5xl space-y-5">
                {/* Filtros + busca */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar artista por nome ou hangul..."
                            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50"
                        />
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                        {(Object.keys(FILTER_LABELS) as FilterMode[]).map(f => (
                            <button
                                key={f}
                                onClick={() => { setFilter(f); setPage(1) }}
                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                                    filter === f
                                        ? 'bg-accent text-white'
                                        : 'bg-surface border border-border text-muted hover:text-foreground'
                                }`}
                            >
                                {FILTER_LABELS[f]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Legenda */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    {FIELD_DOTS.map(f => (
                        <span key={f.abbr}>
                            <span className="font-black text-foreground">{f.abbr}</span> {f.label}
                        </span>
                    ))}
                </div>

                {/* Contagem */}
                {!loading && (
                    <p className="text-xs text-muted">
                        {total} artista{total !== 1 ? 's' : ''}
                        {filter === 'incomplete' && ' com campos incompletos'}
                        {pages > 1 && ` · página ${page} de ${pages}`}
                    </p>
                )}

                {/* Lista */}
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-muted gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Carregando...</span>
                    </div>
                ) : artists.length === 0 ? (
                    <AdminEmptyState
                        title="Nenhum artista encontrado"
                        description={search ? `Nenhum resultado para "${search}"` : 'Todos os artistas estão completos!'}
                    />
                ) : (
                    <div className="space-y-1.5">
                        {artists.map((a, idx) => (
                            <Link
                                key={a.id}
                                href={`/admin/artists/${a.id}/enrich`}
                                className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3 hover:border-accent/40 hover:bg-accent/5 transition-all group"
                            >
                                {/* Rank */}
                                <span className="text-xs font-black text-muted w-6 text-right shrink-0">
                                    {(page - 1) * (data?.pageSize ?? 50) + idx + 1}
                                </span>

                                {/* Foto */}
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-hover shrink-0">
                                    {a.primaryImageUrl ? (
                                        <Image
                                            src={a.primaryImageUrl}
                                            alt={a.nameRomanized}
                                            width={32}
                                            height={32}
                                            className="w-full h-full object-cover object-top"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted text-[9px] font-black">
                                            {a.nameRomanized.slice(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Nome */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-foreground truncate leading-tight">{a.nameRomanized}</p>
                                    {a.nameHangul && (
                                        <p className="text-xs text-muted leading-tight">{a.nameHangul}</p>
                                    )}
                                </div>

                                {/* Trending */}
                                <div className="hidden sm:flex items-center gap-1 text-muted shrink-0">
                                    <TrendingUp className="w-3 h-3" />
                                    <span className="text-xs font-bold">{Math.round(a.trendingScore)}</span>
                                </div>

                                {/* Dots de campos */}
                                <div className="hidden lg:flex items-center gap-0.5 shrink-0">
                                    {FIELD_DOTS.map(f => (
                                        <span
                                            key={f.abbr}
                                            title={`${f.label}: ${a[f.key] ? 'ok' : 'faltando'}`}
                                            className={`inline-flex items-center justify-center w-5 h-5 rounded text-[8px] font-black ${
                                                a[f.key]
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-red-500/15 text-red-400'
                                            }`}
                                        >
                                            {f.abbr}
                                        </span>
                                    ))}
                                </div>

                                {/* Score */}
                                <div className="hidden sm:block">
                                    <ScoreBar score={a.score} />
                                </div>

                                {/* Data enriquecimento */}
                                {a.enrichedAt && (
                                    <span className="hidden xl:block text-[10px] text-green-400 font-bold shrink-0 w-12 text-right">
                                        ✦ {new Date(a.enrichedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    </span>
                                )}

                                <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors shrink-0" />
                            </Link>
                        ))}
                    </div>
                )}

                {/* Paginação */}
                {pages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="flex items-center gap-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-muted hover:text-foreground disabled:opacity-40 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Anterior
                        </button>
                        <span className="text-sm text-muted font-bold">
                            {page} / {pages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(pages, p + 1))}
                            disabled={page === pages || loading}
                            className="flex items-center gap-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-muted hover:text-foreground disabled:opacity-40 transition-colors"
                        >
                            Próxima
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
