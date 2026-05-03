'use client'

import dynamic from 'next/dynamic'
import { AdBanner } from '@/components/ui/AdBanner'
import type { ShowsByPlatform } from '@/components/features/StreamingTopShows'
import type { TrendingGroup } from '@/components/home/HomeTrendingGroups'

// Tipos inline para evitar importar módulos pesados só para tipagem
interface BlogFeedItem {
    id: string; slug: string; title: string; excerpt: string | null
    coverImageUrl: string | null; publishedAt: string | null
    readingTimeMin: number; category: { name: string; slug: string } | null; tags: string[]
}
interface ProductionItem {
    id: string; titlePt: string; type: string; year: number | null
    imageUrl: string | null; voteAverage: number | null
}
interface SiteStats { artists: number; productions: number; groups: number }
interface RandomArtist { id: string; nameRomanized: string; nameHangul: string | null; primaryImageUrl: string | null }
interface RandomGroup { id: string; name: string; nameHangul: string | null; profileImageUrl: string | null }
interface RandomProduction { id: string; titlePt: string; posterUrl: string | null; year: number | null }

interface AgencyItem {
    id: string; name: string; logoUrl: string | null
    accentColor: string | null; type: string
    _count: { artists: number; musicalGroups: number }
}

interface Props {
    artist: RandomArtist | null
    group: RandomGroup | null
    production: RandomProduction | null
    feedPosts: BlogFeedItem[]
    sidebarPosts: BlogFeedItem[]
    latestProductions: ProductionItem[]
    categoryCountMap: Record<string, number>
    showsByPlatform: ShowsByPlatform
    trendingGroups: TrendingGroup[]
    hasStreaming: boolean
    siteStats: SiteStats
    topAgencies: AgencyItem[]
}

const HomeRandomDiscovery = dynamic(() => import('./HomeRandomDiscovery').then(m => ({ default: m.HomeRandomDiscovery })), { loading: () => <div className="h-28" /> })
const HomeRecommended = dynamic(() => import('./HomeRecommended').then(m => ({ default: m.HomeRecommended })), { ssr: false, loading: () => <div className="h-[220px]" /> })
const HomeBlogFeed = dynamic(() => import('./HomeNewsFeed').then(m => ({ default: m.HomeBlogFeed })), { loading: () => <div className="h-[600px]" /> })
const StreamingTopShows = dynamic(() => import('@/components/features/StreamingTopShows').then(m => ({ default: m.StreamingTopShows })), { loading: () => <div className="h-[400px]" /> })
const HomeTrendingGroups = dynamic(() => import('./HomeTrendingGroups').then(m => ({ default: m.HomeTrendingGroups })), { loading: () => <div className="h-[400px]" /> })
const HomeBlogSection = dynamic(() => import('./HomeBlogSection').then(m => ({ default: m.HomeBlogSection })), { loading: () => <div className="h-48" /> })
import { HomeTopAgencies } from './HomeTopAgencies'

const AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_AUTO!

export function HomeBelowFold({ artist, group, production, feedPosts, sidebarPosts, latestProductions, categoryCountMap, showsByPlatform, trendingGroups, hasStreaming, siteStats, topAgencies }: Props) {
    return (
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 2400px' }}>
            <HomeRandomDiscovery artist={artist} group={group} production={production} />
            <div className="hidden md:block max-w-7xl mx-auto px-4 py-4">
                <AdBanner slot={AD_SLOT} variant="auto" minimal />
            </div>
            <HomeRecommended />
            <HomeBlogFeed
                blogPosts={feedPosts}
                sidebarPosts={sidebarPosts}
                productions={latestProductions}
                categoryCounts={categoryCountMap}
            />
            <div className="max-w-7xl mx-auto px-4 py-4">
                <AdBanner slot={AD_SLOT} variant="auto" minimal />
            </div>
            {(hasStreaming || trendingGroups.length > 0) && (
                <section className="border-b border-border bg-background">
                    <div className="max-w-7xl mx-auto grid md:grid-cols-[1fr_360px]">
                        {hasStreaming && (
                            <div className="border-b md:border-b-0 md:border-r border-border">
                                <StreamingTopShows showsByPlatform={showsByPlatform} />
                            </div>
                        )}
                        <HomeTrendingGroups groups={trendingGroups} />
                    </div>
                </section>
            )}
            <HomeTopAgencies agencies={topAgencies} />
            <HomeBlogSection siteStats={siteStats} />
        </div>
    )
}
