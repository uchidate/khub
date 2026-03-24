'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
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
        <div>
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-border">
                <span className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted">Top 10 nos Streamings</span>
                <div className="flex items-center gap-1">
                    {availablePlatforms.map(platform => {
                        const cfg = getStreamingConfig(platform)
                        const isActive = platform === activeTab
                        return (
                            <button
                                key={platform}
                                onClick={() => setActiveTab(platform)}
                                className="flex-shrink-0 flex items-center gap-1 px-2 py-[3px] rounded-full text-[10px] font-semibold transition-all"
                                style={isActive
                                    ? { color: cfg.hex, backgroundColor: `${cfg.hex}18` }
                                    : undefined
                                }
                            >
                                <span
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: cfg.hex }}
                                />
                                <span className={isActive ? '' : 'text-foreground/60'}>{cfg.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Grid 5×2 */}
            <div className="grid grid-cols-5 px-4 sm:px-6 py-3 gap-2">
                {activeShows.slice(0, 10).map((show) => {
                    const title = show.productionTitle ?? show.showTitle
                    const inner = (
                        <div className="group flex flex-col items-center gap-1 max-w-[72px] mx-auto w-full">
                            <div className="relative w-full aspect-[2/3] rounded overflow-hidden bg-surface border border-border/60">
                                {show.posterUrl ? (
                                    <Image src={show.posterUrl} alt={title} fill className="object-cover" sizes="10vw" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-muted">{title[0]}</div>
                                )}
                                <span className="absolute top-1 left-1 text-[8px] font-bold leading-none bg-black/60 text-white rounded px-1 py-0.5">
                                    {show.rank}
                                </span>
                            </div>
                            <p className="text-[9px] font-semibold text-foreground group-hover:text-accent transition-colors text-center line-clamp-2 leading-tight w-full">
                                {title}
                            </p>
                        </div>
                    )

                    return (
                        <div key={`${show.source}-${show.tmdbId}`}>
                            {show.productionId ? (
                                <Link href={`/productions/${show.productionId}`}>{inner}</Link>
                            ) : inner}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
