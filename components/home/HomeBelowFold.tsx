'use client'

import dynamic from 'next/dynamic'
import type { ShowsByPlatform } from '@/components/features/StreamingTopShows'
import type { TrendingGroup } from '@/components/home/HomeTrendingGroups'

// Tipos inline para evitar importar módulos pesados só para tipagem
interface BlogFeedItem {
    id: string; slug: string; title: string; excerpt: string | null
    coverImageUrl: string | null; publishedAt: string | null
    readingTimeMin: number; category: { name: string; slug: string } | null; tags: string[]
}
interface WatchProduction {
    id: string; slug?: string | null; titlePt: string; type: string
    year: number | null; imageUrl: string | null; voteAverage: number | null
}

interface Props {
    watchProductions?: WatchProduction[]
    feedPosts: BlogFeedItem[]
    showsByPlatform: ShowsByPlatform
    trendingGroups: TrendingGroup[]
    hasStreaming: boolean
}

const HomeRecommended = dynamic(() => import('./HomeRecommended').then(m => ({ default: m.HomeRecommended })), { ssr: false, loading: () => null })
const HomeLatestArticles = dynamic(() => import('./HomeLatestArticles').then(m => ({ default: m.HomeLatestArticles })), { loading: () => <div className="h-[420px]" /> })
const HomeWatchSection = dynamic(() => import('./HomeWatchSection').then(m => ({ default: m.HomeWatchSection })), { loading: () => <div className="h-[360px]" /> })
const StreamingTopShows = dynamic(() => import('@/components/features/StreamingTopShows').then(m => ({ default: m.StreamingTopShows })), { loading: () => <div className="h-[400px]" /> })
const HomeTrendingGroups = dynamic(() => import('./HomeTrendingGroups').then(m => ({ default: m.HomeTrendingGroups })), { loading: () => <div className="h-[400px]" /> })


export function HomeBelowFold({ watchProductions = [], feedPosts, showsByPlatform, trendingGroups, hasStreaming }: Props) {
    const radarTitle = hasStreaming && trendingGroups.length > 0
        ? 'O que está dominando as plataformas'
        : hasStreaming
            ? 'O que assistir nas plataformas'
            : 'Grupos que estão puxando a conversa'

    return (
        <div>
            <HomeRecommended />
            {(hasStreaming || trendingGroups.length > 0) && (
                <section className="bg-background pt-4 sm:pt-5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3">
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">Radar</p>
                        <h2 className="mt-1 text-[18px] sm:text-[20px] font-bold tracking-[-0.02em] text-foreground">{radarTitle}</h2>
                    </div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-[0_1px_0_rgba(15,23,42,0.04)] grid lg:grid-cols-[1fr_360px]">
                        {hasStreaming && (
                            <div className="border-b lg:border-b-0 lg:border-r border-border">
                                <StreamingTopShows showsByPlatform={showsByPlatform} />
                            </div>
                        )}
                        <HomeTrendingGroups groups={trendingGroups} />
                    </div>
                    </div>
                </section>
            )}
            <HomeWatchSection productions={watchProductions} />
            <HomeLatestArticles posts={feedPosts} />
        </div>
    )
}
