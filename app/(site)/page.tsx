import prisma from "@/lib/prisma"
import type { Metadata } from "next"
import { unstable_cache } from "next/cache"
import { applyAgeRatingFilter } from "@/lib/utils/age-rating-filter"
export const HOME_CACHE_TAG = 'home-public-data'
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { HomeFrontPage } from "@/components/home/HomeFrontPage"
import { HomeBelowFold } from "@/components/home/HomeBelowFold"
import { JsonLd } from "@/components/seo/JsonLd"
import { AdBanner } from "@/components/ui/AdBanner"
import type { ShowsByPlatform } from "@/components/features/StreamingTopShows"

// ISR: homepage recacheada a cada 10 minutos como fallback.
// Revalidação antecipada via revalidateTag(HOME_CACHE_TAG) nos crons de publish e trending.
export const revalidate = 600

// Durante o build local (sem DB), retorna shell vazio para que o build não falhe
// Em produção, a primeira request popula o cache via ISR
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
const IS_BUILD = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD

const POST_SELECT = {
    id: true, slug: true, title: true, excerpt: true,
    coverImageUrl: true, publishedAt: true, readingTimeMin: true,
    category: { select: { name: true, slug: true } },
    tags: true,
} as const

function getWeekOfYear(date: Date) {
    const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    const day = utcDate.getUTCDay() || 7
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day)
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1))
    return Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function serializePost<T extends { publishedAt: Date | null }>(p: T) {
    return { ...p, publishedAt: p.publishedAt?.toISOString() ?? null }
}

function getDayOfYear(date: Date) {
    const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0))
    const diff = date.getTime() - start.getTime()
    const oneDay = 1000 * 60 * 60 * 24
    return Math.floor(diff / oneDay)
}

const getHomePublicData = unstable_cache(
    async () => {
        const [
            trendingArtists,
            streamingShowsRaw,
            trendingGroupsRaw,
            settings,
            categoryCounts,
            artistCount,
            groupCount,
            productionCount,
        ] = await Promise.all([
            prisma.artist.findMany({
                where: { flaggedAsNonKorean: false, isHidden: false, nameRomanized: { not: '' } },
                take: 12,
                orderBy: { trendingScore: 'desc' },
                select: {
                    id: true, slug: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true,
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
                select: { id: true, slug: true, name: true, nameHangul: true, profileImageUrl: true, officialColor: true, fanClubName: true, trendingScore: true, agency: { select: { name: true } } },
            }).catch(() => []),
            prisma.systemSettings.findUnique({ where: { id: 'singleton' } }).catch(() => null),
            prisma.blogCategory.findMany({
                include: { _count: { select: { posts: { where: { status: 'PUBLISHED', isPrivate: false } } } } },
            }).catch(() => []),
            prisma.artist.count({ where: { flaggedAsNonKorean: false, isHidden: false } }).catch(() => 0),
            prisma.musicalGroup.count({ where: { isHidden: false } }).catch(() => 0),
            prisma.production.count({ where: { isHidden: false, flaggedAsNonKorean: false } }).catch(() => 0),
        ])

        // ── Slots editoriais ──────────────────────────────────────────────────
        const slottedIds = new Set<string>()
        if (settings?.homeFeaturedPostId) slottedIds.add(settings.homeFeaturedPostId)
        settings?.homeSecondaryPostIds?.forEach(id => slottedIds.add(id))
        settings?.homeSidebarPostIds?.forEach(id => slottedIds.add(id))
        settings?.homeCarouselPostIds?.forEach(id => slottedIds.add(id))

        // Busca posts dos slots configurados
        const [slottedPostsRaw, fallbackPostsRaw] = await Promise.all([
            slottedIds.size > 0
                ? prisma.blogPost.findMany({
                    where: { id: { in: Array.from(slottedIds) }, status: 'PUBLISHED' },
                    select: POST_SELECT,
                }).catch(() => [])
                : [],
            // Feed + fallback: exclui os que já estão nos slots
            // take:30 garante posts suficientes por categoria nas seções do feed
            prisma.blogPost.findMany({
                where: {
                    status: 'PUBLISHED',
                    ...(slottedIds.size > 0 ? { id: { notIn: Array.from(slottedIds) } } : {}),
                },
                take: 30,
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
                .slice(0, 8)
            : fallback.slice(0, 8)

        const carouselPosts = settings?.homeCarouselPostIds?.length
            ? settings.homeCarouselPostIds
                .map(id => slottedById[id])
                .filter(Boolean)
                .slice(0, 5)
            : []

        // Feed exclui tudo que aparece nos slots e no featured
        const featuredId = featuredPost?.id
        const secondaryIds = new Set(secondaryPosts.map(p => p.id))
        const feedPosts = fallbackPostsRaw.filter(
            p => p.id !== featuredId && !secondaryIds.has(p.id)
        )

        const categoryCountMap = Object.fromEntries(
            categoryCounts.map(c => [c.slug, c._count.posts])
        )

        // spotlightArtist rotaciona semanalmente dentro do top 8 do trending
        const spotlightCandidates = trendingArtists.slice(0, 8)
        const rotatedSpotlightArtist = spotlightCandidates.length > 0
            ? spotlightCandidates[(getWeekOfYear(new Date()) - 1) % spotlightCandidates.length]
            : null
        // Regra de negócio: o bloco "Destaque da semana" usa apenas o artista da rotação semanal.
        const spotlightArtist = rotatedSpotlightArtist

        // spotlightProduction — query cached junto com os dados públicos
        const spotlightArtistId = spotlightArtist?.id
        const spotlightProduction = spotlightArtistId
            ? await prisma.production.findFirst({
                where: {
                    isHidden: false,
                    isTakenDown: false,
                    flaggedAsNonKorean: false,
                    year: { not: null },
                    artists: { some: { artistId: spotlightArtistId } },
                },
                orderBy: [
                    { releaseDate: { sort: 'desc', nulls: 'last' } },
                    { year: 'desc' },
                    { createdAt: 'desc' },
                ],
                select: { id: true, slug: true, titlePt: true, type: true, year: true, imageUrl: true, voteAverage: true },
            }).catch(() => null)
            : null

        const ageFilter = await applyAgeRatingFilter()
        const latestProductions = await prisma.production.findMany({
            where: { isHidden: false, flaggedAsNonKorean: false, ...ageFilter },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, slug: true, titlePt: true, type: true, year: true, imageUrl: true, voteAverage: true },
        }).catch(() => [])

        return {
            trendingArtists,
            featuredPost: featuredPost ? serializePost(featuredPost) : null,
            carouselPosts: carouselPosts.map(serializePost),
            secondaryPosts: secondaryPosts.map(serializePost),
            sidebarPosts: sidebarPosts.map(serializePost),
            feedPosts: feedPosts.map(serializePost),
            streamingShowsRaw,
            trendingGroups: trendingGroupsRaw,
            categoryCountMap,
            siteStats: { artists: artistCount, groups: groupCount, productions: productionCount },
            spotlightArtist,
            spotlightProduction,
            latestProductions,
        }
    },
    ['home-page-public-data-v15'],
    { revalidate: 600, tags: [HOME_CACHE_TAG] },
)

const SITE_URL = 'https://www.hallyuhub.com.br'

const OG_IMAGE = `${SITE_URL}/opengraph-image`

export const metadata: Metadata = {
    title: {
        absolute: 'HallyuHub — K-Pop, K-Drama e Cultura Coreana',
    },
    description: 'Descubra artistas K-Pop, grupos, dramas e filmes coreanos com perfis completos em português. Notícias, tendências e muito mais sobre o universo Hallyu.',
    alternates: {
        canonical: SITE_URL,
    },
    openGraph: {
        title: 'HallyuHub — K-Pop, K-Drama e Cultura Coreana',
        description: 'Descubra artistas K-Pop, grupos, dramas e filmes coreanos com perfis completos em português. Notícias, tendências e muito mais sobre o universo Hallyu.',
        url: SITE_URL,
        siteName: 'HallyuHub',
        locale: 'pt_BR',
        type: 'website',
        images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'HallyuHub — K-Pop, K-Drama e Cultura Coreana' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'HallyuHub — K-Pop, K-Drama e Cultura Coreana',
        description: 'Descubra artistas K-Pop, grupos, dramas e filmes coreanos com perfis completos em português. Notícias, tendências e muito mais sobre o universo Hallyu.',
        images: [OG_IMAGE],
    },
}

export default async function Home() {
    // Build local não tem DB — retorna shell mínimo; ISR popula em produção
    if (IS_BUILD) return <div />

    const publicData = await getHomePublicData()

    const { trendingArtists, featuredPost, carouselPosts, secondaryPosts, sidebarPosts, feedPosts, streamingShowsRaw, trendingGroups, categoryCountMap, siteStats, spotlightArtist, spotlightProduction, latestProductions } = publicData

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
    const dayIndex = getDayOfYear(new Date())
    const randomArtist = trendingArtists.length > 0 ? trendingArtists[dayIndex % trendingArtists.length] : null
    const randomGroup = trendingGroups.length > 0 ? trendingGroups[(dayIndex + 1) % trendingGroups.length] : null
    const randomProduction = latestProductions.length > 0 ? latestProductions[(dayIndex + 2) % latestProductions.length] : null

    return (
        <div className="min-h-screen bg-background font-sora overflow-x-hidden pb-[70px] sm:pb-0" suppressHydrationWarning>
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "HallyuHub",
                "url": SITE_URL,
                "description": "Portal de cultura coreana — artistas K-Pop, grupos, dramas e filmes em português.",
                "inLanguage": "pt-BR",
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": `${SITE_URL}/search?q={search_term_string}`,
                    },
                    "query-input": "required name=search_term_string",
                },
            }} />
            <HomeFrontPage
                featuredStory={featuredPost ?? undefined}
                carouselPosts={carouselPosts}
                secondaryStories={secondaryPosts}
                trendingArtists={trendingArtists.slice(0, 8)}
                spotlightArtist={spotlightArtist}
                spotlightProduction={spotlightProduction}
            />
            <div className="max-w-7xl mx-auto px-4 py-4">
                <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_ARTICLE!} format="auto" />
            </div>
            <HomeBelowFold
                artist={randomArtist ? { id: randomArtist.id, nameRomanized: randomArtist.nameRomanized, nameHangul: randomArtist.nameHangul, primaryImageUrl: randomArtist.primaryImageUrl } : null}
                group={randomGroup ? { id: randomGroup.id, name: randomGroup.name, nameHangul: randomGroup.nameHangul, profileImageUrl: randomGroup.profileImageUrl } : null}
                production={randomProduction ? { id: randomProduction.id, titlePt: randomProduction.titlePt, posterUrl: randomProduction.imageUrl, year: randomProduction.year } : null}
                feedPosts={feedPosts}
                sidebarPosts={sidebarPosts}
                latestProductions={latestProductions}
                categoryCountMap={categoryCountMap}
                showsByPlatform={showsByPlatform}
                trendingGroups={trendingGroups}
                hasStreaming={hasStreaming}
                siteStats={siteStats}
            />
            <ScrollToTop />
        </div>
    )
}
