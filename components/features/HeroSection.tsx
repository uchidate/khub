'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { ArrowRight, Users, Music2, Film, Newspaper } from 'lucide-react'
import { GlobalSearch } from '@/components/ui/GlobalSearch'

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

interface HeroSectionProps {
    trendingArtists: TrendingArtist[]
    latestNews: LatestNewsItem | null
}

// ─── CTAs rotativos ───────────────────────────────────────────────────────────

const ROTATING_CTAS = [
    { href: '/artists',    label: 'Explorar Artistas', icon: Users },
    { href: '/productions',label: 'Ver K-Dramas',      icon: Film },
    { href: '/groups',     label: 'Descobrir Grupos',   icon: Music2 },
    { href: '/news',       label: 'Últimas Notícias',   icon: Newspaper },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function HeroSection({ trendingArtists, latestNews }: HeroSectionProps) {
    const [ctaIndex, setCtaIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCtaIndex(i => (i + 1) % ROTATING_CTAS.length)
        }, 3000)
        return () => clearInterval(timer)
    }, [])

    const currentCta = ROTATING_CTAS[ctaIndex]

    return (
        <section className="relative w-full overflow-hidden pt-24 pb-10 md:pt-28 md:pb-14">

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
                {/* Ambient glow */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyber-purple/20 blur-[120px] rounded-full z-20" />
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-neon-pink/10 blur-[120px] rounded-full z-20" />
            </div>

            <div className="relative z-30 container mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

                    {/* ── Left: headline + search + CTA ─────────────────── */}
                    <div className="flex-1 text-center lg:text-left">

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
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

                            <p className="text-sm text-zinc-400 mb-6 max-w-sm mx-auto lg:mx-0 leading-relaxed">
                                Artistas, K-Dramas, grupos e notícias da cultura coreana — tudo em um lugar.
                            </p>
                        </motion.div>

                        {/* Search */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.15 }}
                            className="flex justify-center lg:justify-start mb-5"
                        >
                            <GlobalSearch />
                        </motion.div>

                        {/* Rotating CTA + dots */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.25 }}
                            className="flex gap-3 justify-center lg:justify-start items-center"
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
                                        <Link
                                            href={currentCta.href}
                                            className="btn-primary flex items-center gap-2 group text-sm"
                                        >
                                            <currentCta.icon className="w-4 h-4 flex-shrink-0" />
                                            <span>{currentCta.label}</span>
                                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 flex-shrink-0" />
                                        </Link>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Dots indicator — clicáveis */}
                            <div className="flex gap-1 items-center">
                                {ROTATING_CTAS.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCtaIndex(i)}
                                        className={`rounded-full transition-all duration-300 ${
                                            i === ctaIndex
                                                ? 'bg-neon-pink w-4 h-1.5'
                                                : 'bg-zinc-600 hover:bg-zinc-400 w-1.5 h-1.5'
                                        }`}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* ── Right: live content ────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-3"
                    >
                        {/* Trending artists card */}
                        {trendingArtists.length > 0 && (
                            <div className="glass-card p-4 rounded-2xl border border-white/10">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neon-pink">
                                        ✦ Trending Agora
                                    </p>
                                    <Link
                                        href="/artists"
                                        className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
                                    >
                                        Ver todos →
                                    </Link>
                                </div>
                                <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                                    {trendingArtists.slice(0, 5).map((artist) => (
                                        <Link
                                            key={artist.id}
                                            href={`/artists/${artist.id}`}
                                            className="group flex-shrink-0 flex flex-col items-center gap-1.5 w-14"
                                        >
                                            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-neon-pink/60 transition-all duration-300">
                                                {artist.primaryImageUrl ? (
                                                    <Image
                                                        src={artist.primaryImageUrl}
                                                        alt={artist.nameRomanized}
                                                        fill
                                                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                        sizes="48px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-white font-black text-sm">
                                                        {artist.nameRomanized[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[9px] text-zinc-400 group-hover:text-white text-center truncate w-full transition-colors font-bold leading-tight">
                                                {artist.nameRomanized}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Latest news snippet */}
                        {latestNews && (
                            <Link
                                href={`/news/${latestNews.id}`}
                                className="glass-card p-3 rounded-2xl border border-white/10 flex gap-3 items-center group hover:border-white/20 transition-all"
                            >
                                {latestNews.imageUrl && (
                                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800">
                                        <Image
                                            src={latestNews.imageUrl}
                                            alt={latestNews.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                                            sizes="56px"
                                        />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                                        📰 Última Notícia
                                    </p>
                                    <p className="text-xs font-bold text-white group-hover:text-neon-cyan transition-colors line-clamp-2 leading-tight">
                                        {latestNews.title}
                                    </p>
                                    <p className="text-[9px] text-zinc-600 mt-1">
                                        {new Date(latestNews.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                    </p>
                                </div>
                            </Link>
                        )}
                    </motion.div>

                </div>
            </div>
        </section>
    )
}
