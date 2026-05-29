import prisma from "@/lib/prisma"
import type { Metadata } from "next"
import { unstable_cache } from "next/cache"
export const HOME_CACHE_TAG = 'home-public-data'
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { HomeFrontPage } from "@/components/home/HomeFrontPage"
import { HomeBelowFold } from "@/components/home/HomeBelowFold"
import { HomeQuizBanner } from "@/components/home/HomeQuizBanner"
import { HomeTodaysBirthdays, type BirthdayArtist } from "@/components/home/HomeTodaysBirthdays"
import { JsonLd } from "@/components/seo/JsonLd"
import { HomeLojaDestaque } from "@/components/home/HomeLojaDestaque"
import { HomeNowStrip } from "@/components/home/HomeNowStrip"
import type { ShowsByPlatform } from "@/components/features/StreamingTopShows"
import { buildHomeRuntimeData } from "@/lib/home/home-runtime"
import { HomeDiscoverySection } from "@/components/home/HomeDiscoverySection"
import { HomeSectionFilterBar } from "@/components/home/HomeSectionFilterBar"

// ISR: homepage recacheada a cada 10 minutos como fallback.
// Revalidação antecipada via revalidateTag(HOME_CACHE_TAG) nos crons de publish e trending.
export const revalidate = 600

// Durante o build local (sem DB), retorna shell vazio para que o build não falhe
// Em produção, a primeira request popula o cache via ISR
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
const IS_BUILD = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD

const HOME_SECTIONS = [
    { label: 'Destaques', href: '#destaques' },
    { label: 'Descobertas', href: '#descobertas' },
    { label: 'Agora', href: '#agora' },
    { label: 'Aniversários', href: '#aniversarios' },
    { label: 'Radar', href: '#radar' },
    { label: 'Quiz', href: '#quiz' },
    { label: 'Loja', href: '#loja' },
]

const HOME_SECTION_SCROLL_MARGIN = {
    scrollMarginTop: 'calc(var(--site-header-h, 92px) + var(--section-bar-h, 52px) + 16px)',
}

const getHomePublicData = unstable_cache(
    () => buildHomeRuntimeData(),
    ['home-page-public-data-v26'],
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

    // Brasília (UTC-3) para o filtro de aniversários
    const nowBRT = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    const brtMonth = nowBRT.getMonth() + 1
    const brtDay = nowBRT.getDate()
    const brtYear = nowBRT.getFullYear()

    // Todas as queries em paralelo — reduz latência de ~4 batches seriais para ~1
    const [publicData, featuredProducts, birthdayArtists, categoryCounts] = await Promise.all([
        process.env.NODE_ENV === 'development' ? buildHomeRuntimeData() : getHomePublicData(),
        prisma.storeProduct.findMany({
            where: { isActive: true, isHidden: false },
            orderBy: [{ featured: 'desc' }, { position: 'asc' }, { createdAt: 'desc' }],
            take: 20,
            select: {
                id: true, name: true, price: true, originalPrice: true,
                imageUrl: true, affiliateUrl: true, store: true, category: true,
                badge: true, rating: true, soldCount: true,
            },
        }).catch(() => []),
        // Birthdays: filtra direto no banco por mês/dia em vez de take(500) em memória
        prisma.artist.findMany({
            where: {
                isHidden: false,
                flaggedAsNonKorean: false,
                birthDate: { not: null },
            },
            select: { id: true, slug: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true, birthDate: true },
            orderBy: { trendingScore: 'desc' },
            take: 500,
        }).catch(() => []),
        prisma.blogPost.groupBy({
            by: ['categoryId'],
            where: { publishedAt: { not: null } },
            _count: { _all: true },
            orderBy: { _count: { categoryId: 'desc' } },
        }).then(async rows => {
            const cats = await prisma.blogCategory.findMany({ select: { id: true, slug: true } })
            const slugMap = Object.fromEntries(cats.map(c => [c.id, c.slug]))
            return Object.fromEntries(rows.map(r => [slugMap[r.categoryId ?? ''] ?? '', r._count._all]))
        }).catch(() => ({} as Record<string, number>)),
    ])

    const todaysBirthdays: BirthdayArtist[] = birthdayArtists
        .filter(a => {
            const bd = a.birthDate!
            return bd.getUTCMonth() + 1 === brtMonth && bd.getUTCDate() === brtDay
        })
        .slice(0, 8)
        .map(a => ({ id: a.id, slug: a.slug, nameRomanized: a.nameRomanized, nameHangul: a.nameHangul, primaryImageUrl: a.primaryImageUrl, age: brtYear - a.birthDate!.getUTCFullYear() }))

    const {
        trendingArtists,
        featuredPost,
        carouselPosts,
        secondaryPosts,
        feedPosts,
        streamingShowsRaw,
        trendingGroups,
        spotlightArtist,
        spotlightProduction,
        watchProductions,
        randomArtist,
        randomGroup,
        randomProduction,
        topStreamingShow,
        featuredCluster,
        trendingCluster,
        composition,
    } = publicData
    const spotlightSeedPosts = [...secondaryPosts, ...feedPosts]
    const spotlightSeenIds = new Set<string>()
    const editorialSpotlightPosts = spotlightSeedPosts
        .filter(post => !spotlightSeenIds.has(post.id) && spotlightSeenIds.add(post.id))
        .slice(0, 4)
    const editorialSpotlightIds = new Set(editorialSpotlightPosts.map(post => post.id))
    const belowFoldFeedPosts = feedPosts.filter(post => !editorialSpotlightIds.has(post.id))

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
    const compositionMode = composition?.mode ?? 'balanced'
    return (
        <div className="min-h-screen bg-background font-sora pb-[var(--bottom-nav-h)] sm:pb-0" suppressHydrationWarning>
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

            <HomeSectionFilterBar sections={HOME_SECTIONS} />

            <div id="destaques" style={HOME_SECTION_SCROLL_MARGIN}>
            <HomeFrontPage
                featuredStory={featuredPost ?? undefined}
                carouselPosts={carouselPosts}
                spotlightPosts={editorialSpotlightPosts}
                trendingArtists={trendingArtists.slice(0, 8)}
                spotlightArtist={spotlightArtist}
                spotlightProduction={spotlightProduction}
                latestPosts={feedPosts.slice(0, 10)}
                categoryCounts={categoryCounts}
            />
            </div>
            <div id="descobertas" style={HOME_SECTION_SCROLL_MARGIN}>
            <HomeDiscoverySection
                cluster={featuredCluster ?? trendingCluster}
                artist={randomArtist ? { id: randomArtist.id, slug: randomArtist.slug, nameRomanized: randomArtist.nameRomanized, nameHangul: randomArtist.nameHangul, primaryImageUrl: randomArtist.primaryImageUrl } : null}
                group={randomGroup ? { id: randomGroup.id, slug: randomGroup.slug, name: randomGroup.name, nameHangul: randomGroup.nameHangul, profileImageUrl: randomGroup.profileImageUrl } : null}
                production={randomProduction ? { id: randomProduction.id, slug: randomProduction.slug, titlePt: randomProduction.titlePt, posterUrl: randomProduction.imageUrl, year: randomProduction.year } : null}
                mode={compositionMode}
            />
            </div>
            <div id="agora" style={HOME_SECTION_SCROLL_MARGIN}>
            <HomeNowStrip
                artist={trendingArtists[0] ?? null}
                group={trendingGroups[0] ?? null}
                production={topStreamingShow ? {
                    id: topStreamingShow.id,
                    title: topStreamingShow.title,
                    posterUrl: topStreamingShow.posterUrl,
                    year: topStreamingShow.year ?? null,
                } : randomProduction ? {
                    id: randomProduction.id,
                    title: randomProduction.titlePt,
                    posterUrl: randomProduction.imageUrl,
                    year: randomProduction.year,
                } : null}
                birthday={todaysBirthdays[0] ?? null}
                mode={compositionMode}
            />
            </div>
            <div id="aniversarios" style={HOME_SECTION_SCROLL_MARGIN}><HomeTodaysBirthdays artists={todaysBirthdays.slice(1)} /></div>
            <div id="radar" style={HOME_SECTION_SCROLL_MARGIN}>
            <HomeBelowFold
                watchProductions={watchProductions}
                feedPosts={belowFoldFeedPosts}
                showsByPlatform={showsByPlatform}
                trendingGroups={trendingGroups}
                hasStreaming={hasStreaming}
                compositionMode={compositionMode}
            />
            </div>
            <div id="quiz" style={HOME_SECTION_SCROLL_MARGIN}><HomeQuizBanner /></div>
            <div id="loja" style={HOME_SECTION_SCROLL_MARGIN}><HomeLojaDestaque products={featuredProducts} /></div>
            <ScrollToTop />
        </div>
    )
}
