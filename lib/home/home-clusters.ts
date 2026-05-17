import prisma from "@/lib/prisma"
import type { FeaturedContextItem } from "@/lib/home/featured-context"
import { scoreHomeCandidate } from "@/lib/home/home-scoring"

export type HomeCluster = {
    key: "featured" | "trending"
    eyebrow: string
    title: string
    items: Array<FeaturedContextItem & { reasonLabel: string }>
}

type TrendingArtistSeed = {
    id: string
    slug: string | null
    nameRomanized: string
    primaryImageUrl: string | null
    trendingScore?: number | null
}

type TrendingGroupSeed = {
    id: string
    slug: string | null
    name: string
    profileImageUrl: string | null
    trendingScore?: number | null
}

type TrendingProductionSeed = {
    id?: string
    title: string
    posterUrl: string | null
    rank?: number | null
}

function withLabels(items: FeaturedContextItem[]): HomeCluster["items"] {
    return items.map((item) => ({
        ...item,
        reasonLabel: item.reason === "linked_directly"
            ? "Ligado ao destaque"
            : item.reason === "same_group"
                ? "Mesmo grupo"
                : item.reason === "same_topic"
                    ? "Mesmo tema"
                    : "Com artista citado",
    }))
}

export function buildFeaturedCluster(items: FeaturedContextItem[]): HomeCluster | null {
    if (items.length === 0) return null
    return {
        key: "featured",
        eyebrow: "Conectado ao destaque",
        title: "Continue explorando",
        items: withLabels(items),
    }
}

export async function buildTrendingCluster({
    artist,
    group,
    production,
    excludeHrefs = new Set<string>(),
}: {
    artist: TrendingArtistSeed | null
    group: TrendingGroupSeed | null
    production: TrendingProductionSeed | null
    excludeHrefs?: Set<string>
}): Promise<HomeCluster | null> {
    const items: HomeCluster["items"] = []

    if (artist) {
        const scoreBreakdown = scoreHomeCandidate({ reason: "trending_artist", trendingScore: artist.trendingScore })
        items.push({
            type: "artist",
            href: `/artists/${artist.slug ?? artist.id}`,
            title: artist.nameRomanized,
            imageUrl: artist.primaryImageUrl,
            reason: "linked_directly",
            reasonLabel: "Artista em alta",
            score: scoreBreakdown.total,
            scoreBreakdown,
        })
    }

    if (group) {
        const scoreBreakdown = scoreHomeCandidate({ reason: "trending_group", trendingScore: group.trendingScore })
        items.push({
            type: "group",
            href: `/groups/${group.slug ?? group.id}`,
            title: group.name,
            imageUrl: group.profileImageUrl,
            reason: "linked_directly",
            reasonLabel: "Grupo em alta",
            score: scoreBreakdown.total,
            scoreBreakdown,
        })
    }

    if (production?.id) {
        const scoreBreakdown = scoreHomeCandidate({ reason: "streaming_rank", rank: production.rank })
        items.push({
            type: "production",
            href: `/productions/${production.id}`,
            title: production.title,
            imageUrl: production.posterUrl,
            reason: "linked_directly",
            reasonLabel: "Para assistir",
            score: scoreBreakdown.total,
            scoreBreakdown,
        })
    }

    if (artist && items.length < 4) {
        const linkedPost = await prisma.blogPost.findFirst({
            where: {
                status: "PUBLISHED",
                isPrivate: false,
                relatedArtists: { some: { artistId: artist.id } },
            },
            orderBy: { publishedAt: "desc" },
            select: {
                slug: true,
                title: true,
                coverImageUrl: true,
            },
        }).catch(() => null)

        if (linkedPost) {
            const scoreBreakdown = scoreHomeCandidate({ reason: "recent_article" })
            items.push({
                type: "article",
                href: `/blog/${linkedPost.slug}`,
                title: linkedPost.title,
                imageUrl: linkedPost.coverImageUrl,
                reason: "artist_cast",
                reasonLabel: "Artigo recente",
                score: scoreBreakdown.total,
                scoreBreakdown,
            })
        }
    }

    const visibleItems = items
        .filter((item) => !excludeHrefs.has(item.href))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)

    if (visibleItems.length === 0) return null

    return {
        key: "trending",
        eyebrow: "Em alta agora",
        title: "O que está puxando a conversa",
        items: visibleItems,
    }
}
