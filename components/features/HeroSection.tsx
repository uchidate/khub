'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { ArrowRight, Users, Music2, Film, Newspaper, TrendingUp, Flame } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrendingArtist {
    id: string
    nameRomanized: string
    primaryImageUrl: string | null
}

interface LatestNewsItem {
    id: string
    title: string
    imageUrl: string | null
    publishedAt: string
}

interface SiteStats {
    artists: number
    productions: number
    news: number
    views: number
}

interface HeroSectionProps {
    trendingArtists: TrendingArtist[]
    latestNews: LatestNewsItem[]
    stats: SiteStats
}

const ROTATING_CTAS = [
    { href: '/artists',     label: 'Explorar Artistas', icon: Users },
    { href: '/productions', label: 'Ver K-Dramas',      icon: Film },
    { href: '/groups',      label: 'Descobrir Grupos',   icon: Music2 },
    { href: '/news',        label: 'Últimas Notícias',   icon: Newspaper },
]

export function HeroSection({ trendingArtists, latestNews, stats }: HeroSectionProps) {
    const [ctaIndex, setCtaIndex] = useState(0)
    const [newsIndex, setNewsIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => setCtaIndex(i => (i + 1) % ROTATING_CTAS.length), 3000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        if (latestNews.length <= 1) return
        const timer = setInterval(() => setNewsIndex(i => (i + 1) % latestNews.length), 4000)
        return () => clearInterval(timer)
    }, [latestNews.length])

    const currentCta = ROTATING_CTAS[ctaIndex]
    const currentNews = latestNews[newsIndex] ?? null

    return (
        <section className="relative w-full overflow-hidden">

            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black z-10" />
                <Image
                    src="https://images.unsplash.com/photo-1574169208507-84376144848b?q=80&w=2000"
                    alt="Hallyu Wave Background"
                    fill
                    priority
                    className="object-cover opacity-25"
                />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyber-purple/20 blur-[120px] rounded-full z-20" />
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-neon-pink/10 blur-[120px] rounded-full z-20" />
            </div>

            {/* ── Hero content ──────────────────────────────────────────── */}
            <div className="relative z-30 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 pt-24 pb-8 md:pt-28 md:pb-10">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-2xl"
                >
                    <p className="inline-flex items-center gap-1.5 text-neon-pink font-black tracking-widest uppercase text-[10px] mb-4 px-3 py-1 rounded-full border border-neon-pink/30 bg-neon-pink/10">
                        ✦ A plataforma Hallyu do Brasil
                    </p>

                    <h1 className="text-4xl md:text-6xl xl:text-7xl font-display font-black mb-4 tracking-tighter leading-[0.95] italic">
                        A ONDA{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-purple via-neon-pink to-neon-cyan animate-gradient bg-[length:200%_auto]">
                            HALLYU
                        </span>
                        <br />
                        NO SEU RITMO.
                    </h1>

                    <p className="text-sm text-zinc-400 mb-3 leading-relaxed">
                        Artistas, K-Dramas, grupos e notícias da cultura coreana — tudo em um lugar.
                    </p>

                    {/* Stats inline */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-6">
                        {[
                            { icon: Users,      href: '/artists',     label: 'Artistas',  value: stats.artists },
                            { icon: Film,       href: '/productions', label: 'Produções', value: stats.productions },
                            { icon: Newspaper,  href: '/news',        label: 'Notícias',  value: stats.news },
                            { icon: TrendingUp, href: '/artists',     label: 'Views',     value: stats.views },
                        ].map(({ icon: Icon, href, label, value }) => (
                            <a key={label} href={href} className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors group">
                                <Icon className="w-3 h-3 group-hover:text-neon-pink transition-colors" />
                                <span className="text-xs font-black text-white tabular-nums">{value.toLocaleString('pt-BR')}</span>
                                <span className="text-[11px] text-zinc-600">{label}</span>
                            </a>
                        ))}
                    </div>
                </motion.div>

                {/* Rotating CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="flex gap-3 items-center"
                >
                    <div className="h-10 flex items-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={ctaIndex}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25 }}
                            >
                                <Link href={currentCta.href} className="btn-primary flex items-center gap-2 group text-sm">
                                    <currentCta.icon className="w-4 h-4 flex-shrink-0" />
                                    <span>{currentCta.label}</span>
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 flex-shrink-0" />
                                </Link>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <div className="flex gap-1 items-center">
                        {ROTATING_CTAS.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCtaIndex(i)}
                                className={`rounded-full transition-all duration-300 ${
                                    i === ctaIndex ? 'bg-neon-pink w-4 h-1.5' : 'bg-zinc-600 hover:bg-zinc-400 w-1.5 h-1.5'
                                }`}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ── Trending strip — base do hero ─────────────────────────── */}
            {(trendingArtists.length > 0 || currentNews) && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="relative z-30 border-t border-white/8 bg-black/50 backdrop-blur-sm"
                >
                    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 py-3 flex items-center gap-5">

                        {/* Label */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Flame className="w-3.5 h-3.5 text-orange-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 hidden sm:block">
                                Trending
                            </span>
                        </div>

                        {/* Artists */}
                        <div className="flex items-center gap-3 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
                            {trendingArtists.slice(0, 8).map((artist, i) => (
                                <Link
                                    key={artist.id}
                                    href={`/artists/${artist.id}`}
                                    className="flex-shrink-0 flex items-center gap-2 group"
                                >
                                    <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/10 group-hover:border-neon-pink/50 transition-all flex-shrink-0">
                                        {artist.primaryImageUrl ? (
                                            <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill className="object-cover" sizes="28px" />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-white text-[9px] font-black">
                                                {artist.nameRomanized[0]}
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-[11px] font-semibold group-hover:text-white transition-colors hidden sm:block ${i < 3 ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                        {artist.nameRomanized}
                                    </span>
                                </Link>
                            ))}
                        </div>

                        {/* Latest news pill */}
                        {currentNews && (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentNews.id}
                                    initial={{ opacity: 0, x: 6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -6 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex-shrink-0 border-l border-white/10 pl-4 hidden md:block"
                                >
                                    <Link href={`/news/${currentNews.id}`} className="flex items-center gap-2 group max-w-xs">
                                        <span className="text-[9px] text-zinc-600 uppercase tracking-widest flex-shrink-0">📰</span>
                                        <span className="text-[11px] text-zinc-500 group-hover:text-zinc-300 transition-colors line-clamp-1">
                                            {currentNews.title}
                                        </span>
                                    </Link>
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </motion.div>
            )}

        </section>
    )
}
