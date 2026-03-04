'use client'

import { useEffect, useState } from 'react'
import { Users, Film, Newspaper, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface StatsData {
    artists: number
    productions: number
    news: number
    views: number
}

interface StatsSectionProps {
    stats: StatsData
}

export function StatsSection({ stats }: StatsSectionProps) {
    const statsList = [
        {
            label: 'Artistas',
            href: '/artists',
            value: stats.artists,
            icon: <Users className="w-5 h-5 md:w-8 md:h-8" />,
            color: 'text-purple-400',
            gradient: 'from-purple-600/20 to-purple-900/20'
        },
        {
            label: 'Produções',
            href: '/productions',
            value: stats.productions,
            icon: <Film className="w-5 h-5 md:w-8 md:h-8" />,
            color: 'text-pink-400',
            gradient: 'from-pink-600/20 to-pink-900/20'
        },
        {
            label: 'Notícias',
            href: '/news',
            value: stats.news,
            icon: <Newspaper className="w-5 h-5 md:w-8 md:h-8" />,
            color: 'text-cyan-400',
            gradient: 'from-cyan-600/20 to-cyan-900/20'
        },
        {
            label: 'Visualizações',
            href: '/artists?sortBy=trending',
            value: stats.views,
            icon: <TrendingUp className="w-5 h-5 md:w-8 md:h-8" />,
            color: 'text-green-400',
            gradient: 'from-green-600/20 to-green-900/20'
        }
    ]

    return (
        <section className="relative py-10 md:py-12">
            {/* Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative max-w-[1400px] mx-auto">
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-purple-400 mb-4 block">
                            Números em Tempo Real
                        </span>
                        <h2 className="text-3xl md:text-5xl font-display font-black dark:text-white text-zinc-900 italic tracking-tighter uppercase">
                            O Universo Hallyu
                        </h2>
                    </motion.div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {statsList.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="group"
                        >
                            <Link href={stat.href} className="block">
                                <div className={`relative p-4 md:p-6 rounded-2xl bg-gradient-to-br ${stat.gradient} dark:border-white/10 dark:hover:border-white/20 border border-zinc-200 hover:border-zinc-300 transition-all hover:scale-105 backdrop-blur-sm overflow-hidden`}>
                                    {/* Glow Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative z-10">
                                        <div className={`${stat.color} mb-2 md:mb-4 opacity-80 group-hover:opacity-100 transition-opacity`}>
                                            {stat.icon}
                                        </div>

                                        <div className="space-y-1 md:space-y-2">
                                            <AnimatedCounter
                                                value={stat.value}
                                                className={`text-2xl md:text-4xl lg:text-5xl font-black ${stat.color} tracking-tighter`}
                                            />
                                            <p className="text-xs md:text-sm font-bold dark:text-zinc-400 text-zinc-600 uppercase tracking-wider">
                                                {stat.label}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Decorative Element */}
                                    <div className={`absolute -bottom-10 -right-10 w-32 h-32 ${stat.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// Contador animado — dispara no mount (dados já chegam prontos do servidor)
function AnimatedCounter({
    value,
    className
}: {
    value: number
    className?: string
}) {
    const [count, setCount] = useState(0)

    useEffect(() => {
        const duration = 2000
        const steps = 60
        const increment = value / steps
        const stepDuration = duration / steps

        let current = 0
        const timer = setInterval(() => {
            current += increment
            if (current >= value) {
                setCount(value)
                clearInterval(timer)
            } else {
                setCount(Math.floor(current))
            }
        }, stepDuration)

        return () => clearInterval(timer)
    }, [value])

    return (
        <div className={className}>
            {count.toLocaleString('pt-BR')}
        </div>
    )
}
