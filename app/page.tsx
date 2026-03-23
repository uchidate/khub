import prisma from "@/lib/prisma"
import type { Metadata } from "next"
import { unstable_cache } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { applyAgeRatingFilter } from "@/lib/utils/age-rating-filter"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { HomeCategoriesBar } from "@/components/home/HomeCategoriesBar"
import { HomeFrontPage } from "@/components/home/HomeFrontPage"
import { HomeNewsFeed } from "@/components/home/HomeNewsFeed"
import { HomeArtistsGrid } from "@/components/home/HomeArtistsGrid"
import { HomeProductionsCarousel } from "@/components/home/HomeProductionsCarousel"
import { HomeBlogSection } from "@/components/home/HomeBlogSection"

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
            trendingArtists, topNewsRaw, featuredBlogPostsRaw,
        ] = await Promise.all([
            prisma.artist.findMany({
                where: { flaggedAsNonKorean: false, isHidden: false, nameRomanized: { not: '' } },
                take: 12,
                orderBy: { trendingScore: 'desc' },
                select: {
                    id: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true,
                    roles: true, gender: true, trendingScore: true, viewCount: true,
                    agency: { select: { name: true } },
                },
            }),
            prisma.news.findMany({
                where: { isHidden: false, status: 'published' },
                take: 8,
                orderBy: { publishedAt: 'desc' },
                select: {
                    id: true, title: true, imageUrl: true, publishedAt: true,
                    contentMd: true, originalContent: true, tags: true,
                },
            }),
            prisma.blogPost.findMany({
                where: { status: 'PUBLISHED' },
                take: 4,
                orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
                select: {
                    id: true, slug: true, title: true, excerpt: true,
                    coverImageUrl: true, publishedAt: true, readingTimeMin: true,
                    category: { select: { name: true, slug: true } },
                    tags: true,
                },
            }).catch(() => [] as { id: string; slug: string; title: string; excerpt: string | null; coverImageUrl: string | null; publishedAt: Date | null; readingTimeMin: number; category: { name: string; slug: string } | null; tags: string[] }[]),
        ])

        return {
            trendingArtists,
            topNews: topNewsRaw.map(n => ({
                id: n.id,
                title: n.title,
                imageUrl: n.imageUrl,
                publishedAt: n.publishedAt.toISOString(),
                tags: n.tags,
                excerpt: stripMarkdown(n.contentMd || n.originalContent),
            })),
            featuredBlogPosts: featuredBlogPostsRaw.map(p => ({
                ...p,
                publishedAt: p.publishedAt?.toISOString() ?? null,
            })),
        }
    },
    ['home-page-public-data-v3'],
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

    const { trendingArtists, topNews, featuredBlogPosts } = publicData

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
                featuredStory={topNews[0]}
                secondaryStories={topNews.slice(1, 5)}
                trendingArtists={trendingArtists.slice(0, 5)}
            />
            <HomeNewsFeed
                news={topNews.slice(1)}
                productions={latestProductions.slice(0, 5)}
                blogPosts={featuredBlogPosts}
            />
            <HomeArtistsGrid artists={trendingArtists.slice(0, 6)} />
            <HomeProductionsCarousel productions={latestProductions} />
            <HomeBlogSection posts={featuredBlogPosts} />
            <ScrollToTop />
        </div>
    )
}
