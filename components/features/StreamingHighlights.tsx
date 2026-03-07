'use client'

import { useState, useEffect } from 'react'
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
    const [featuredIndex, setFeaturedIndex] = useState(0)

    const shows = showsByPlatform[activeTab] ?? []
    const top10 = shows.slice(0, 10)
    const featured = top10[featuredIndex] ?? top10[0]
    const cfg = getStreamingConfig(activeTab)

    useEffect(() => {
        if (top10.length === 0) return
        setFeaturedIndex(0)
        const timer = setInterval(() => {
            setFeaturedIndex(i => (i + 1) % top10.length)
        }, 2500)
        return () => clearInterval(timer)
    }, [top10.length, activeTab])

    if (availablePlatforms.length === 0) return null

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
                        <p className="text-zinc-500 text-xs">Produções em destaque por plataforma</p>
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

            {/* Content area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="relative rounded-2xl overflow-hidden"
                >
                    {/* Blurred ambient background */}
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

                    {/* Cards row — padding vertical extra para acomodar o zoom */}
                    <div className="relative z-10 px-4 md:px-6 pt-10 pb-12">
                        <div
                            className="flex gap-2 md:gap-3 overflow-x-auto items-center"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {top10.map((show, i) => (
                                <ShowCard
                                    key={`${show.source}-${show.tmdbId}`}
                                    show={show}
                                    cfg={cfg}
                                    isFeatured={i === featuredIndex}
                                    onClick={() => setFeaturedIndex(i)}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </section>
    )
}

function ShowCard({
    show,
    cfg,
    isFeatured,
    onClick,
}: {
    show: StreamingShow
    cfg: ReturnType<typeof getStreamingConfig>
    isFeatured: boolean
    onClick: () => void
}) {
    const inner = (
        <motion.div
            className="flex-shrink-0 w-[72px] md:w-20 cursor-pointer"
            animate={{
                scale: isFeatured ? 1.6 : 1,
                zIndex: isFeatured ? 10 : 0,
            }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            style={{ originX: 0.5, originY: 0.5 }}
            onClick={onClick}
        >
            <div className={`
                relative aspect-[2/3] rounded-lg overflow-hidden
                ${isFeatured
                    ? `border-2 ${cfg.borderColor} shadow-2xl ring-1 ring-white/10`
                    : 'border border-zinc-700/50'
                }
            `}>
                {show.posterUrl ? (
                    <Image
                        src={show.posterUrl}
                        alt={show.showTitle}
                        fill
                        className="object-cover"
                        sizes="80px"
                        priority={isFeatured}
                    />
                ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-white font-black text-center p-1 text-xs">
                        {show.showTitle[0]}
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                {/* Rank */}
                <div className="absolute top-1 left-1.5">
                    <span className="text-xl font-black text-white/90 leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        {show.rank}
                    </span>
                </div>

                {/* Rating */}
                {show.voteAverage != null && show.voteAverage > 0 && (
                    <div className="absolute top-1 right-1 px-1 py-0.5 bg-black/70 rounded text-[7px] font-bold text-yellow-400 leading-none flex items-center gap-0.5">
                        <Star className="w-2 h-2 fill-yellow-400" />
                        {show.voteAverage.toFixed(1)}
                    </div>
                )}

                {/* Platform badge (featured only) */}
                {isFeatured && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className={`absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-black ${cfg.bgColor} ${cfg.textColor}`}
                    >
                        #{show.rank} {cfg.label}
                    </motion.div>
                )}
            </div>
        </motion.div>
    )

    return show.productionId && isFeatured
        ? <Link href={`/productions/${show.productionId}`}>{inner}</Link>
        : inner
}
