'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Users, Music2, Film, Newspaper, Building2 } from 'lucide-react'
import { GlobalSearch } from '@/components/ui/GlobalSearch'

const QUICK_LINKS = [
    { href: '/artists', label: 'Artistas', icon: Users, color: 'hover:text-purple-400 hover:border-purple-500/50' },
    { href: '/groups', label: 'Grupos', icon: Music2, color: 'hover:text-pink-400 hover:border-pink-500/50' },
    { href: '/productions', label: 'Produções', icon: Film, color: 'hover:text-cyan-400 hover:border-cyan-500/50' },
    { href: '/news', label: 'Notícias', icon: Newspaper, color: 'hover:text-orange-400 hover:border-orange-500/50' },
    { href: '/agencies', label: 'Agências', icon: Building2, color: 'hover:text-green-400 hover:border-green-500/50' },
]

export function HeroSection() {
    return (
        <section className="relative w-full flex items-center justify-center overflow-hidden pt-28 pb-16 md:pt-36 md:pb-20">
            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black z-10" />
                <motion.div
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                    className="relative w-full h-full"
                >
                    <Image
                        src="https://images.unsplash.com/photo-1574169208507-84376144848b?q=80&w=2000"
                        alt="Hallyu Wave Background"
                        fill
                        priority
                        className="object-cover opacity-60"
                    />
                </motion.div>
            </div>

            {/* Content */}
            <div className="relative z-30 container mx-auto px-4 text-center">
                {/* Headline — fix: neon-cyan (electric-cyan não existe no tailwind) */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-5xl md:text-9xl font-display font-black mb-4 tracking-tighter leading-tight italic"
                >
                    A ONDA{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-purple via-neon-pink to-neon-cyan animate-gradient bg-[length:200%_auto]">
                        HALLYU
                    </span>
                    <br />
                    NO SEU RITMO.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.35 }}
                    className="text-base md:text-xl text-zinc-400 mb-6 max-w-xl mx-auto leading-relaxed"
                >
                    Explore artistas, K-Dramas, grupos e notícias da cultura coreana.
                </motion.p>

                {/* Search bar — acesso imediato à busca global */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.45 }}
                    className="flex justify-center mb-6"
                >
                    <GlobalSearch />
                </motion.div>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.55 }}
                    className="flex flex-row gap-3 justify-center items-center mb-8"
                >
                    <Link href="/artists" className="btn-primary flex items-center gap-2 group">
                        <span>Explorar Artistas</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 transition-transform group-hover:translate-x-1"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                    </Link>
                    <Link href="/productions" className="btn-secondary">
                        Ver Produções
                    </Link>
                </motion.div>

                {/* Quick category navigation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.65 }}
                    className="flex flex-wrap gap-2 justify-center"
                >
                    {QUICK_LINKS.map(({ href, label, icon: Icon, color }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-zinc-400 text-xs font-bold transition-all ${color} hover:bg-white/10`}
                        >
                            <Icon className="w-3 h-3" />
                            {label}
                        </Link>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
