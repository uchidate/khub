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
import { HomeTrendingGroups } from "@/components/home/HomeTrendingGroups"

export const dynamic = 'force-dynamic'

const POST_SELECT = {
    id: true, slug: true, title: true, excerpt: true,
    coverImageUrl: true, publishedAt: true, readingTimeMin: true,
    category: { select: { name: true, slug: true } },
    tags: true,
} as const

function serializePost<T extends { publishedAt: Date | null }>(p: T) {
    return { ...p, publishedAt: p.publishedAt?.toISOString() ?? null }
}

const getHomePublicData = unstable_cache(
    async () => {
        const [
            trendingArtists,
            streamingShowsRaw,
            trendingGroupsRaw,
            settings,
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
            prisma.musicalGroup.findMany({
                where: { isHidden: false, trendingScore: { gt: 0 } },
                take: 16,
                orderBy: { trendingScore: 'desc' },
                select: { id: true, name: true, nameHangul: true, profileImageUrl: true, officialColor: true, fanClubName: true, trendingScore: true, agency: { select: { name: true } } },
            }).catch(() => []),
            prisma.systemSettings.findUnique({ where: { id: 'singleton' } }).catch(() => null),
        ])

        // ── Slots editoriais ──────────────────────────────────────────────────
        const slottedIds = new Set<string>()
        if (settings?.homeFeaturedPostId) slottedIds.add(settings.homeFeaturedPostId)
        settings?.homeSecondaryPostIds?.forEach(id => slottedIds.add(id))
        settings?.homeSidebarPostIds?.forEach(id => slottedIds.add(id))

        // Busca posts dos slots configurados
        const [slottedPostsRaw, fallbackPostsRaw] = await Promise.all([
            slottedIds.size > 0
                ? prisma.blogPost.findMany({
                    where: { id: { in: Array.from(slottedIds) }, status: 'PUBLISHED' },
                    select: POST_SELECT,
                }).catch(() => [])
                : [],
            // Feed + fallback: exclui os que já estão nos slots
            prisma.blogPost.findMany({
                where: {
                    status: 'PUBLISHED',
                    ...(slottedIds.size > 0 ? { id: { notIn: Array.from(slottedIds) } } : {}),
                },
                take: 12,
                orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
                select: POST_SELECT,
            }).catch(() => []),
        ])

        const slottedById = Object.fromEntries(slottedPostsRaw.map(p => [p.id, p]))

        // Resolve slots — fallback para os mais recentes se slot vazio
        const fallback = fallbackPostsRaw
        const featuredPost = settings?.homeFeaturedPostId
            ? (slottedById[settings.homeFeaturedPostId] ?? fallback[0])
            : fallback[0]

        const secondaryPosts = settings?.homeSecondaryPostIds?.length
            ? settings.homeSecondaryPostIds
                .map(id => slottedById[id])
                .filter(Boolean)
                .slice(0, 4)
            : fallback.slice(1, 5)

        const sidebarPosts = settings?.homeSidebarPostIds?.length
            ? settings.homeSidebarPostIds
                .map(id => slottedById[id])
                .filter(Boolean)
                .slice(0, 4)
            : fallback.slice(0, 4)

        // Feed exclui tudo que aparece nos slots e no featured
        const featuredId = featuredPost?.id
        const secondaryIds = new Set(secondaryPosts.map(p => p.id))
        const feedPosts = fallbackPostsRaw.filter(
            p => p.id !== featuredId && !secondaryIds.has(p.id)
        )

        return {
            trendingArtists,
            featuredPost: featuredPost ? serializePost(featuredPost) : null,
            secondaryPosts: secondaryPosts.map(serializePost),
            sidebarPosts: sidebarPosts.map(serializePost),
            feedPosts: feedPosts.map(serializePost),
            streamingShowsRaw,
            trendingGroups: trendingGroupsRaw,
        }
    },
    ['home-page-public-data-v7'],
    { revalidate: 120 },
)

const SITE_URL = 'https://www.hallyuhub.com.br'

export const metadata: Metadata = {
    title: 'HallyuHub - A Onda Coreana no Seu Ritmo',
    description: 'Explore os perfis mais detalhados de artistas, agências e as melhores produções da Coreia do Sul.',
    alternates: {
        canonical: SITE_URL,
    },
    openGraph: {
        title: 'HallyuHub - A Onda Coreana no Seu Ritmo',
        description: 'Explore os perfis mais detalhados de artistas, agências e as melhores produções da Coreia do Sul.',
        url: SITE_URL,
        siteName: 'HallyuHub',
        locale: 'pt_BR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'HallyuHub - A Onda Coreana no Seu Ritmo',
        description: 'Explore os perfis mais detalhados de artistas, agências e as melhores produções da Coreia do Sul.',
    },
}

export default async function Home() {
    const session = await getServerSession(authOptions)

    const [publicData, ageRatingFilter] = await Promise.all([
        getHomePublicData(),
        applyAgeRatingFilter(),
    ])

    const { trendingArtists, featuredPost, secondaryPosts, sidebarPosts, feedPosts, streamingShowsRaw, trendingGroups } = publicData

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
                featuredStory={featuredPost ?? undefined}
                secondaryStories={secondaryPosts}
                trendingArtists={trendingArtists.slice(0, 8)}
            />
            <HomeBlogFeed
                blogPosts={feedPosts}
                sidebarPosts={sidebarPosts}
                productions={latestProductions}
            />
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
            <HomeBlogSection posts={sidebarPosts} />
            <ScrollToTop />
        </div>
    )
}
