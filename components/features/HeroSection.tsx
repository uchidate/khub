'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

export function HeroSection() {
    return (
        <section className="relative w-full flex items-center justify-center overflow-hidden pt-32 pb-16 md:pt-40 md:pb-20">
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
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-5xl md:text-9xl font-display font-black mb-4 tracking-tighter leading-tight italic"
                >
                    A ONDA <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-purple via-neon-pink to-electric-cyan animate-gradient bg-[length:200%_auto]">HALLYU</span><br />
                    NO SEU RITMO.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-base md:text-xl text-zinc-400 mb-8 max-w-xl mx-auto leading-relaxed"
                >
                    K-Pop, K-Dramas e cultura coreana com design premium.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-row gap-3 justify-center items-center"
                >
                    <Link href="/artists" className="btn-primary flex items-center gap-2 group">
                        <span>Explorar Artistas</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 transition-transform group-hover:translate-x-1"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                    </Link>
                    <Link href="/about" className="btn-secondary">
                        Saiba Mais
                    </Link>
                </motion.div>
            </div>
        </section>
    )
}
