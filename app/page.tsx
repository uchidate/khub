import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { unstable_cache } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { applyAgeRatingFilter } from "@/lib/utils/age-rating-filter"
import { HeroSection } from "@/components/features/HeroSection"
import { StatsSection } from "@/components/features/StatsSection"
import { FeaturedCarousel } from "@/components/features/FeaturedCarousel"
import { TrendingArtists } from "@/components/features/TrendingArtists"
import { TrendingGroups } from "@/components/features/TrendingGroups"
import { LatestProductions } from "@/components/features/LatestProductions"
import { RecommendedForYou } from "@/components/features/RecommendedForYou"
import { StreamingTopShows, type ShowsByPlatform } from "@/components/features/StreamingTopShows"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { Newspaper } from 'lucide-react'

export const dynamic = 'force-dynamic'

/**
 * Dados públicos da home — independentes de usuário/sessão.
 * Cache de 2 minutos: trending muda a cada 6h, 2min é mais que suficiente.
 * Em cache hit: zero queries ao banco para visitantes anônimos.
 */
const getHomePublicData = unstable_cache(
    async () => {
        const [
            artistCount, productionCount, newsCount, totalViews,
            featuredNewsRaw, trendingArtists, topNewsRaw, streamingShowsRaw, trendingGroupsRaw,
        ] = await Promise.all([
            prisma.artist.count(),
            prisma.production.count(),
            prisma.news.count(),
            prisma.artist.aggregate({ _sum: { viewCount: true } }),
            prisma.news.findMany({
                where: { imageUrl: { not: null } },
                take: 5,
                orderBy: { publishedAt: 'desc' },
                select: { id: true, title: true, imageUrl: true, publishedAt: true, tags: true },
            }),
            prisma.artist.findMany({
                where: { flaggedAsNonKorean: false, isHidden: false },
                take: 12,
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
                take: 3,
                orderBy: { publishedAt: 'desc' },
                select: {
                    id: true, title: true, imageUrl: true, publishedAt: true,
                    contentMd: true, originalContent: true,
                },
            }),
            prisma.streamingShow.findMany({
                where: { expiresAt: { gt: new Date() } },
                select: {
                    source: true, rank: true, showTitle: true, tmdbId: true,
                    posterUrl: true, year: true, voteAverage: true, isKorean: true, productionId: true,
                    production: { select: { titlePt: true } },
                },
                orderBy: [{ source: 'asc' }, { rank: 'asc' }],
            }).catch(() => [] as never[]),
            prisma.musicalGroup.findMany({
                take: 10,
                where: { disbandDate: null, isHidden: false },
                orderBy: [{ trendingScore: 'desc' }, { favoriteCount: 'desc' }, { viewCount: 'desc' }],
                select: {
                    id: true, name: true, nameHangul: true, profileImageUrl: true,
                    debutDate: true, disbandDate: true,
                    _count: { select: { members: true } },
                },
            }).catch(() => [] as never[]),
        ])

        // Serializar publishedAt para string (Dates que já eram serializadas no código original)
        return {
            siteStats: {
                artists: artistCount,
                productions: productionCount,
                news: newsCount,
                views: totalViews._sum.viewCount ?? 0,
            },
            featuredNews: featuredNewsRaw.map(n => ({ ...n, publishedAt: n.publishedAt.toISOString() })),
            trendingArtists,
            topNews: topNewsRaw.map(n => ({ ...n, publishedAt: n.publishedAt.toISOString() })),
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
    const session = await getServerSession(authOptions)

    // Dados públicos — cacheados por 2 minutos (zero queries em cache hit)
    const {
        siteStats, featuredNews, trendingArtists, topNews, streamingShowsRaw, trendingGroups,
    } = await getHomePublicData()

    // Aplicar filtro de classificação etária (respeita SystemSettings + UserContentPreferences)
    // Já usa unstable_cache internamente para system settings
    const ageRatingFilter = await applyAgeRatingFilter()

    // Latest Productions (6 mais recentes) — depende do filtro etário, não cacheável globalmente
    const latestProductionsRaw = await prisma.production.findMany({
        where: {
            flaggedAsNonKorean: false,
            ...ageRatingFilter,
        },
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            titlePt: true,
            type: true,
            year: true,
            imageUrl: true,
            voteAverage: true,
            createdAt: true
        }
    })

    const latestProductions = latestProductionsRaw.map(prod => ({
        ...prod,
        createdAt: prod.createdAt.toISOString()
    }))

    // Top Rated Productions (6 com maior nota TMDB ≥ 7.5) — idem
    const topRatedProductions = await prisma.production.findMany({
        where: {
            flaggedAsNonKorean: false,
            voteAverage: { gte: 7.5 },
            ...ageRatingFilter,
        },
        take: 6,
        orderBy: [{ voteAverage: 'desc' }, { year: 'desc' }],
        select: {
            id: true,
            titlePt: true,
            type: true,
            year: true,
            imageUrl: true,
            voteAverage: true,
        }
    })

    // Recommended News (apenas para usuários autenticados)
    let recommendedNews: any[] = []
    let favoritesCount = 0

    if (session?.user?.email) {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                favorites: {
                    where: { artistId: { not: null } },
                    select: { artistId: true }
                }
            }
        })

        const favoriteArtistIds = user?.favorites.map(f => f.artistId).filter(Boolean) || []
        favoritesCount = favoriteArtistIds.length

        if (favoriteArtistIds.length > 0) {
            recommendedNews = await prisma.news.findMany({
                where: {
                    artists: {
                        some: { artistId: { in: favoriteArtistIds as string[] } }
                    }
                },
                take: 3,
                orderBy: { publishedAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    imageUrl: true,
                    publishedAt: true,
                    tags: true,
                    artists: { select: { artistId: true } }
                }
            })
        }
    }

    const recommendedNewsFormatted = recommendedNews.map(news => ({
        ...news,
        publishedAt: news.publishedAt.toISOString(),
        artistsCount: news.artists?.length || 0
    }))

    // Agrupa por source → showsByPlatform
    const showsByPlatform: ShowsByPlatform = {}
    for (const show of streamingShowsRaw) {
        if (!showsByPlatform[show.source]) showsByPlatform[show.source] = []
        showsByPlatform[show.source].push({
            rank: show.rank,
            showTitle: show.showTitle,
            productionTitle: (show as any).production?.titlePt ?? undefined,
            tmdbId: show.tmdbId,
            source: show.source,
            posterUrl: show.posterUrl,
            year: show.year,
            voteAverage: show.voteAverage,
            isKorean: show.isKorean,
            productionId: show.productionId ?? undefined,
        })
    }

    return (
        <div className="dark:bg-black min-h-screen pb-20 overflow-x-hidden">
            <HeroSection />

            {/* Stats Section */}
            <div className="relative z-20 px-4 sm:px-6 lg:px-12 -mt-10">
                <StatsSection stats={siteStats} />
            </div>

            <div className="relative z-20 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 mt-4 space-y-12">

                {/* Grupos em Destaque */}
                {trendingGroups.length > 0 && (
                    <ScrollReveal delay={0.05}>
                        <TrendingGroups groups={trendingGroups as any} />
                    </ScrollReveal>
                )}

                {/* Featured News Carousel */}
                {featuredNews.length > 0 && (
                    <ScrollReveal delay={0.1}>
                        <section>
                            <FeaturedCarousel news={featuredNews} />
                        </section>
                    </ScrollReveal>
                )}

                {/* Top 10 nos Streamings */}
                {Object.keys(showsByPlatform).length > 0 && (
                    <ScrollReveal delay={0.15}>
                        <StreamingTopShows showsByPlatform={showsByPlatform} />
                    </ScrollReveal>
                )}

                {/* Trending Artists */}
                {trendingArtists.length > 0 && (
                    <ScrollReveal delay={0.2}>
                        <TrendingArtists artists={trendingArtists} />
                    </ScrollReveal>
                )}

                {/* Recommended For You (apenas para usuários autenticados) */}
                {session && recommendedNewsFormatted.length > 0 && (
                    <ScrollReveal delay={0.3}>
                        <RecommendedForYou
                            news={recommendedNewsFormatted}
                            isAuthenticated={!!session}
                            favoritesCount={favoritesCount}
                        />
                    </ScrollReveal>
                )}

                {/* Latest Productions */}
                {latestProductions.length > 0 && (
                    <ScrollReveal delay={0.2}>
                        <LatestProductions productions={latestProductions} />
                    </ScrollReveal>
                )}

                {/* Top Rated Productions */}
                {topRatedProductions.length > 0 && (
                    <ScrollReveal delay={0.25}>
                        <LatestProductions
                            productions={topRatedProductions}
                            variant="top"
                        />
                    </ScrollReveal>
                )}

                {/* Section: Latest News (Glass List) */}
                <ScrollReveal delay={0.3}>
                    <section className="relative">
                        <div className="absolute -inset-10 bg-cyber-purple/10 blur-[100px] rounded-full z-0 pointer-events-none" />
                        <div className="relative z-10 glass-card p-8 md:p-12 dark:border-white/10 dark:bg-black/60">
                            <div className="flex flex-col md:flex-row gap-12">
                                <div className="md:w-1/3">
                                    <div className="flex items-center gap-2 text-neon-pink font-black uppercase tracking-widest text-xs mb-4">
                                        <Newspaper size={14} /> News Feed
                                    </div>
                                    <h2 className="text-4xl md:text-6xl font-display font-black dark:text-white text-zinc-900 italic tracking-tighter leading-none mb-6">
                                        ÚLTIMAS<br />
                                        DO HALLYU
                                    </h2>
                                    <p className="dark:text-zinc-400 text-zinc-600 text-sm leading-relaxed mb-8">
                                        Fique por dentro dos comebacks, lançamentos de dramas e notícias exclusivas da indústria.
                                    </p>
                                    <Link href="/news" className="btn-primary text-xs uppercase tracking-widest hover:shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-105 active:scale-95">
                                        Ler Todas
                                    </Link>
                                </div>

                                <div className="md:w-2/3 grid gap-4">
                                    {topNews.map((item: any) => (
                                        <Link key={item.id} href={`/news/${item.id}`} className="group flex flex-col md:flex-row gap-6 p-6 rounded-2xl dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/5 dark:hover:border-white/20 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-zinc-300 transition-all hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1">
                                            <div className="relative w-full md:w-32 aspect-video rounded-lg overflow-hidden dark:bg-zinc-800 bg-zinc-200 flex-shrink-0">
                                                {item.imageUrl ? (
                                                    <Image src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full dark:bg-zinc-800 bg-zinc-300" />
                                                )}
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <span className="text-[10px] text-cyber-purple font-black uppercase tracking-widest mb-2">
                                                    {new Date(item.publishedAt).toLocaleDateString('pt-BR')}
                                                </span>
                                                <h3 className="text-lg font-bold dark:text-white text-zinc-900 group-hover:text-neon-pink transition-colors leading-tight mb-2">
                                                    {item.title}
                                                </h3>
                                                <p className="text-xs dark:text-zinc-500 text-zinc-600 line-clamp-2 md:line-clamp-1">
                                                    {(item.originalContent || item.contentMd)
                                                        .replace(/#{1,6}\s+/g, '')
                                                        .replace(/\*\*([^*]+)\*\*/g, '$1')
                                                        .replace(/\*([^*]+)\*/g, '$1')
                                                        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                                                        .replace(/\n+/g, ' ')
                                                        .trim()
                                                        .slice(0, 150)}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </ScrollReveal>
            </div>

            {/* Scroll to Top Button */}
            <ScrollToTop />
        </div>
    )
}
