import prisma from "@/lib/prisma"
import type { Metadata } from "next"
import { unstable_cache } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { applyAgeRatingFilter } from "@/lib/utils/age-rating-filter"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { HomeCategoriesBar } from "@/components/home/HomeCategoriesBar"
import { HomeFrontPage } from "@/components/home/HomeFrontPage"
import { HomeBlogFeed } from "@/components/home/HomeNewsFeed"
import { HomeBlogSection } from "@/components/home/HomeBlogSection"
import { StreamingTopShows, type ShowsByPlatform } from "@/components/features/StreamingTopShows"
import { HomeTopRated } from "@/components/home/HomeTopRated"
import { HomeTrendingGroups } from "@/components/home/HomeTrendingGroups"
import { HomeUpcoming } from "@/components/home/HomeUpcoming"
import { HomeMarathon } from "@/components/home/HomeMarathon"

export const dynamic = 'force-dynamic'

const getHomePublicData = unstable_cache(
    async () => {
        const [
            trendingArtists,
            featuredBlogPostsRaw,
            streamingShowsRaw,
            topRatedRaw,
            trendingGroupsRaw,
            upcomingRaw,
            marathonRaw,
        ] = await Promise.all([
            prisma.artist.findMany({
                where: { flaggedAsNonKorean: false, isHidden: false, nameRomanized: { not: '' } },
                take: 12,
                orderBy: { trendingScore: 'desc' },
                select: {
                    id: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true,
                    roles: true, gender: true, trendingScore: true, viewCount: true,
                    trendingRank: true, trendingRankPrev: true, trendingBadgeOverride: true,
                    createdAt: true,
                    agency: { select: { name: true } },
                },
            }),
            prisma.blogPost.findMany({
                where: { status: 'PUBLISHED' },
                take: 10,
                orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
                select: {
                    id: true, slug: true, title: true, excerpt: true,
                    coverImageUrl: true, publishedAt: true, readingTimeMin: true,
                    category: { select: { name: true, slug: true } },
                    tags: true,
                },
            }).catch(() => [] as { id: string; slug: string; title: string; excerpt: string | null; coverImageUrl: string | null; publishedAt: Date | null; readingTimeMin: number; category: { name: string; slug: string } | null; tags: string[] }[]),
            prisma.streamingShow.findMany({
                where: { expiresAt: { gt: new Date() } },
                take: 100,
                select: {
                    source: true, rank: true, showTitle: true, tmdbId: true,
                    posterUrl: true, year: true, voteAverage: true, isKorean: true,
                    productionId: true,
                    production: { select: { titlePt: true } },
                },
                orderBy: [{ source: 'asc' }, { rank: 'asc' }],
            }).catch(() => []),
            // A — Mais bem avaliados
            prisma.production.findMany({
                where: { isHidden: false, flaggedAsNonKorean: false, voteAverage: { gte: 8 } },
                take: 16,
                orderBy: { voteAverage: 'desc' },
                select: { id: true, titlePt: true, type: true, year: true, imageUrl: true, backdropUrl: true, voteAverage: true },
            }).catch(() => []),
            // B — Grupos em alta
            prisma.musicalGroup.findMany({
                where: { isHidden: false, trendingScore: { gt: 0 } },
                take: 16,
                orderBy: { trendingScore: 'desc' },
                select: { id: true, name: true, nameHangul: true, profileImageUrl: true, officialColor: true, fanClubName: true, trendingScore: true, agency: { select: { name: true } } },
            }).catch(() => []),
            // C — Em breve
            prisma.production.findMany({
                where: {
                    isHidden: false,
                    flaggedAsNonKorean: false,
                    OR: [
                        { releaseDate: { gte: new Date().toISOString(), lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() } },
                        { productionStatus: { in: ['In Production', 'Post Production', 'Planned'] } },
                    ],
                },
                take: 12,
                orderBy: { releaseDate: 'asc' },
                select: { id: true, titlePt: true, type: true, releaseDate: true, imageUrl: true, productionStatus: true, network: true },
            }).catch(() => []),
            // D — Para maratonar (Returning Series bem avaliadas)
            prisma.production.findMany({
                where: {
                    isHidden: false,
                    flaggedAsNonKorean: false,
                    productionStatus: 'Returning Series',
                    voteAverage: { gte: 7 },
                    imageUrl: { not: null },
                },
                take: 32,
                orderBy: { voteAverage: 'desc' },
                select: { id: true, titlePt: true, type: true, year: true, imageUrl: true, voteAverage: true, episodeCount: true },
            }).catch(() => []),
        ])

        return {
            trendingArtists,
            featuredBlogPosts: featuredBlogPostsRaw.map(p => ({
                ...p,
                publishedAt: p.publishedAt?.toISOString() ?? null,
            })),
            streamingShowsRaw,
            topRated: topRatedRaw,
            trendingGroups: trendingGroupsRaw,
            upcoming: upcomingRaw.map(p => ({ ...p, releaseDate: p.releaseDate ? p.releaseDate.toISOString() : null })),
            marathon: marathonRaw,
        }
    },
    ['home-page-public-data-v6'],
    { revalidate: 120 },
)

export const metadata: Metadata = {
    title: 'HallyuHub - A Onda Coreana no Seu Ritmo',
    description: 'Explore os perfis mais detalhados de artistas, agências e as melhores produções da Coreia do Sul.',
}

export default async function Home() {
    const session = await getServerSession(authOptions)

    const [publicData, ageRatingFilter] = await Promise.all([
        getHomePublicData(),
        applyAgeRatingFilter(),
    ])

    const { trendingArtists, featuredBlogPosts, streamingShowsRaw, topRated, trendingGroups, upcoming, marathon } = publicData

    // Agrupa streaming shows por plataforma
    const showsByPlatform: ShowsByPlatform = {}
    for (const show of streamingShowsRaw) {
        if (!showsByPlatform[show.source]) showsByPlatform[show.source] = []
        showsByPlatform[show.source].push({
            rank: show.rank,
            showTitle: show.showTitle,
            tmdbId: show.tmdbId,
            source: show.source,
            productionId: show.productionId ?? undefined,
            productionTitle: show.production?.titlePt ?? undefined,
            posterUrl: show.posterUrl,
            year: show.year,
            voteAverage: show.voteAverage,
            isKorean: show.isKorean,
        })
    }
    const hasStreaming = Object.keys(showsByPlatform).length > 0

    // Productions for HomeBlogFeed sidebar (latest additions)
    const latestProductions = await prisma.production.findMany({
        where: { isHidden: false, flaggedAsNonKorean: false, ...ageRatingFilter },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, titlePt: true, type: true, year: true, imageUrl: true, voteAverage: true },
    })

    return (
        <div className="min-h-screen bg-background font-sora overflow-x-hidden">
            <HomeCategoriesBar />
            <HomeFrontPage
                featuredStory={featuredBlogPosts[0]}
                secondaryStories={featuredBlogPosts.slice(1, 5)}
                trendingArtists={trendingArtists.slice(0, 8)}
            />
            <HomeBlogFeed
                blogPosts={featuredBlogPosts.slice(1)}
                productions={latestProductions}
            />
            {hasStreaming && (
                <section className="border-b border-border bg-background">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
                        <StreamingTopShows showsByPlatform={showsByPlatform} />
                    </div>
                </section>
            )}
            <HomeTopRated productions={topRated} />
            <HomeTrendingGroups groups={trendingGroups} />
            <HomeUpcoming productions={upcoming} />
            <HomeMarathon productions={marathon} />
            <HomeBlogSection posts={featuredBlogPosts.slice(0, 4)} />
            <ScrollToTop />
        </div>
    )
}
