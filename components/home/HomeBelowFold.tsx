import { StreamingTopShows, type ShowsByPlatform } from '@/components/features/StreamingTopShows'
import { HomeLatestArticles } from '@/components/home/HomeLatestArticles'
import { HomeRecommended } from '@/components/home/HomeRecommended'
import { HomeTrendingGroups, type TrendingGroup } from '@/components/home/HomeTrendingGroups'
import { HomeWatchSection } from '@/components/home/HomeWatchSection'

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
    compositionMode: 'editorial' | 'watch' | 'balanced'
}

export function HomeBelowFold({ watchProductions = [], feedPosts, showsByPlatform, trendingGroups, hasStreaming, compositionMode }: Props) {
    const radarTitle = hasStreaming && trendingGroups.length > 0
        ? 'O que está dominando as plataformas'
        : hasStreaming
            ? 'O que assistir nas plataformas'
            : 'Grupos que estão puxando a conversa'

    const radarSection = (hasStreaming || trendingGroups.length > 0) ? (
        <section key="radar" className="bg-background pt-6 sm:pt-7">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 border-l-[4px] border-accent pl-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-accent">Radar</p>
                <h2 className="mt-1 text-[19px] sm:text-[21px] font-black tracking-[-0.025em] text-foreground">{radarTitle}</h2>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm grid lg:grid-cols-[1fr_360px]">
                    {hasStreaming && (
                        <div className="border-b lg:border-b-0 lg:border-r border-border">
                            <StreamingTopShows showsByPlatform={showsByPlatform} />
                        </div>
                    )}
                    <HomeTrendingGroups groups={trendingGroups} />
                </div>
            </div>
        </section>
    ) : null

    const orderedSections = compositionMode === 'editorial'
        ? [<HomeLatestArticles key="articles" posts={feedPosts} />, radarSection, <HomeWatchSection key="watch" productions={watchProductions} />]
        : compositionMode === 'watch'
            ? [radarSection, <HomeWatchSection key="watch" productions={watchProductions} />, <HomeLatestArticles key="articles" posts={feedPosts} />]
            : [radarSection, <HomeLatestArticles key="articles" posts={feedPosts} />, <HomeWatchSection key="watch" productions={watchProductions} />]

    return (
        <div>
            <HomeRecommended />
            {orderedSections}
        </div>
    )
}
