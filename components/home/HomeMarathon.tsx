'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export interface MarathonProduction {
    id: string
    slug?: string | null
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
        : productions.filter(p => p.type === activeTab || p.type.toLowerCase() === activeTab.toLowerCase())

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 rounded-xl overflow-hidden border border-border">
                    {filtered.slice(0, 10).map((prod, idx) => (
                        <Link
                            key={prod.id}
                            href={`/productions/${prod.slug ?? prod.id}`}
                            className={`group flex items-center gap-3 px-4 py-3.5 hover:bg-surface transition-colors min-h-[60px]
                                ${idx % 2 === 0 ? 'sm:border-r border-border' : ''}
                                ${idx < filtered.length - 2 ? 'border-b border-border' : ''}
                            `}
                        >
                            <span className="text-[9px] font-bold text-muted w-4 flex-shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                            <div className="w-8 h-12 rounded-md flex-shrink-0 overflow-hidden bg-surface border border-border">
                                {prod.imageUrl ? (
                                    <Image src={prod.imageUrl} alt={prod.titlePt} width={32} height={48} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-muted">
                                        {prod.titlePt.slice(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-foreground group-hover:text-accent transition-colors truncate leading-tight">
                                    {prod.titlePt}
                                </p>
                                <p className="text-[9px] text-muted mt-0.5">
                                    {prod.type}{prod.year ? ` · ${prod.year}` : ''}{prod.episodeCount ? ` · ${prod.episodeCount} eps` : ''}
                                </p>
                            </div>
                            {prod.voteAverage != null && (
                                <span className="text-[10px] font-bold text-yellow-500 flex-shrink-0">★ {prod.voteAverage.toFixed(1)}</span>
                            )}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
