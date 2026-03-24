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
import { HomeArtistsGrid } from "@/components/home/HomeArtistsGrid"
import { HomeProductionsCarousel } from "@/components/home/HomeProductionsCarousel"
import { HomeBlogSection } from "@/components/home/HomeBlogSection"
import { StreamingTopShows, type ShowsByPlatform } from "@/components/features/StreamingTopShows"

export const dynamic = 'force-dynamic'

/**
 * Dados públicos da home — independentes de usuário/sessão.
 * Cache de 2 minutos. Em cache hit: zero queries ao banco para visitantes anônimos.
 */
const getHomePublicData = unstable_cache(
    async () => {
        const [
            trendingArtists, featuredBlogPostsRaw, streamingShowsRaw,
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
        ])

        return {
            trendingArtists,
            featuredBlogPosts: featuredBlogPostsRaw.map(p => ({
                ...p,
                publishedAt: p.publishedAt?.toISOString() ?? null,
            })),
            streamingShowsRaw,
        }
    },
    ['home-page-public-data-v5'],
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

    const { trendingArtists, featuredBlogPosts, streamingShowsRaw } = publicData

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

    const latestProductionsRaw = await prisma.production.findMany({
        where: {
            isHidden: false,
            flaggedAsNonKorean: false,
            ...ageRatingFilter,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true, titlePt: true, type: true, year: true,
            imageUrl: true, voteAverage: true, createdAt: true,
            streamingPlatforms: true,
        },
    })

    const latestProductions = latestProductionsRaw.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
    }))

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
                productions={latestProductions.slice(0, 5)}
            />
            <HomeArtistsGrid artists={trendingArtists.slice(0, 6)} />
            <HomeProductionsCarousel productions={latestProductions} />
            {hasStreaming && (
                <section className="border-b border-border bg-background">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
                        <StreamingTopShows showsByPlatform={showsByPlatform} />
                    </div>
                </section>
            )}
            <HomeBlogSection posts={featuredBlogPosts.slice(0, 4)} />
            <ScrollToTop />
        </div>
    )
}
