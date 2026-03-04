'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Film, Star, Calendar, Sparkles, Trophy } from 'lucide-react'

interface Production {
    id: string
    titlePt: string
    type: string
    year: number | null
    imageUrl: string | null
    voteAverage: number | null
    createdAt?: string
}

interface ProductionsTabsProps {
    latest: Production[]
    topRated: Production[]
}

const TABS = [
    { key: 'latest',   label: 'Recém Adicionados', icon: Sparkles },
    { key: 'topRated', label: 'Mais Bem Avaliados', icon: Trophy   },
] as const

type TabKey = typeof TABS[number]['key']

export function ProductionsTabs({ latest, topRated }: ProductionsTabsProps) {
    const [active, setActive] = useState<TabKey>('latest')

    const productions = active === 'latest' ? latest : topRated
    if (latest.length === 0 && topRated.length === 0) return null

    return (
        <section>
            {/* Header compacto */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mb-5">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-600/20 rounded-lg">
                        <Film className="w-4 h-4 text-purple-400" />
                    </div>
                    <h2 className="text-xl font-black dark:text-white text-zinc-900 uppercase tracking-tight">
                        Produções
                    </h2>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-zinc-900/60 border border-white/5 rounded-xl p-1">
                    {TABS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActive(key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                active === key
                                    ? 'bg-cyber-purple text-white shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            <Icon className="w-3 h-3" />
                            <span className="hidden sm:inline">{label}</span>
                            <span className="sm:hidden">{key === 'latest' ? 'Recentes' : 'Top'}</span>
                        </button>
                    ))}
                </div>

                <Link
                    href="/productions"
                    className="ml-auto text-xs font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors hidden sm:block"
                >
                    Ver todos →
                </Link>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {productions.map((prod) => (
                    <Link
                        key={prod.id}
                        href={`/productions/${prod.id}`}
                        className="group block"
                    >
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 mb-2 shadow-md">
                            {/* Rating Badge */}
                            {prod.voteAverage && prod.voteAverage > 0 && (
                                <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-0.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded-full">
                                    <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                                    <span className="text-white text-[10px] font-bold">
                                        {prod.voteAverage.toFixed(1)}
                                    </span>
                                </div>
                            )}

                            {prod.imageUrl ? (
                                <Image
                                    src={prod.imageUrl}
                                    alt={prod.titlePt}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center p-3">
                                    <span className="text-white text-center text-xs font-bold line-clamp-3">
                                        {prod.titlePt}
                                    </span>
                                </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                            {/* Hover info */}
                            <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                <div className="flex items-center gap-1 text-[10px] text-zinc-300 flex-wrap">
                                    <span className="px-1.5 py-0.5 bg-purple-600/80 backdrop-blur-sm rounded font-bold">
                                        {prod.type}
                                    </span>
                                    {prod.year && (
                                        <span className="flex items-center gap-0.5">
                                            <Calendar className="w-2.5 h-2.5" />
                                            {prod.year}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <h3 className="text-white font-bold text-xs group-hover:text-purple-400 transition-colors line-clamp-2 leading-tight px-0.5">
                            {prod.titlePt}
                        </h3>
                    </Link>
                ))}
            </div>

            {/* Ver todos mobile */}
            <div className="mt-4 sm:hidden text-center">
                <Link
                    href="/productions"
                    className="text-xs font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
                >
                    Ver todas as produções →
                </Link>
            </div>
        </section>
    )
}
