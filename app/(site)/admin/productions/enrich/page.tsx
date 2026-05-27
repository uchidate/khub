'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminEmptyState } from '@/components/admin'
import Image from 'next/image'
import Link from 'next/link'
import { Film, Search, RefreshCw, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

interface ProductionEnrichStatus {
    id: string
    titlePt: string
    titleKr: string | null
    type: string
    year: number | null
    network: string | null
    imageUrl: string | null
    voteAverage: number | null
    episodeCount: number | null
    hasSynopsis: boolean
    hasTagline: boolean
    hasWhyWatch: boolean
    hasEditorialReview: boolean
    hasEditorialRating: boolean
    hasCuriosidades: boolean
    nCuriosidades: number
    enrichedAt: string | null
    score: number
}

interface QueueResponse {
    productions: ProductionEnrichStatus[]
    total: number
    page: number
    pages: number
    pageSize: number
}

type FilterMode = 'incomplete' | 'enriched' | 'all'
type TypeFilter = 'all' | 'K-Drama' | 'SERIE' | 'Filme' | 'FILME'

const FILTER_LABELS: Record<FilterMode, string> = {
    incomplete: 'Incompletos',
    enriched:   'Enriquecidos',
    all:        'Todos',
}

const TYPE_LABELS: { value: TypeFilter; label: string }[] = [
    { value: 'all',     label: 'Todos' },
    { value: 'K-Drama', label: 'K-Drama' },
    { value: 'SERIE',   label: 'Série' },
    { value: 'Filme',   label: 'Filme' },
]

const FIELD_DOTS = [
    { key: 'hasSynopsis' as const,        abbr: 'SI', label: 'Sinopse PT-BR' },
    { key: 'hasTagline' as const,         abbr: 'TG', label: 'Tagline' },
    { key: 'hasWhyWatch' as const,        abbr: 'PQ', label: 'Por que assistir' },
    { key: 'hasEditorialReview' as const, abbr: 'AN', label: 'Análise' },
    { key: 'hasEditorialRating' as const, abbr: 'NT', label: 'Nota' },
    { key: 'hasCuriosidades' as const,    abbr: 'CU', label: 'Curiosidades' },
]

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

export default function ProductionEnrichQueuePage() {
    const [data, setData] = useState<QueueResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<FilterMode>('incomplete')
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
    const [page, setPage] = useState(1)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const load = useCallback(async (q: string, f: FilterMode, t: TypeFilter, p: number) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ filter: f, type: t, page: String(p) })
            if (q.trim()) params.set('q', q.trim())
            const res = await fetch(`/api/admin/productions/enrich-queue?${params}`)
            if (!res.ok) return
            setData(await res.json())
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        load(search, filter, typeFilter, page)
    }, [filter, typeFilter, page]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            setPage(1)
            load(search, filter, typeFilter, 1)
        }, search ? 400 : 0)
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

    const productions = data?.productions ?? []
    const total = data?.total ?? 0
    const pages = data?.pages ?? 1

    return (
        <AdminLayout title="Curadoria Gemini de Produções" subtitle="Gera sinopses em português via IA para produções sem tradução">
            <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-black text-foreground flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-accent" />
                            Curadoria Gemini de Produções
                        </h1>
                        <p className="text-sm text-muted mt-0.5">
                            Gere o JSON no Gemini com <code className="text-xs bg-surface-hover px-1 rounded">prompts/production-enrich.md</code> e aplique aqui.
                        </p>
                    </div>
                    <button
                        onClick={() => load(search, filter, typeFilter, page)}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg text-xs text-muted hover:text-foreground transition-colors shrink-0"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                </div>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por título..."
                            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50"
                        />
                    </div>
                    <div className="flex gap-1.5 shrink-0 flex-wrap">
                        {(Object.keys(FILTER_LABELS) as FilterMode[]).map(f => (
                            <button key={f} onClick={() => { setFilter(f); setPage(1) }}
                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${filter === f ? 'bg-accent text-white' : 'bg-surface border border-border text-muted hover:text-foreground'}`}>
                                {FILTER_LABELS[f]}
                            </button>
                        ))}
                        <div className="w-px bg-border mx-1" />
                        {TYPE_LABELS.map(t => (
                            <button key={t.value} onClick={() => { setTypeFilter(t.value); setPage(1) }}
                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${typeFilter === t.value ? 'bg-surface-hover text-foreground border border-accent/40' : 'bg-surface border border-border text-muted hover:text-foreground'}`}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Legenda */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    {FIELD_DOTS.map(f => (
                        <span key={f.abbr}><span className="font-black text-foreground">{f.abbr}</span> {f.label}</span>
                    ))}
                </div>

                {!loading && (
                    <p className="text-xs text-muted">
                        {total} produção{total !== 1 ? 'ções' : ''}
                        {filter === 'incomplete' && ' com campos incompletos'}
                        {pages > 1 && ` · página ${page} de ${pages}`}
                    </p>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-16 text-muted gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Carregando...</span>
                    </div>
                ) : productions.length === 0 ? (
                    <AdminEmptyState title="Nenhuma produção encontrada"
                        description={search ? `Nenhum resultado para "${search}"` : 'Todas as produções estão completas!'} />
                ) : (
                    <div className="space-y-1.5">
                        {productions.map((p, idx) => (
                            <Link key={p.id} href={`/admin/productions/${p.id}/enrich`}
                                className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3 hover:border-accent/40 hover:bg-accent/5 transition-all group">
                                <span className="text-xs font-black text-muted w-6 text-right shrink-0">
                                    {(page - 1) * (data?.pageSize ?? 50) + idx + 1}
                                </span>
                                <div className="w-8 h-10 rounded overflow-hidden bg-surface-hover shrink-0">
                                    {p.imageUrl ? (
                                        <Image src={p.imageUrl} alt={p.titlePt} width={32} height={40} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Film className="w-3 h-3 text-muted" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-foreground truncate leading-tight">
                                        {p.titlePt}
                                        {p.titleKr && /^[가-힣ᄀ-ᇿ㄰-㆏]/.test(p.titlePt) && (
                                            <span className="ml-1.5 text-xs font-normal text-muted">({p.titleKr})</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-muted leading-tight">
                                        {[p.type, p.year, p.network, p.episodeCount ? `${p.episodeCount} ep.` : null].filter(Boolean).join(' · ')}
                                    </p>
                                </div>
                                {p.voteAverage && p.voteAverage > 0 ? (
                                    <span className="hidden sm:block text-xs font-bold text-muted shrink-0">★ {p.voteAverage.toFixed(1)}</span>
                                ) : null}
                                <div className="hidden lg:flex items-center gap-0.5 shrink-0">
                                    {FIELD_DOTS.map(f => (
                                        <span key={f.abbr} title={`${f.label}: ${p[f.key] ? 'ok' : 'faltando'}`}
                                            className={`inline-flex items-center justify-center w-5 h-5 rounded text-[8px] font-black ${p[f.key] ? 'bg-green-500/20 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                                            {f.abbr}
                                        </span>
                                    ))}
                                </div>
                                <div className="hidden sm:block">
                                    <ScoreBar score={p.score} />
                                </div>
                                {p.enrichedAt && (
                                    <span className="hidden xl:block text-[10px] text-green-400 font-bold shrink-0 w-12 text-right">
                                        ✦ {new Date(p.enrichedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    </span>
                                )}
                                <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors shrink-0" />
                            </Link>
                        ))}
                    </div>
                )}

                {pages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}
                            className="flex items-center gap-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-muted hover:text-foreground disabled:opacity-40 transition-colors">
                            <ChevronLeft className="w-4 h-4" /> Anterior
                        </button>
                        <span className="text-sm text-muted font-bold">{page} / {pages}</span>
                        <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages || loading}
                            className="flex items-center gap-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-muted hover:text-foreground disabled:opacity-40 transition-colors">
                            Próxima <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
