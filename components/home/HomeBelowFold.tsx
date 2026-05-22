import { StreamingTopShows, type ShowsByPlatform } from '@/components/features/StreamingTopShows'
import { HomeRecommended } from '@/components/home/HomeRecommended'
import { HomeTrendingGroups, type TrendingGroup } from '@/components/home/HomeTrendingGroups'
import { HomeWatchSection } from '@/components/home/HomeWatchSection'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'

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
    feedPosts?: BlogFeedItem[]
    showsByPlatform: ShowsByPlatform
    trendingGroups: TrendingGroup[]
    hasStreaming: boolean
    compositionMode: 'editorial' | 'watch' | 'balanced'
}

export function HomeBelowFold({ watchProductions = [], showsByPlatform, trendingGroups, hasStreaming }: Props) {
    const radarTitle = hasStreaming && trendingGroups.length > 0
        ? 'O que está dominando as plataformas'
        : hasStreaming
            ? 'O que assistir nas plataformas'
            : 'Grupos que estão puxando a conversa'

    const radarSection = (hasStreaming || trendingGroups.length > 0) ? (
        <section key="radar" className="bg-background">
            <div className="page-wrap border-t border-border py-10">
                <SectionTitleBar eyebrow="Radar" title={radarTitle} />
                <div className={`grid gap-10 ${hasStreaming && trendingGroups.length > 0 ? 'lg:grid-cols-[1fr_360px] lg:gap-0 lg:divide-x lg:divide-border/40' : ''}`}>
                    {hasStreaming && <StreamingTopShows showsByPlatform={showsByPlatform} />}
                    <HomeTrendingGroups groups={trendingGroups} />
                </div>
            </div>
        </section>
    ) : null

    return (
        <div>
            <HomeRecommended />
            {radarSection}
            <HomeWatchSection productions={watchProductions} />
        </div>
    )
}
