'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'

export interface MarathonProduction {
    id: string
    titlePt: string
    type: string
    year: number | null
    imageUrl: string | null
    voteAverage: number | null
    episodeCount: number | null
}

const TABS = [
    { label: 'Todos', value: 'all' },
    { label: 'K-Drama', value: 'K-Drama' },
    { label: 'Séries', value: 'SERIE' },
    { label: 'Filmes', value: 'Filme' },
]

export function HomeMarathon({ productions }: { productions: MarathonProduction[] }) {
    const [activeTab, setActiveTab] = useState('all')

    if (!productions.length) return null

    const filtered = activeTab === 'all'
        ? productions
        : productions.filter(p => p.type === activeTab || p.type.toUpperCase() === activeTab.toUpperCase())

    return (
        <section className="border-b border-border bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-[18px] font-extrabold tracking-[-0.04em] text-foreground">
                        Para <span className="text-accent">maratonar</span>
                    </h2>
                    <div className="flex items-center gap-1">
                        {TABS.map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value)}
                                className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors ${
                                    activeTab === tab.value
                                        ? 'bg-accent text-white'
                                        : 'text-muted hover:text-foreground hover:bg-surface border border-transparent hover:border-border'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div
                    className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-3"
                >
                    {filtered.slice(0, 16).map((prod) => (
                        <Link
                            key={prod.id}
                            href={`/productions/${prod.id}`}
                            className="group relative rounded-xl overflow-hidden border border-border hover:border-accent/40 transition-all"
                            style={{ aspectRatio: '2/3' }}
                        >
                            {prod.imageUrl ? (
                                <Image
                                    src={prod.imageUrl}
                                    alt={prod.titlePt}
                                    fill
                                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 13vw"
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full bg-surface-hover flex items-center justify-center">
                                    <span className="text-xl font-black text-muted">{prod.titlePt[0]}</span>
                                </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                            {prod.voteAverage != null && prod.voteAverage > 0 && (
                                <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/70 text-yellow-400 text-[9px] font-bold">
                                    <Star className="w-2.5 h-2.5 fill-yellow-400" />
                                    {prod.voteAverage.toFixed(1)}
                                </div>
                            )}

                            <div className="absolute bottom-0 left-0 right-0 p-2">
                                <p className="text-[10px] font-bold text-white leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                                    {prod.titlePt}
                                </p>
                                {prod.episodeCount != null && (
                                    <p className="text-[9px] text-white/60 mt-0.5">{prod.episodeCount} eps</p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
