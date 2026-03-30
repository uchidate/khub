'use client'

import { useState, useCallback, useEffect } from 'react'
import { TrendingUp, Flame, ArrowUp, ArrowDown, Minus, RefreshCw, Tv, Star, X } from 'lucide-react'
import {
    AdminLayout, AdminButton, AdminIconButton, SectionHeader, StatCard,
    AdminBadge, AdminEmptyState, AdminTableSkeleton,
} from '@/components/admin'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { getArtistBadgeDisplay } from '@/lib/trending/display'
import type { ArtistForBadge } from '@/lib/trending/badges'

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
}

export default function AdminTrendingPage() {
    const toast = useAdminToast()
    const [artists, setArtists] = useState<TrendingArtistRow[]>([])
    const [stats, setStats] = useState<TrendingStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [savingId, setSavingId] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/admin/trending')
            if (!res.ok) throw new Error('Falha ao carregar dados')
            const data = await res.json()
            setArtists(data.artists)
            setStats(data.stats)
        } catch (e) {
            toast.error('Erro ao carregar ranking de trending')
        } finally {
            setIsLoading(false)
        }
    }, [toast])

    useEffect(() => { fetchData() }, [fetchData])

    const triggerRefresh = useCallback(async () => {
        setIsRefreshing(true)
        try {
            const res = await fetch('/api/cron/update-trending', {
                method: 'POST',
                headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ''}` },
            })
            if (!res.ok) throw new Error()
            toast.info('Recálculo iniciado — aguarde ~10s e recarregue')
        } catch {
            toast.error('Erro ao acionar recálculo')
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

    return (
        <AdminLayout
            title="Trending"
            subtitle="Ranking de artistas em alta · controle de badges"
        >
            <div className="space-y-6 p-4 md:p-6">
                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <StatCard label="Artistas rankeados" value={stats.total} icon={<TrendingUp size={14} />} />
                        <StatCard label="Com sinal streaming" value={stats.withSignals} icon={<Tv size={14} />} />
                        <StatCard label="Badge manual ativo" value={stats.withBadgeOverride} icon={<Star size={14} />} />
                        <StatCard label="Score médio" value={`${stats.avgScore.toFixed(1)} pts`} icon={<Flame size={14} />} />
                    </div>
                )}

                {/* Header ações */}
                <SectionHeader
                    title="Top 50 — Artistas em Alta"
                    subtitle="Badge SUBINDO/DESCENDO calculado automaticamente por velocidade de rank"
                    icon={<Flame size={14} />}
                    actions={
                        <AdminButton
                            variant="secondary"
                            size="sm"
                            onClick={triggerRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                            {isRefreshing ? 'Recalculando…' : 'Recalcular agora'}
                        </AdminButton>
                    }
                />

                {/* Tabela */}
                {isLoading ? (
                    <AdminTableSkeleton rows={20} />
                ) : artists.length === 0 ? (
                    <AdminEmptyState
                        icon={<TrendingUp size={24} />}
                        title="Nenhum artista rankeado"
                        description="Execute o cron de update-trending para gerar os ranks."
                    />
                ) : (
                    <div className="bg-surface border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-background">
                                    <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted w-12">#</th>
                                    <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted">Artista</th>
                                    <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted hidden md:table-cell">Score</th>
                                    <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted hidden lg:table-cell">Views · Favs</th>
                                    <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted hidden lg:table-cell">Streaming</th>
                                    <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted">Badge</th>
                                    <th className="text-right px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted">Override</th>
                                </tr>
                            </thead>
                            <tbody>
                                {artists.map((artist) => {
                                    const delta = artist.trendingRankPrev != null && artist.trendingRank != null
                                        ? artist.trendingRankPrev - artist.trendingRank
                                        : null
                                    const badgeDisplay = getArtistBadgeDisplay(artist)
                                    const hasSignal = (artist.streamingSignals?.length ?? 0) > 0

                                    return (
                                        <tr key={artist.id} className="border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors">
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
                                                <p className="font-bold text-foreground text-[13px] leading-tight">
                                                    {artist.nameRomanized}
                                                </p>
                                                {artist.nameHangul && (
                                                    <p className="text-[10px] text-muted">{artist.nameHangul}</p>
                                                )}
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
                                                    <AdminBadge variant="info">
                                                        <Tv size={10} />
                                                        {artist.streamingSignals![0].source.replace('_br', '')} T{artist.streamingSignals![0].rank}
                                                    </AdminBadge>
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
                                                <div className="flex items-center justify-end gap-1">
                                                    {(['HOT', 'SUBINDO', 'NOVO'] as const).map(b => (
                                                        <button
                                                            key={b}
                                                            onClick={() => setOverride(artist.id, artist.trendingBadgeOverride === b ? null : b)}
                                                            disabled={savingId === artist.id}
                                                            className={`text-[8px] font-bold px-1.5 py-0.5 rounded border transition-colors disabled:opacity-50 ${
                                                                artist.trendingBadgeOverride === b
                                                                    ? 'bg-accent text-white border-accent'
                                                                    : 'bg-surface border-border text-muted hover:border-accent hover:text-accent'
                                                            }`}
                                                        >
                                                            {b}
                                                        </button>
                                                    ))}
                                                    {artist.trendingBadgeOverride && (
                                                        <AdminIconButton
                                                            variant="default"
                                                            size="sm"
                                                            onClick={() => setOverride(artist.id, null)}
                                                            disabled={savingId === artist.id}
                                                            title="Remover override"
                                                        >
                                                            <X size={11} />
                                                        </AdminIconButton>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
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
