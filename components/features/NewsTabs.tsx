'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Newspaper, Heart } from 'lucide-react'

interface NewsItem {
    id: string
    title: string
    imageUrl: string | null
    publishedAt: string
    excerpt?: string
    isRecommended?: boolean
}

interface NewsTabsProps {
    latest: NewsItem[]
    recommended: NewsItem[]
    favoritesCount: number
}

const TABS = [
    { key: 'latest',      label: 'Últimas do Hallyu', shortLabel: 'Recentes',  icon: Newspaper },
    { key: 'recommended', label: 'Para Você',          shortLabel: 'Para Você', icon: Heart },
] as const

type TabKey = typeof TABS[number]['key']

export function NewsTabs({ latest, recommended, favoritesCount }: NewsTabsProps) {
    const hasRecommended = recommended.length > 0 && favoritesCount > 0
    const [active, setActive] = useState<TabKey>('latest')

    if (latest.length === 0 && !hasRecommended) return null

    const news = active === 'latest' ? latest : recommended
    const viewAllHref = active === 'recommended' ? '/news/feed' : '/news'

    return (
        <section>
            {/* Header compacto */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mb-5">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-accent/15 rounded-lg">
                        <Newspaper className="w-4 h-4 text-accent" />
                    </div>
                    <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
                        Notícias
                    </h2>
                </div>

                {/* Tabs — só aparece se houver recomendadas */}
                {hasRecommended && (
                    <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1">
                        {TABS.map(({ key, label, shortLabel, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setActive(key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                    active === key
                                        ? 'bg-accent text-white shadow-sm'
                                        : 'text-muted hover:text-foreground'
                                }`}
                            >
                                <Icon className="w-3 h-3" />
                                <span className="hidden sm:inline">{label}</span>
                                <span className="sm:hidden">{shortLabel}</span>
                            </button>
                        ))}
                    </div>
                )}

                <Link
                    href={viewAllHref}
                    className="ml-auto text-xs font-black text-muted hover:text-foreground uppercase tracking-widest transition-colors hidden sm:block"
                >
                    Ver todas →
                </Link>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {news.map((item) => (
                    <Link
                        key={item.id}
                        href={`/news/${item.id}`}
                        className="group flex flex-col rounded-2xl overflow-hidden bg-background border border-border hover:border-border transition-all hover:-translate-y-0.5"
                    >
                        {/* Imagem */}
                        <div className="relative aspect-video overflow-hidden bg-surface">
                            {item.isRecommended && (
                                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-accent rounded-full">
                                    <Heart className="w-2.5 h-2.5 text-white fill-white" />
                                    <span className="text-white text-[9px] font-black uppercase">Para Você</span>
                                </div>
                            )}
                            {item.imageUrl ? (
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                                />
                            ) : (
                                <div className="w-full h-full bg-surface" />
                            )}
                        </div>

                        {/* Texto */}
                        <div className="p-4 flex flex-col gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                                {new Date(item.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <h3 className="text-sm font-bold text-foreground group-hover:text-accent transition-colors leading-snug line-clamp-2">
                                {item.title}
                            </h3>
                            {item.excerpt && (
                                <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                                    {item.excerpt}
                                </p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>

            {/* Ver todas mobile */}
            <div className="mt-4 sm:hidden text-center">
                <Link
                    href={viewAllHref}
                    className="text-xs font-black text-muted hover:text-foreground uppercase tracking-widest transition-colors"
                >
                    Ver todas as notícias →
                </Link>
            </div>
        </section>
    )
}
