import prisma from "@/lib/prisma"
import type { Metadata } from "next"
import { unstable_cache } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { applyAgeRatingFilter } from "@/lib/utils/age-rating-filter"
import { HeroSection } from "@/components/features/HeroSection"
import { TrendingArtists } from "@/components/features/TrendingArtists"
import { TrendingGroups } from "@/components/features/TrendingGroups"
import { ProductionsTabs } from "@/components/features/ProductionsTabs"
import { StreamingTopShows, type ShowsByPlatform } from "@/components/features/StreamingTopShows"
import { NewsTabs } from "@/components/features/NewsTabs"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { ScrollToTop } from "@/components/ui/ScrollToTop"

export const dynamic = 'force-dynamic'

function stripMarkdown(text: string | null | undefined): string {
    if (!text) return ''
    return text
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\n+/g, ' ')
        .trim()
        .slice(0, 150)
}

/**
 * Dados públicos da home — independentes de usuário/sessão.
 * Cache de 2 minutos. Em cache hit: zero queries ao banco para visitantes anônimos.
 */
const getHomePublicData = unstable_cache(
    async () => {
        const [
            artistCount, productionCount, newsCount, totalViews,
            featuredNewsRaw, trendingArtists, topNewsRaw, streamingShowsRaw, trendingGroupsRaw,
        ] = await Promise.all([
            prisma.artist.count({ where: { isHidden: false, flaggedAsNonKorean: false } }),
            prisma.production.count({ where: { isHidden: false, flaggedAsNonKorean: false } }),
            prisma.news.count({ where: { isHidden: false } }),
            prisma.artist.aggregate({ _sum: { viewCount: true }, where: { isHidden: false } }),
            prisma.news.findMany({
                where: { imageUrl: { not: null }, isHidden: false },
                take: 5,
                orderBy: { publishedAt: 'desc' },
                select: { id: true, title: true, imageUrl: true, publishedAt: true, tags: true },
            }),
            prisma.artist.findMany({
                where: { flaggedAsNonKorean: false, isHidden: false },
                take: 10,
                orderBy: { trendingScore: 'desc' },
                select: {
                    id: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true,
                    roles: true, gender: true, trendingScore: true, viewCount: true,
                    streamingSignals: {
                        where: { expiresAt: { gt: new Date() } },
                        select: { showTitle: true, rank: true, source: true },
                        orderBy: { rank: 'asc' },
                        take: 1,
                    },
                },
            }),
            prisma.news.findMany({
                where: { isHidden: false },
                take: 3,
                orderBy: { publishedAt: 'desc' },
                // Busca apenas os campos necessários — excerpt processado server-side
                select: {
                    id: true, title: true, imageUrl: true, publishedAt: true,
                    contentMd: true, originalContent: true,
                },
            }),
            prisma.streamingShow.findMany({
                where: { expiresAt: { gt: new Date() } },
                take: 100,
                select: {
                    source: true, rank: true, showTitle: true, tmdbId: true,
                    posterUrl: true, year: true, voteAverage: true, isKorean: true, productionId: true,
                    production: { select: { titlePt: true } },
                },
                orderBy: [{ source: 'asc' }, { rank: 'asc' }],
            }).catch(() => [] as { source: string; rank: number; showTitle: string; tmdbId: number | null; posterUrl: string | null; year: number | null; voteAverage: number | null; isKorean: boolean; productionId: string | null; production: { titlePt: string | null } | null }[]),
            prisma.musicalGroup.findMany({
                take: 8,
                where: { disbandDate: null, isHidden: false },
                orderBy: [{ trendingScore: 'desc' }, { favoriteCount: 'desc' }, { viewCount: 'desc' }],
                select: {
                    id: true, name: true, nameHangul: true, profileImageUrl: true,
                    debutDate: true, disbandDate: true,
                    _count: { select: { members: true } },
                },
            }).catch(() => [] as { id: string; name: string; nameHangul: string | null; profileImageUrl: string | null; debutDate: Date | null; disbandDate: Date | null; _count: { members: number } }[]),
        ])

        return {
            siteStats: {
                artists: artistCount,
                productions: productionCount,
                news: newsCount,
                views: totalViews._sum.viewCount ?? 0,
            },
            featuredNews: featuredNewsRaw.map(n => ({ ...n, publishedAt: n.publishedAt.toISOString() })),
            trendingArtists,
            // Excerpt processado server-side: não enviamos contentMd completo ao cliente
            topNews: topNewsRaw.map(n => ({
                id: n.id,
                title: n.title,
                imageUrl: n.imageUrl,
                publishedAt: n.publishedAt.toISOString(),
                excerpt: stripMarkdown(n.contentMd || n.originalContent),
            })),
            streamingShowsRaw,
            trendingGroups: trendingGroupsRaw,
        }
    },
    ['home-page-public-data'],
    { revalidate: 120 },
)

export const metadata: Metadata = {
    title: 'HallyuHub - A Onda Coreana no Seu Ritmo',
    description: 'Explore os perfis mais detalhados de artistas, agências e as melhores produções da Coreia do Sul.',
}

export default async function Home() {
    // Chamada única de getServerSession — reutilizada em applyAgeRatingFilter para evitar dupla verificação JWT
    const session = await getServerSession(authOptions)

    // Paraleliza dados públicos + filtro etário (independentes entre si)
    const [publicData, ageRatingFilter] = await Promise.all([
        getHomePublicData(),
        applyAgeRatingFilter(undefined, session),
    ])

    const { siteStats, featuredNews, trendingArtists, topNews, streamingShowsRaw, trendingGroups } = publicData

    // Paraleliza as 3 queries que dependem do ageRatingFilter e da sessão
    const [latestProductionsRaw, topRatedProductions, userWithFavorites] = await Promise.all([
        prisma.production.findMany({
            where: {
                isHidden: false,
                flaggedAsNonKorean: false,
                ...ageRatingFilter,
            },
            take: 8,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, titlePt: true, type: true, year: true,
                imageUrl: true, voteAverage: true, createdAt: true,
            },
        }),
        prisma.production.findMany({
            where: {
                isHidden: false,
                flaggedAsNonKorean: false,
                voteAverage: { gte: 7.5 },
                ...ageRatingFilter,
            },
            take: 8,
            orderBy: [{ voteAverage: 'desc' }, { year: 'desc' }],
            select: {
                id: true, titlePt: true, type: true, year: true,
                imageUrl: true, voteAverage: true,
            },
        }),
        session?.user?.email
            ? prisma.user.findUnique({
                where: { email: session.user.email },
                select: {
                    favorites: {
                        where: { artistId: { not: null } },
                        select: { artistId: true },
                    },
                },
            })
            : Promise.resolve(null),
    ])

    const latestProductions = latestProductionsRaw.map(p => ({ ...p, createdAt: p.createdAt.toISOString() }))

    const favoriteArtistIds = (userWithFavorites?.favorites ?? [])
        .map(f => f.artistId)
        .filter((id): id is string => !!id)
    const favoritesCount = favoriteArtistIds.length

    // Busca recommended news apenas se houver favoritos
    const recommendedNewsRaw = favoritesCount > 0
        ? await prisma.news.findMany({
            where: {
                isHidden: false,
                artists: { some: { artistId: { in: favoriteArtistIds } } },
            },
            take: 3,
            orderBy: { publishedAt: 'desc' },
            select: {
                id: true, title: true, imageUrl: true, publishedAt: true,
                tags: true, artists: { select: { artistId: true } },
            },
        })
        : []

    const recommendedNews = recommendedNewsRaw.map(n => ({
        ...n,
        publishedAt: n.publishedAt.toISOString(),
        artistsCount: n.artists?.length ?? 0,
    }))

    // Agrupa streaming shows por plataforma
    const showsByPlatform: ShowsByPlatform = {}
    for (const show of streamingShowsRaw) {
        if (!showsByPlatform[show.source]) showsByPlatform[show.source] = []
        showsByPlatform[show.source].push({
            rank: show.rank,
            showTitle: show.showTitle,
            productionTitle: show.production?.titlePt ?? undefined,
            tmdbId: show.tmdbId?.toString() ?? '',
            source: show.source,
            posterUrl: show.posterUrl,
            year: show.year,
            voteAverage: show.voteAverage,
            isKorean: show.isKorean,
            productionId: show.productionId ?? undefined,
        })
    }

    const hasStreaming = Object.keys(showsByPlatform).length > 0

    return (
        <div className="dark:bg-black min-h-screen pb-20 overflow-x-hidden">
            <HeroSection
                trendingArtists={trendingArtists}
                latestNews={featuredNews}
                stats={siteStats}
            />

            <div className="relative z-20 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 space-y-6 md:space-y-8">

                {/* 1. Top 10 nos Streamings — o que está quente agora */}
                {hasStreaming && (
                    <ScrollReveal delay={0.05}>
                        <StreamingTopShows showsByPlatform={showsByPlatform} />
                    </ScrollReveal>
                )}

                {/* 2. Trending Artists */}
                {trendingArtists.length > 0 && (
                    <ScrollReveal delay={0.1}>
                        <TrendingArtists artists={trendingArtists} />
                    </ScrollReveal>
                )}

                {/* 3. Trending Groups */}
                {trendingGroups.length > 0 && (
                    <ScrollReveal delay={0.15}>
                        <TrendingGroups groups={trendingGroups as any} />
                    </ScrollReveal>
                )}

                {/* 4 + 5. Produções — tabs (Recentes | Mais Bem Avaliados) */}
                {(latestProductions.length > 0 || topRatedProductions.length > 0) && (
                    <ScrollReveal delay={0.2}>
                        <ProductionsTabs latest={latestProductions} topRated={topRatedProductions} />
                    </ScrollReveal>
                )}

                {/* 6. Notícias — tabs (Últimas | Para Você) */}
                <ScrollReveal delay={0.25}>
                    <NewsTabs
                        latest={topNews}
                        recommended={session ? recommendedNews.map(n => ({ ...n, isRecommended: true })) : []}
                        favoritesCount={favoritesCount}
                    />
                </ScrollReveal>
            </div>

            <ScrollToTop />
        </div>
    )
}
