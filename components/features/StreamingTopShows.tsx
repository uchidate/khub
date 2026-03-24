'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Tv2, ChevronRight } from 'lucide-react'
import {
    STREAMING_TAB_ORDER,
    getStreamingConfig,
} from '@/lib/config/streaming-platforms'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface StreamingShow {
    rank: number
    showTitle: string
    productionTitle?: string   // titlePt da produção no DB (quando existir)
    tmdbId: string
    source: string
    productionId?: string
    posterUrl?: string | null
    year?: number | null
    voteAverage?: number | null
    isKorean?: boolean
}

export type ShowsByPlatform = Record<string, StreamingShow[]>

interface StreamingTopShowsProps {
    showsByPlatform: ShowsByPlatform
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function StreamingTopShows({ showsByPlatform }: StreamingTopShowsProps) {
    const availablePlatforms = STREAMING_TAB_ORDER.filter(
        p => (showsByPlatform[p]?.length ?? 0) > 0
    )

    const [activeTab, setActiveTab] = useState<string>(availablePlatforms[0] ?? '')
    const [featuredIndex, setFeaturedIndex] = useState(0)

    const activeShows = showsByPlatform[activeTab] ?? []
    const totalShows = Math.min(activeShows.length, 10)

    useEffect(() => {
        if (totalShows === 0) return
        setFeaturedIndex(0)
        const timer = setInterval(() => {
            setFeaturedIndex(i => (i + 1) % totalShows)
        }, 2500)
        return () => clearInterval(timer)
    }, [totalShows, activeTab])

    if (availablePlatforms.length === 0) return null

    return (
        <section>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-surface border border-border rounded-xl">
                        <Tv2 className="w-5 h-5 text-foreground" />
                    </div>
                    <h2 className="text-xl font-black text-foreground tracking-tight uppercase">
                        Top 10 nos{' '}
                        <span className="text-accent">Streamings</span>
                    </h2>
                </div>
                <Link
                    href="/productions"
                    className="hidden md:flex items-center gap-1 text-sm font-bold text-muted hover:text-foreground transition-colors"
                >
                    Ver produções <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Pills de plataforma */}
            <div className="flex gap-2 mb-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {availablePlatforms.map(platform => {
                    const cfg = getStreamingConfig(platform)
                    const isActive = platform === activeTab
                    return (
                        <button
                            key={platform}
                            onClick={() => setActiveTab(platform)}
                            className={`
                                flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border
                                ${isActive
                                    ? 'bg-foreground text-background border-foreground shadow-sm'
                                    : 'bg-surface text-muted border-border hover:border-foreground/30 hover:text-foreground'
                                }
                            `}
                        >
                            {cfg.label}
                        </button>
                    )
                })}
            </div>

            {/* Grid de shows */}
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-2.5">
                {activeShows.slice(0, 10).map((show, index) => {
                    const cfg = getStreamingConfig(show.source)
                    const card = (
                        <div className={`
                            group relative aspect-[2/3] rounded-xl overflow-hidden bg-surface
                            border border-border ${cfg.hoverBorderColor} transition-all duration-300
                        `}>
                            {show.posterUrl ? (
                                <Image
                                    src={show.posterUrl}
                                    alt={show.showTitle}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    sizes="(max-width: 768px) 20vw, 10vw"
                                />
                            ) : (
                                <div className="w-full h-full bg-surface-hover flex items-center justify-center">
                                    <span className="text-muted text-xl font-black">
                                        {show.showTitle[0]}
                                    </span>
                                </div>
                            )}

                            {/* Gradiente sobre o poster */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                            {/* Rank */}
                            <div className="absolute top-1 left-1.5 z-10">
                                <span className="text-2xl md:text-4xl font-black text-white/90 leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                    {show.rank}
                                </span>
                            </div>

                            {/* Nota TMDB */}
                            {show.voteAverage != null && show.voteAverage > 0 && (
                                <div className="absolute top-1 right-1 z-10 px-1 py-0.5 rounded bg-black/60 text-[10px] font-bold text-yellow-400 leading-none">
                                    ★ {show.voteAverage.toFixed(1)}
                                </div>
                            )}

                            {/* Badge plataforma */}
                            <div className={`absolute bottom-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded text-[10px] font-black ${cfg.bgColor} ${cfg.textColor}`}>
                                {cfg.label}
                            </div>
                        </div>
                    )

                    return (
                        <div key={`${show.source}-${show.tmdbId}`} className="relative">
                            {show.productionId ? (
                                <Link href={`/productions/${show.productionId}`} className="block group">
                                    {card}
                                    <p className="mt-1.5 text-[10px] md:text-xs text-foreground font-semibold line-clamp-2 leading-tight group-hover:text-accent transition-colors">
                                        {show.productionTitle ?? show.showTitle}
                                    </p>
                                </Link>
                            ) : (
                                <>
                                    {card}
                                    <p className="mt-1.5 text-[10px] md:text-xs text-muted font-semibold line-clamp-2 leading-tight">
                                        {show.showTitle}
                                    </p>
                                </>
                            )}
                        </div>
                    )
                })}
            </div>
        </section>
    )
}
