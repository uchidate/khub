'use client'

import { useState } from 'react'
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
    // Plataformas com dados, na ordem definida
    const availablePlatforms = STREAMING_TAB_ORDER.filter(
        p => (showsByPlatform[p]?.length ?? 0) > 0
    )

    const [activeTab, setActiveTab] = useState<string>(availablePlatforms[0] ?? '')

    if (availablePlatforms.length === 0) return null

    const activeShows = showsByPlatform[activeTab] ?? []
    const activeCfg = getStreamingConfig(activeTab)

    return (
        <section className="py-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-xl">
                        <Tv2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black dark:text-white text-zinc-900 tracking-tight">
                            Top 10 nos <span className={`${activeCfg.textColor}`} style={{ color: 'inherit' }}>
                                <span className={`${activeTab === 'netflix_br' ? 'text-red-500' : activeTab === 'disney_br' ? 'text-blue-400' : activeTab === 'prime_br' ? 'text-sky-400' : activeTab === 'apple_br' ? 'text-zinc-300' : 'text-purple-400'}`}>
                                    Streamings
                                </span>
                            </span>
                        </h2>
                        <p className="dark:text-zinc-500 text-zinc-600 text-xs mt-0.5">
                            K-dramas em destaque por plataforma
                        </p>
                    </div>
                </div>
                <Link
                    href="/productions"
                    className="hidden md:flex items-center gap-1 text-sm font-bold dark:text-zinc-400 text-zinc-500 dark:hover:text-white hover:text-zinc-900 transition-colors"
                >
                    Ver produções <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Pills de plataforma */}
            <div className="flex gap-2 mb-5 flex-wrap">
                {availablePlatforms.map(platform => {
                    const cfg = getStreamingConfig(platform)
                    const isActive = platform === activeTab
                    return (
                        <button
                            key={platform}
                            onClick={() => setActiveTab(platform)}
                            className={`
                                px-4 py-1.5 rounded-full text-xs font-bold transition-all
                                ${isActive
                                    ? 'bg-white text-black shadow-md'
                                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
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
                {activeShows.slice(0, 10).map(show => {
                    const cfg = getStreamingConfig(show.source)
                    const card = (
                        <div className={`
                            group relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900
                            border border-zinc-800 ${cfg.hoverBorderColor} transition-all duration-300
                        `}>
                            {/* Poster TMDB */}
                            {show.posterUrl ? (
                                <Image
                                    src={show.posterUrl}
                                    alt={show.showTitle}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    sizes="(max-width: 768px) 20vw, 10vw"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                                    <span className="text-zinc-500 text-xl font-black">
                                        {show.showTitle[0]}
                                    </span>
                                </div>
                            )}

                            {/* Gradiente */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                            {/* Rank — estilo Netflix (número grande) */}
                            <div className="absolute top-1 left-1.5 z-10">
                                <span className="text-3xl md:text-4xl font-black text-white/90 leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                    {show.rank}
                                </span>
                            </div>

                            {/* Badge K-Drama (canto superior direito) */}
                            {show.isKorean && (
                                <div className="absolute top-1.5 right-1.5 z-10 px-1 py-0.5 rounded bg-purple-600/90 text-[7px] font-black text-white leading-none">
                                    K
                                </div>
                            )}

                            {/* Nota TMDB (canto inferior direito) */}
                            {show.voteAverage != null && show.voteAverage > 0 && (
                                <div className="absolute bottom-1.5 right-1.5 z-10 px-1 py-0.5 rounded bg-black/70 text-[8px] font-bold text-yellow-400 leading-none">
                                    ★ {show.voteAverage.toFixed(1)}
                                </div>
                            )}

                            {/* Badge plataforma */}
                            <div className={`absolute bottom-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded text-[8px] font-black ${cfg.bgColor} ${cfg.textColor}`}>
                                {cfg.label}
                            </div>
                        </div>
                    )

                    return (
                        <div key={`${show.source}-${show.tmdbId}`} className="block">
                            {show.productionId ? (
                                <Link href={`/productions/${show.productionId}`} className="block">
                                    {card}
                                    <p className="mt-1.5 text-[10px] md:text-xs text-white font-semibold line-clamp-2 leading-tight group-hover:text-purple-400 transition-colors">
                                        {show.showTitle}
                                    </p>
                                    {show.year && (
                                        <p className="text-[9px] text-zinc-500 leading-none mt-0.5">{show.year}</p>
                                    )}
                                </Link>
                            ) : (
                                <>
                                    {card}
                                    <p className="mt-1.5 text-[10px] md:text-xs text-zinc-400 font-semibold line-clamp-2 leading-tight">
                                        {show.showTitle}
                                    </p>
                                    {show.year && (
                                        <p className="text-[9px] text-zinc-500 leading-none mt-0.5">{show.year}</p>
                                    )}
                                </>
                            )}
                        </div>
                    )
                })}
            </div>
        </section>
    )
}
