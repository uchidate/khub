'use client'

import Link from 'next/link'
import { Fragment, useState, useCallback, useEffect, useMemo } from 'react'
import { TrendingUp, Flame, ArrowUp, ArrowDown, Minus, RefreshCw, Tv, Star, X, Search, ExternalLink, ListFilter, Crown, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import {
    AdminLayout, AdminButton, AdminIconButton, SectionHeader, StatCard,
    AdminBadge, AdminEmptyState, AdminTableSkeleton, AdminSearchInput,
} from '@/components/admin'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { getArtistBadgeDisplay } from '@/lib/trending/display'
import { getArtistBadge, getRankDelta, type TrendingBadge, type ArtistForBadge } from '@/lib/trending/badges'

interface TrendingArtistRow extends ArtistForBadge {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    trendingScore: number
    viewCount: number
    favoriteCount: number
    _count?: { streamingSignals: number }
    streamingSignals?: { showTitle: string; rank: number; source: string }[]
}

interface TrendingStats {
    total: number
    withSignals: number
    withBadgeOverride: number
    avgScore: number
    rising: number
    falling: number
    newInTop: number
}

type BadgeFilter = 'ALL' | NonNullable<TrendingBadge> | 'FALLING' | 'NONE'
type SignalFilter = 'all' | 'with' | 'without'
type OverrideFilter = 'all' | 'manual' | 'automatic'
type SortKey = 'rank' | 'score' | 'delta' | 'views' | 'favorites' | 'signals'

const OVERRIDE_OPTIONS: Array<{ value: string; label: string }> = [
    { value: '', label: 'Automático' },
    { value: 'HOT', label: 'HOT' },
    { value: 'SUBINDO', label: 'SUBINDO' },
    { value: 'NOVO', label: 'NOVO' },
]

function getSignalSourceLabel(source: string) {
    return source.replace(/_br$/i, '').replace(/_/g, ' ').toUpperCase()
}

export default function AdminTrendingPage() {
    const toast = useAdminToast()
    const [artists, setArtists] = useState<TrendingArtistRow[]>([])
    const [stats, setStats] = useState<TrendingStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [savingId, setSavingId] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>('ALL')
    const [signalFilter, setSignalFilter] = useState<SignalFilter>('all')
    const [overrideFilter, setOverrideFilter] = useState<OverrideFilter>('all')
    const [sortKey, setSortKey] = useState<SortKey>('rank')
    const [expandedArtistId, setExpandedArtistId] = useState<string | null>(null)
    const [generatedAt, setGeneratedAt] = useState<string | null>(null)
    const [refreshCountdown, setRefreshCountdown] = useState<number | null>(null)

    const fetchData = useCallback(async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/admin/trending')
            if (!res.ok) throw new Error('Falha ao carregar dados')
            const data = await res.json()
            setArtists(data.artists)
            setStats(data.stats)
            setGeneratedAt(data.generatedAt ?? new Date().toISOString())
        } catch (_e) {
            toast.error('Erro ao carregar ranking de trending')
        } finally {
            setIsLoading(false)
        }
    }, [toast])

    useEffect(() => { fetchData() }, [fetchData])

    useEffect(() => {
        if (refreshCountdown === null) return

        if (refreshCountdown <= 0) {
            setRefreshCountdown(null)
            fetchData()
            return
        }

        const timer = window.setTimeout(() => {
            setRefreshCountdown((current) => (current === null ? null : current - 1))
        }, 1000)

        return () => window.clearTimeout(timer)
    }, [refreshCountdown, fetchData])

    const triggerRefresh = useCallback(async () => {
        setIsRefreshing(true)
        try {
            const res = await fetch('/api/admin/cron', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId: 'update-trending' }),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok || !data?.ok) {
                throw new Error(data?.error || data?.message || 'Falha ao disparar recálculo')
            }
            setRefreshCountdown(12)
            toast.info('Recálculo iniciado — a página vai atualizar sozinha em alguns segundos')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao acionar recálculo')
        } finally {
            setIsRefreshing(false)
        }
    }, [toast])

    const setOverride = useCallback(async (artistId: string, badge: string | null) => {
        setSavingId(artistId)
        try {
            const res = await fetch('/api/admin/trending/override', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artistId, badge }),
            })
            if (!res.ok) throw new Error()
            setArtists(prev => prev.map(a =>
                a.id === artistId ? { ...a, trendingBadgeOverride: badge } : a
            ))
            toast.saved()
        } catch {
            toast.error('Erro ao salvar override')
        } finally {
            setSavingId(null)
        }
    }, [toast])

    const filteredArtists = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase()

        const filtered = artists.filter((artist) => {
            const effectiveBadge = getArtistBadge(artist)
            const delta = getRankDelta(artist)
            const hasSignals = (artist.streamingSignals?.length ?? 0) > 0
            const matchesSearch = !normalizedSearch || [artist.nameRomanized, artist.nameHangul ?? '']
                .join(' ')
                .toLowerCase()
                .includes(normalizedSearch)

            const matchesBadge = badgeFilter === 'ALL'
                || (badgeFilter === 'FALLING' && delta !== null && delta <= -3 && !effectiveBadge)
                || (badgeFilter === 'NONE' && !effectiveBadge && !(delta !== null && delta <= -3))
                || effectiveBadge === badgeFilter

            const matchesSignal = signalFilter === 'all'
                || (signalFilter === 'with' && hasSignals)
                || (signalFilter === 'without' && !hasSignals)

            const matchesOverride = overrideFilter === 'all'
                || (overrideFilter === 'manual' && !!artist.trendingBadgeOverride)
                || (overrideFilter === 'automatic' && !artist.trendingBadgeOverride)

            return matchesSearch && matchesBadge && matchesSignal && matchesOverride
        })

        filtered.sort((left, right) => {
            const leftDelta = getRankDelta(left) ?? Number.NEGATIVE_INFINITY
            const rightDelta = getRankDelta(right) ?? Number.NEGATIVE_INFINITY
            const leftSignals = left.streamingSignals?.length ?? 0
            const rightSignals = right.streamingSignals?.length ?? 0

            switch (sortKey) {
                case 'score':
                    return right.trendingScore - left.trendingScore
                case 'delta':
                    return rightDelta - leftDelta
                case 'views':
                    return right.viewCount - left.viewCount
                case 'favorites':
                    return right.favoriteCount - left.favoriteCount
                case 'signals':
                    return rightSignals - leftSignals || right.trendingScore - left.trendingScore
                case 'rank':
                default:
                    return (left.trendingRank ?? 9999) - (right.trendingRank ?? 9999)
            }
        })

        return filtered
    }, [artists, badgeFilter, overrideFilter, search, signalFilter, sortKey])

    const visibleStats = useMemo(() => {
        const withSignals = filteredArtists.filter((artist) => (artist.streamingSignals?.length ?? 0) > 0).length
        const manual = filteredArtists.filter((artist) => !!artist.trendingBadgeOverride).length
        const rising = filteredArtists.filter((artist) => getArtistBadge(artist) === 'SUBINDO').length
        const falling = filteredArtists.filter((artist) => {
            const delta = getRankDelta(artist)
            return delta !== null && delta <= -3 && !getArtistBadge(artist)
        }).length

        return { withSignals, manual, rising, falling }
    }, [filteredArtists])

    const activeFilterCount = [
        search.trim() ? 1 : 0,
        badgeFilter !== 'ALL' ? 1 : 0,
        signalFilter !== 'all' ? 1 : 0,
        overrideFilter !== 'all' ? 1 : 0,
        sortKey !== 'rank' ? 1 : 0,
    ].reduce((sum, item) => sum + item, 0)

    const resetFilters = () => {
        setSearch('')
        setBadgeFilter('ALL')
        setSignalFilter('all')
        setOverrideFilter('all')
        setSortKey('rank')
    }

    return (
        <AdminLayout
            title="Trending"
            subtitle="Ranking de artistas em alta · controle de badges"
        >
            <div className="space-y-6 p-4 md:p-6">
                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
                        <StatCard label="Artistas rankeados" value={stats.total} icon={<TrendingUp size={14} />} />
                        <StatCard label="Com sinal streaming" value={stats.withSignals} icon={<Tv size={14} />} />
                        <StatCard label="Badge manual ativo" value={stats.withBadgeOverride} icon={<Star size={14} />} />
                        <StatCard label="Score médio" value={`${stats.avgScore.toFixed(1)} pts`} icon={<Flame size={14} />} />
                        <StatCard label="Subindo agora" value={stats.rising} icon={<ArrowUp size={14} />} />
                        <StatCard label="Em queda" value={stats.falling} icon={<ArrowDown size={14} />} />
                    </div>
                )}

                {/* Header ações */}
                <SectionHeader
                    title="Top 50 — Artistas em Alta"
                    subtitle="Badge SUBINDO/DESCENDO calculado automaticamente por velocidade de rank"
                    icon={<Flame size={14} />}
                    actions={
                        <div className="flex items-center gap-2">
                            <AdminButton variant="secondary" size="sm" onClick={fetchData}>
                                <RefreshCw size={13} />
                                Atualizar lista
                            </AdminButton>
                            <AdminButton
                                variant="secondary"
                                size="sm"
                                onClick={triggerRefresh}
                                disabled={isRefreshing}
                            >
                                <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                                {isRefreshing ? 'Recalculando…' : 'Recalcular agora'}
                            </AdminButton>
                        </div>
                    }
                />

                <div className="-mt-2 flex items-center gap-2 text-xs text-muted">
                    <RefreshCw size={12} />
                    <span>Atualização automática do trending a cada 2 horas. Use o recálculo manual para forçar uma atualização imediata.</span>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex-1 max-w-xl">
                            <AdminSearchInput
                                value={search}
                                onChange={setSearch}
                                placeholder="Buscar artista por nome romanizado ou hangul"
                            />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted">
                            {generatedAt && <span>Atualizado às {new Date(generatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
                            {refreshCountdown !== null && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-blue-300">
                                    <RefreshCw size={12} className="animate-spin" />
                                    Atualizando em {refreshCountdown}s
                                </span>
                            )}
                            {activeFilterCount > 0 && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 hover:text-foreground hover:border-border transition-colors"
                                >
                                    <X size={12} />
                                    Limpar filtros
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {([
                            ['ALL', 'Todos'],
                            ['HOT', 'HOT'],
                            ['SUBINDO', 'Subindo'],
                            ['NOVO', 'Novo'],
                            ['FALLING', 'Em queda'],
                            ['NONE', 'Sem badge'],
                        ] as const).map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setBadgeFilter(value)}
                                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    badgeFilter === value
                                        ? 'border-accent/30 bg-accent/10 text-accent'
                                        : 'border-border text-muted hover:text-foreground hover:border-border'
                                }`}
                            >
                                <Sparkles size={12} />
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setSignalFilter('all')}
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${signalFilter === 'all' ? 'border-blue-500/30 bg-blue-500/10 text-blue-300' : 'border-border text-muted hover:text-foreground'}`}
                            >
                                Todos os sinais
                            </button>
                            <button
                                type="button"
                                onClick={() => setSignalFilter('with')}
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${signalFilter === 'with' ? 'border-blue-500/30 bg-blue-500/10 text-blue-300' : 'border-border text-muted hover:text-foreground'}`}
                            >
                                Com streaming
                            </button>
                            <button
                                type="button"
                                onClick={() => setSignalFilter('without')}
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${signalFilter === 'without' ? 'border-blue-500/30 bg-blue-500/10 text-blue-300' : 'border-border text-muted hover:text-foreground'}`}
                            >
                                Sem streaming
                            </button>
                            <button
                                type="button"
                                onClick={() => setOverrideFilter(overrideFilter === 'manual' ? 'all' : 'manual')}
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${overrideFilter === 'manual' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-border text-muted hover:text-foreground'}`}
                            >
                                Só overrides manuais
                            </button>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted">
                            <ListFilter size={13} />
                            <span>{filteredArtists.length} visíveis</span>
                            <select
                                value={sortKey}
                                onChange={(event) => setSortKey(event.target.value as SortKey)}
                                className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
                            >
                                <option value="rank">Ordenar por ranking</option>
                                <option value="score">Ordenar por score</option>
                                <option value="delta">Ordenar por movimento</option>
                                <option value="views">Ordenar por views</option>
                                <option value="favorites">Ordenar por favoritos</option>
                                <option value="signals">Ordenar por sinais de streaming</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                        <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Visíveis agora</p>
                            <p className="mt-1 text-2xl font-black text-foreground">{filteredArtists.length}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Com streaming</p>
                            <p className="mt-1 text-2xl font-black text-foreground">{visibleStats.withSignals}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Subindo</p>
                            <p className="mt-1 text-2xl font-black text-foreground">{visibleStats.rising}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Overrides manuais</p>
                            <p className="mt-1 text-2xl font-black text-foreground">{visibleStats.manual}</p>
                        </div>
                    </div>
                </div>

                {/* Tabela */}
                {isLoading ? (
                    <AdminTableSkeleton rows={20} />
                ) : artists.length === 0 ? (
                    <AdminEmptyState
                        icon={<TrendingUp size={24} />}
                        title="Nenhum artista rankeado"
                        description="Execute o cron de update-trending para gerar os ranks."
                    />
                ) : filteredArtists.length === 0 ? (
                    <AdminEmptyState
                        icon={<Search size={24} />}
                        title="Nenhum artista encontrado"
                        description="Ajuste os filtros ou limpe a busca para ver mais artistas do ranking."
                        action={(
                            <AdminButton variant="secondary" size="sm" onClick={resetFilters}>
                                Limpar filtros
                            </AdminButton>
                        )}
                    />
                ) : (
                    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-background">
                                    <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted w-12">#</th>
                                    <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted">Artista</th>
                                    <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted hidden md:table-cell">Score</th>
                                    <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted hidden lg:table-cell">Views · Favs</th>
                                    <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted hidden lg:table-cell">Streaming</th>
                                    <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted">Badge</th>
                                    <th className="text-right px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted">Controle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredArtists.map((artist) => {
                                    const delta = artist.trendingRankPrev != null && artist.trendingRank != null
                                        ? artist.trendingRankPrev - artist.trendingRank
                                        : null
                                    const badgeDisplay = getArtistBadgeDisplay(artist)
                                    const hasSignal = (artist.streamingSignals?.length ?? 0) > 0
                                    const isExpanded = expandedArtistId === artist.id

                                    return (
                                        <Fragment key={artist.id}>
                                        <tr className="border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors">
                                            {/* Rank + delta */}
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <span className="text-sm font-black text-foreground">{artist.trendingRank ?? '—'}</span>
                                                    {delta !== null && delta !== 0 && (
                                                        <span className={`text-[9px] font-bold flex items-center gap-0.5 ${delta > 0 ? 'text-green-500' : 'text-red-400'}`}>
                                                            {delta > 0 ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
                                                            {Math.abs(delta)}
                                                        </span>
                                                    )}
                                                    {delta === 0 && (
                                                        <span className="text-[9px] text-muted"><Minus size={8} /></span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Artista */}
                                            <td className="px-4 py-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-bold text-foreground text-[13px] leading-tight">
                                                            {artist.nameRomanized}
                                                        </p>
                                                        {artist.trendingRank === 1 && (
                                                            <AdminBadge variant="warning" shape="pill">
                                                                <Crown size={10} />
                                                                Top 1
                                                            </AdminBadge>
                                                        )}
                                                        {artist.trendingBadgeOverride && (
                                                            <AdminBadge variant="accent" shape="pill">Manual</AdminBadge>
                                                        )}
                                                    </div>
                                                    {artist.nameHangul && (
                                                        <p className="text-[10px] text-muted">{artist.nameHangul}</p>
                                                    )}
                                                    <div className="flex items-center gap-3 text-[11px] text-muted">
                                                        <Link href={`/artists/${artist.id}`} target="_blank" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                                                            <ExternalLink size={11} />
                                                            Perfil público
                                                        </Link>
                                                        <Link href={`/admin/artists/${artist.id}`} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                                                            <Star size={11} />
                                                            Editar artista
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Score */}
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className="text-foreground font-mono text-xs">
                                                    {artist.trendingScore.toFixed(1)}
                                                </span>
                                            </td>

                                            {/* Views · Favs */}
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <span className="text-xs text-muted">
                                                    {artist.viewCount.toLocaleString('pt-BR')} · {artist.favoriteCount.toLocaleString('pt-BR')}
                                                </span>
                                            </td>

                                            {/* Streaming */}
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                {hasSignal ? (
                                                    <div className="space-y-1">
                                                    <AdminBadge variant="info">
                                                        <Tv size={10} />
                                                        {getSignalSourceLabel(artist.streamingSignals![0].source)} T{artist.streamingSignals![0].rank}
                                                    </AdminBadge>
                                                    <p className="text-[10px] text-muted truncate max-w-[220px]">{artist.streamingSignals![0].showTitle}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-muted">—</span>
                                                )}
                                            </td>

                                            {/* Badge automático */}
                                            <td className="px-4 py-3">
                                                {badgeDisplay ? (
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeDisplay.className}`}>
                                                        {artist.trendingBadgeOverride ? '★ ' : ''}{badgeDisplay.label}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-muted">—</span>
                                                )}
                                            </td>

                                            {/* Override */}
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <select
                                                        value={artist.trendingBadgeOverride ?? ''}
                                                        onChange={(event) => setOverride(artist.id, event.target.value || null)}
                                                        disabled={savingId === artist.id}
                                                        className="min-w-[136px] rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-accent/40 disabled:opacity-50"
                                                    >
                                                        {OVERRIDE_OPTIONS.map((option) => (
                                                            <option key={option.value} value={option.value}>{option.label}</option>
                                                        ))}
                                                    </select>
                                                    <AdminIconButton
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => setExpandedArtistId((current) => current === artist.id ? null : artist.id)}
                                                        title={isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                                                    >
                                                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                    </AdminIconButton>
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="border-b border-border bg-background/60">
                                                <td colSpan={7} className="px-4 py-4">
                                                    <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr_1fr]">
                                                        <div className="rounded-xl border border-border bg-surface px-4 py-3">
                                                            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Leitura do ranking</p>
                                                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                                                <div>
                                                                    <p className="text-muted">Ranking atual</p>
                                                                    <p className="font-bold text-foreground">#{artist.trendingRank ?? '—'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-muted">Ranking anterior</p>
                                                                    <p className="font-bold text-foreground">#{artist.trendingRankPrev ?? '—'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-muted">Movimento</p>
                                                                    <p className="font-bold text-foreground">{delta === null ? 'Sem histórico' : delta > 0 ? `+${delta}` : `${delta}`}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-muted">Favoritos</p>
                                                                    <p className="font-bold text-foreground">{artist.favoriteCount.toLocaleString('pt-BR')}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="rounded-xl border border-border bg-surface px-4 py-3">
                                                            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Badge efetivo</p>
                                                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                                                                {badgeDisplay ? (
                                                                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${badgeDisplay.className}`}>
                                                                        {artist.trendingBadgeOverride ? '★ ' : ''}{badgeDisplay.label}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-sm text-muted">Sem badge ativa</span>
                                                                )}
                                                            </div>
                                                            <p className="mt-3 text-xs text-muted">
                                                                {artist.trendingBadgeOverride
                                                                    ? 'Override manual ativo. O cálculo automático está sendo ignorado para este artista.'
                                                                    : 'Sem override manual. O badge segue o cálculo automático do ranking.'}
                                                            </p>
                                                        </div>

                                                        <div className="rounded-xl border border-border bg-surface px-4 py-3">
                                                            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Sinais de streaming</p>
                                                            <div className="mt-3 space-y-2">
                                                                {(artist.streamingSignals?.length ?? 0) > 0 ? artist.streamingSignals!.map((signal, index) => (
                                                                    <div key={`${signal.source}-${signal.rank}-${index}`} className="rounded-lg border border-border bg-background px-3 py-2">
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <span className="text-xs font-semibold text-foreground">{getSignalSourceLabel(signal.source)}</span>
                                                                            <AdminBadge variant="info" shape="pill">Top {signal.rank}</AdminBadge>
                                                                        </div>
                                                                        <p className="mt-1 text-xs text-muted">{signal.showTitle}</p>
                                                                    </div>
                                                                )) : (
                                                                    <p className="text-sm text-muted">Sem sinais ativos no momento.</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        </Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
