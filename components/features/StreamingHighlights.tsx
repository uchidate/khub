'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Tv2 } from 'lucide-react'
import { STREAMING_TAB_ORDER, getStreamingConfig } from '@/lib/config/streaming-platforms'
import type { ShowsByPlatform, StreamingShow } from '@/components/features/StreamingTopShows'

interface StreamingHighlightsProps {
    showsByPlatform: ShowsByPlatform
}

export function StreamingHighlights({ showsByPlatform }: StreamingHighlightsProps) {
    const availablePlatforms = STREAMING_TAB_ORDER.filter(
        p => (showsByPlatform[p]?.length ?? 0) > 0
    )
    const [activeTab, setActiveTab] = useState(availablePlatforms[0] ?? '')

    if (availablePlatforms.length === 0) return null

    const shows = showsByPlatform[activeTab] ?? []
    const featured = shows[0]
    const rest = shows.slice(1, 10)
    const cfg = getStreamingConfig(activeTab)

    return (
        <section className="mb-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-800 rounded-xl">
                        <Tv2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black dark:text-white text-zinc-900 tracking-tight">
                            Top 10 nos Streamings
                        </h2>
                        <p className="text-zinc-500 text-xs">K-dramas em destaque por plataforma</p>
                    </div>
                </div>
            </div>

            {/* Platform tabs */}
            <div className="flex gap-2 mb-5 flex-wrap">
                {availablePlatforms.map(platform => {
                    const c = getStreamingConfig(platform)
                    const isActive = platform === activeTab
                    return (
                        <button
                            key={platform}
                            onClick={() => setActiveTab(platform)}
                            className={`
                                px-4 py-1.5 rounded-full text-xs font-bold transition-all border
                                ${isActive
                                    ? `${c.bgColor} text-white border-transparent shadow-lg scale-105`
                                    : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white'
                                }
                            `}
                        >
                            {c.label}
                        </button>
                    )
                })}
            </div>

            {/* Animated content area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="relative rounded-2xl overflow-hidden"
                >
                    {/* Blurred ambient background from #1 poster */}
                    {featured?.posterUrl && (
                        <div className="absolute inset-0 z-0 overflow-hidden">
                            <Image
                                src={featured.posterUrl}
                                alt=""
                                fill
                                className="object-cover scale-110 blur-3xl opacity-20 saturate-150"
                                sizes="100vw"
                                aria-hidden
                            />
                            <div className="absolute inset-0 bg-zinc-950/70" />
                        </div>
                    )}
                    {!featured?.posterUrl && (
                        <div className="absolute inset-0 z-0 bg-zinc-900" />
                    )}

                    {/* Content grid */}
                    <div className="relative z-10 p-4 md:p-6 flex flex-col md:flex-row gap-5 md:gap-6">

                        {/* Featured #1 */}
                        {featured && (
                            <FeaturedCard show={featured} cfg={cfg} />
                        )}

                        {/* #2–10 scrollable strip */}
                        {rest.length > 0 && (
                            <div className="flex flex-col flex-1 min-w-0 gap-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                    Também em destaque
                                </p>
                                <div className="flex gap-3 overflow-x-auto pb-1"
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                    {rest.map(show => (
                                        <SmallCard key={`${show.source}-${show.tmdbId}`} show={show} cfg={cfg} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </section>
    )
}

// ─── Featured card: the #1 show ──────────────────────────────────────────────

function FeaturedCard({ show, cfg }: { show: StreamingShow; cfg: ReturnType<typeof getStreamingConfig> }) {
    const inner = (
        <div className="group relative w-full md:w-48 lg:w-56 flex-shrink-0">
            {/* Poster */}
            <div className={`
                relative aspect-[2/3] rounded-xl overflow-hidden
                border-2 ${cfg.borderColor}
                shadow-2xl ring-1 ring-white/5
                group-hover:scale-[1.02] transition-transform duration-300
            `}>
                {show.posterUrl ? (
                    <Image
                        src={show.posterUrl}
                        alt={show.showTitle}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 224px"
                        priority
                    />
                ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-white text-4xl font-black">
                        {show.showTitle[0]}
                    </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                {/* Rank #1 — large */}
                <div className="absolute top-2 left-3 z-10">
                    <span className="text-6xl font-black text-white leading-none drop-shadow-[0_3px_8px_rgba(0,0,0,1)]">
                        1
                    </span>
                </div>

                {/* Rating */}
                {show.voteAverage != null && show.voteAverage > 0 && (
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 px-1.5 py-0.5 bg-black/70 rounded-md">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold text-white">{show.voteAverage.toFixed(1)}</span>
                    </div>
                )}

                {/* Platform badge */}
                <div className={`absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-black ${cfg.bgColor} ${cfg.textColor}`}>
                    #{1} {cfg.label}
                </div>
            </div>

            {/* Title below */}
            <div className="mt-2 px-0.5">
                <p className="font-bold text-white text-sm line-clamp-2 leading-tight group-hover:text-purple-400 transition-colors">
                    {show.showTitle}
                </p>
                {show.year && (
                    <p className="text-xs text-zinc-500 mt-0.5">{show.year}</p>
                )}
                {show.productionId && (
                    <p className="text-[10px] text-purple-400 mt-1 font-bold">
                        Ver no HallyuHub →
                    </p>
                )}
            </div>
        </div>
    )

    return show.productionId
        ? <Link href={`/productions/${show.productionId}`}>{inner}</Link>
        : inner
}

// ─── Small card: shows #2–10 ─────────────────────────────────────────────────

function SmallCard({ show, cfg }: { show: StreamingShow; cfg: ReturnType<typeof getStreamingConfig> }) {
    const inner = (
        <div className="group flex-shrink-0 w-[72px] md:w-[80px]">
            <div className={`
                relative aspect-[2/3] rounded-lg overflow-hidden
                border border-zinc-700/60 ${cfg.hoverBorderColor}
                transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl
            `}>
                {show.posterUrl ? (
                    <Image
                        src={show.posterUrl}
                        alt={show.showTitle}
                        fill
                        className="object-cover"
                        sizes="80px"
                    />
                ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-white text-xs font-bold text-center p-1">
                        {show.showTitle}
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Rank */}
                <div className="absolute top-1 left-1.5">
                    <span className="text-2xl font-black text-white/90 leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        {show.rank}
                    </span>
                </div>

                {/* Rating */}
                {show.voteAverage != null && show.voteAverage > 0 && (
                    <div className="absolute top-1 right-1 px-1 py-0.5 bg-black/70 rounded text-[7px] font-bold text-yellow-400 leading-none">
                        ★ {show.voteAverage.toFixed(1)}
                    </div>
                )}
            </div>

            {/* Title */}
            <p className={`mt-1 text-[9px] md:text-[10px] font-medium line-clamp-2 leading-tight transition-colors ${
                show.productionId
                    ? 'text-zinc-300 group-hover:text-purple-400'
                    : 'text-zinc-500'
            }`}>
                {show.showTitle}
            </p>
        </div>
    )

    return show.productionId
        ? <Link href={`/productions/${show.productionId}`}>{inner}</Link>
        : inner
}
