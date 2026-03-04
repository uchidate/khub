'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { ArrowRight, Users, Music2, Film, Newspaper, TrendingUp } from 'lucide-react'

interface SiteStats {
    artists: number
    productions: number
    news: number
    views: number
}

interface HeroSectionProps {
    stats: SiteStats
}

const ROTATING_CTAS = [
    { href: '/artists',     label: 'Explorar Artistas', icon: Users },
    { href: '/productions', label: 'Ver K-Dramas',      icon: Film },
    { href: '/groups',      label: 'Descobrir Grupos',   icon: Music2 },
    { href: '/news',        label: 'Últimas Notícias',   icon: Newspaper },
]

export function HeroSection({ stats }: HeroSectionProps) {
    const [ctaIndex, setCtaIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCtaIndex(i => (i + 1) % ROTATING_CTAS.length)
        }, 3000)
        return () => clearInterval(timer)
    }, [])

    const currentCta = ROTATING_CTAS[ctaIndex]

    return (
        <section className="relative w-full overflow-hidden pt-24 pb-8 md:pt-28 md:pb-10">

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

            <div className="relative z-30 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12">
                <div className="max-w-2xl">

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

                        <p className="text-sm text-zinc-400 mb-3 max-w-sm leading-relaxed">
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
                                <a
                                    key={label}
                                    href={href}
                                    className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors group"
                                >
                                    <Icon className="w-3 h-3 group-hover:text-neon-pink transition-colors" />
                                    <span className="text-xs font-black text-white tabular-nums">
                                        {value.toLocaleString('pt-BR')}
                                    </span>
                                    <span className="text-[11px] text-zinc-600">{label}</span>
                                </a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Rotating CTA + dots */}
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
            </div>

        </section>
    )
}
