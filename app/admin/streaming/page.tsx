'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminEmptyState } from '@/components/admin'
import { useToast } from '@/lib/hooks/useToast'
import { STREAMING_CONFIG, STREAMING_TAB_ORDER, getStreamingConfig } from '@/lib/config/streaming-platforms'
import { Tv, RefreshCw, Trash2, Loader2, ExternalLink, Star, Clock, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface StreamingShow {
    id: string
    source: string
    rank: number
    showTitle: string
    tmdbId: number | null
    posterUrl: string | null
    year: number | null
    voteAverage: number | null
    isKorean: boolean
    fetchedAt: string
    expiresAt: string | null
    production: { id: string; titlePt: string } | null
}

interface ApiResponse {
    data: StreamingShow[]
    total: number
    pages: number
}

export default function StreamingAdminPage() {
    const { addToast } = useToast()
    const [activeSource, setActiveSource] = useState(STREAMING_TAB_ORDER[0])
    const [shows,        setShows]        = useState<StreamingShow[]>([])
    const [total,        setTotal]        = useState(0)
    const [loading,      setLoading]      = useState(true)
    const [refreshing,   setRefreshing]   = useState(false)
    const [deletingId,   setDeletingId]   = useState<string | null>(null)

    const load = useCallback(async (source: string) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/streaming?source=${source}&limit=50`)
            if (!res.ok) throw new Error()
            const data: ApiResponse = await res.json()
            setShows(data.data)
            setTotal(data.total)
        } catch {
            addToast({ type: 'error', message: 'Erro ao carregar shows' })
        } finally {
            setLoading(false)
        }
    }, [addToast])

    useEffect(() => { load(activeSource) }, [activeSource, load])

    async function handleRefresh() {
        if (refreshing) return
        setRefreshing(true)
        try {
            const res = await fetch('/api/admin/streaming', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'refresh' }),
            })
            if (!res.ok) throw new Error()
            addToast({ type: 'success', message: 'Atualização iniciada — dados disponíveis em instantes' })
            setTimeout(() => load(activeSource), 3000)
        } catch {
            addToast({ type: 'error', message: 'Erro ao iniciar atualização' })
        } finally {
            setRefreshing(false)
        }
    }

    async function handleDelete(id: string, title: string) {
        if (deletingId || !window.confirm(`Remover "${title}" da lista?`)) return
        setDeletingId(id)
        try {
            const res = await fetch(`/api/admin/streaming?id=${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error()
            addToast({ type: 'success', message: 'Show removido' })
            setShows(prev => prev.filter(s => s.id !== id))
            setTotal(t => t - 1)
        } catch {
            addToast({ type: 'error', message: 'Erro ao remover' })
        } finally {
            setDeletingId(null)
        }
    }

    const allSources = Object.entries(STREAMING_CONFIG)
        .filter(([key]) => STREAMING_TAB_ORDER.includes(key))
        .sort(([a], [b]) => STREAMING_TAB_ORDER.indexOf(a) - STREAMING_TAB_ORDER.indexOf(b))

    const now = new Date()
    const expiredCount = shows.filter(s => s.expiresAt && new Date(s.expiresAt) < now).length

    return (
        <AdminLayout
            title="Streaming Shows"
            subtitle="Rankings de shows populares por plataforma"
            actions={
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-all"
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'Atualizando…' : 'Atualizar agora'}
                </button>
            }
        >
            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 mb-6 p-4 rounded-xl bg-surface border border-border">
                <div>
                    <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">Mostrando</p>
                    <p className="text-2xl font-black text-foreground">{total}</p>
                </div>
                {expiredCount > 0 && (
                    <>
                        <div className="w-px h-8 bg-border" />
                        <div className="flex items-center gap-2 text-amber-500">
                            <AlertTriangle size={14} />
                            <span className="text-sm font-semibold">{expiredCount} expirado{expiredCount !== 1 ? 's' : ''}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Platform tabs */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                {allSources.map(([key, config]) => {
                    const active = activeSource === key
                    return (
                        <button
                            key={key}
                            onClick={() => setActiveSource(key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                                active
                                    ? 'bg-surface border-2 border-foreground/20 text-foreground'
                                    : 'bg-surface border border-border text-muted hover:text-foreground hover:border-foreground/20'
                            }`}
                        >
                            <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: config.hex }}
                            />
                            {config.label}
                        </button>
                    )
                })}
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-muted" />
                </div>
            ) : shows.length === 0 ? (
                <AdminEmptyState
                    icon={<Tv className="w-8 h-8 text-muted" />}
                    title="Nenhum show encontrado"
                    description="Clique em 'Atualizar agora' para buscar os rankings mais recentes."
                    bordered
                />
            ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-surface border-b border-border">
                            <tr>
                                <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted w-12">#</th>
                                <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted">Show</th>
                                <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted hidden md:table-cell">Produção</th>
                                <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted hidden lg:table-cell">Atualizado</th>
                                <th className="w-16" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {shows.map(show => {
                                const expired = show.expiresAt && new Date(show.expiresAt) < now
                                return (
                                    <tr key={show.id} className={`hover:bg-surface/50 transition-colors ${expired ? 'opacity-60' : ''}`}>
                                        <td className="px-4 py-3 text-muted font-mono text-xs">{show.rank}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {show.posterUrl ? (
                                                    <div className="w-8 h-12 rounded overflow-hidden bg-surface shrink-0">
                                                        <Image src={show.posterUrl} alt={show.showTitle} width={32} height={48} className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-12 rounded bg-surface border border-border shrink-0 flex items-center justify-center">
                                                        <Tv size={12} className="text-muted" />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-foreground truncate">{show.showTitle}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {show.year && <span className="text-[11px] text-muted">{show.year}</span>}
                                                        {show.voteAverage && (
                                                            <span className="flex items-center gap-0.5 text-[11px] text-amber-500">
                                                                <Star size={10} fill="currentColor" />
                                                                {show.voteAverage.toFixed(1)}
                                                            </span>
                                                        )}
                                                        {show.isKorean && (
                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent/10 text-accent">K</span>
                                                        )}
                                                        {expired && (
                                                            <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                                                                <Clock size={9} />
                                                                expirado
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            {show.production ? (
                                                <Link
                                                    href={`/admin/productions/${show.production.id}`}
                                                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                                >
                                                    {show.production.titlePt}
                                                    <ExternalLink size={10} />
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-muted">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted hidden lg:table-cell">
                                            {new Date(show.fetchedAt).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDelete(show.id, show.showTitle)}
                                                disabled={deletingId === show.id}
                                                className="p-1.5 text-muted hover:text-red-400 transition-colors rounded"
                                                title="Remover"
                                            >
                                                {deletingId === show.id
                                                    ? <Loader2 size={13} className="animate-spin" />
                                                    : <Trash2 size={13} />
                                                }
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </AdminLayout>
    )
}
