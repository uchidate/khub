'use client'

import { useEffect, useState } from 'react'
import { Users, Film, Newspaper, TrendingUp } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface Stat {
    label: string
    value: number
    icon: React.ReactNode
    color: string
    gradient: string
}

interface StatsData {
    artists: number
    productions: number
    news: number
    views: number
}

export function StatsSection() {
    const [stats, setStats] = useState<StatsData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/stats')
            const data = await response.json()
            setStats(data)
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading || !stats) {
        return (
            <section className="relative py-20">
                <div className="max-w-[1400px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="h-40 bg-zinc-900/50 rounded-2xl border border-white/10" />
                        </div>
                    ))}
                </div>
            </section>
        )
    }

    const statsList: Stat[] = [
        {
            label: 'Artistas',
            value: stats.artists,
            icon: <Users className="w-8 h-8" />,
            color: 'text-purple-400',
            gradient: 'from-purple-600/20 to-purple-900/20'
        },
        {
            label: 'Produções',
            value: stats.productions,
            icon: <Film className="w-8 h-8" />,
            color: 'text-pink-400',
            gradient: 'from-pink-600/20 to-pink-900/20'
        },
        {
            label: 'Notícias',
            value: stats.news,
            icon: <Newspaper className="w-8 h-8" />,
            color: 'text-cyan-400',
            gradient: 'from-cyan-600/20 to-cyan-900/20'
        },
        {
            label: 'Visualizações',
            value: stats.views,
            icon: <TrendingUp className="w-8 h-8" />,
            color: 'text-green-400',
            gradient: 'from-green-600/20 to-green-900/20'
        }
    ]

    return (
        <section ref={ref} className="relative py-20">
            {/* Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative max-w-[1400px] mx-auto">
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-purple-400 mb-4 block">
                            Números em Tempo Real
                        </span>
                        <h2 className="text-3xl md:text-5xl font-display font-black text-white italic tracking-tighter uppercase">
                            O Universo Hallyu
                        </h2>
                    </motion.div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {statsList.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="group"
                        >
                            <div className={`relative p-6 rounded-2xl bg-gradient-to-br ${stat.gradient} border border-white/10 hover:border-white/20 transition-all hover:scale-105 backdrop-blur-sm overflow-hidden`}>
                                {/* Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10">
                                    <div className={`${stat.color} mb-4 opacity-80 group-hover:opacity-100 transition-opacity`}>
                                        {stat.icon}
                                    </div>

                                    <div className="space-y-2">
                                        <AnimatedCounter
                                            value={stat.value}
                                            isInView={isInView}
                                            className={`text-4xl md:text-5xl font-black ${stat.color} tracking-tighter`}
                                        />
                                        <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                                            {stat.label}
                                        </p>
                                    </div>
                                </div>

                                {/* Decorative Element */}
                                <div className={`absolute -bottom-10 -right-10 w-32 h-32 ${stat.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// Componente de contador animado
function AnimatedCounter({
    value,
    isInView,
    className
}: {
    value: number
    isInView: boolean
    className?: string
}) {
    const [count, setCount] = useState(0)

    useEffect(() => {
        if (!isInView) return

        const duration = 2000 // 2 segundos
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
    }, [value, isInView])

    return (
        <div className={className}>
            {count.toLocaleString('pt-BR')}
        </div>
    )
}
