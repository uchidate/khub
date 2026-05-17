import prisma from "@/lib/prisma"
import { scoreHomeCandidate, type HomeScoreBreakdown } from "@/lib/home/home-scoring"

type FeaturedPostSeed = {
    id: string
    category?: { slug: string } | null
    relatedArtists: Array<{ artist: { id: string; slug: string | null; nameRomanized: string; primaryImageUrl: string | null; trendingScore: number } }>
    relatedGroups: Array<{ group: { id: string; slug: string | null; name: string; profileImageUrl: string | null; trendingScore: number } }>
    relatedProductions: Array<{ production: { id: string; slug: string | null; titlePt: string; imageUrl: string | null; voteAverage: number | null; year: number | null } }>
}

export type FeaturedContextItem = {
    type: "artist" | "group" | "production" | "article"
    href: string
    title: string
    imageUrl: string | null
    reason: "linked_directly" | "same_group" | "artist_cast" | "same_topic"
    score: number
    scoreBreakdown: HomeScoreBreakdown
}

export async function buildFeaturedContext(post: FeaturedPostSeed | null | undefined): Promise<FeaturedContextItem[]> {
    if (!post) return []

    const directArtists = post.relatedArtists.map(({ artist }) => {
        const scoreBreakdown = scoreHomeCandidate({ reason: "linked_directly", trendingScore: artist.trendingScore })
        return {
            type: "artist" as const,
            href: `/artists/${artist.slug ?? artist.id}`,
            title: artist.nameRomanized,
            imageUrl: artist.primaryImageUrl,
            reason: "linked_directly" as const,
            score: scoreBreakdown.total,
            scoreBreakdown,
        }
    })
    const directGroups = post.relatedGroups.map(({ group }) => {
        const scoreBreakdown = scoreHomeCandidate({ reason: "linked_directly", trendingScore: group.trendingScore })
        return {
            type: "group" as const,
            href: `/groups/${group.slug ?? group.id}`,
            title: group.name,
            imageUrl: group.profileImageUrl,
            reason: "linked_directly" as const,
            score: scoreBreakdown.total,
            scoreBreakdown,
        }
    })
    const directProductions = post.relatedProductions.map(({ production }) => {
        const scoreBreakdown = scoreHomeCandidate({ reason: "linked_directly", voteAverage: production.voteAverage, year: production.year })
        return {
            type: "production" as const,
            href: `/productions/${production.slug ?? production.id}`,
            title: production.titlePt,
            imageUrl: production.imageUrl,
            reason: "linked_directly" as const,
            score: scoreBreakdown.total,
            scoreBreakdown,
        }
    })

    const artistIds = post.relatedArtists.map(({ artist }) => artist.id)
    const fallbackNeeded = Math.max(0, 4 - directArtists.length - directGroups.length - directProductions.length)

    const [artistGroups, artistProductions, sameTopicPosts] = fallbackNeeded > 0
        ? await Promise.all([
            artistIds.length > 0
                ? prisma.artistGroupMembership.findMany({
                    where: { artistId: { in: artistIds }, isActive: true },
                    take: 3,
                    orderBy: { group: { trendingScore: "desc" } },
                    select: {
                        group: { select: { id: true, slug: true, name: true, profileImageUrl: true, trendingScore: true } },
                    },
                }).catch(() => [])
                : [],
            artistIds.length > 0
                ? prisma.artistProduction.findMany({
                    where: {
                        artistId: { in: artistIds },
                        production: {
                            isHidden: false,
                            flaggedAsNonKorean: false,
                            isTakenDown: false,
                        },
                    },
                    take: 4,
                    orderBy: [{ production: { voteAverage: "desc" } }, { production: { year: "desc" } }],
                    select: {
                        production: { select: { id: true, slug: true, titlePt: true, imageUrl: true, voteAverage: true, year: true } },
                    },
                }).catch(() => [])
                : [],
            post.category?.slug
                ? prisma.blogPost.findMany({
                    where: {
                        id: { not: post.id },
                        status: "PUBLISHED",
                        isPrivate: false,
                        category: { slug: post.category.slug },
                    },
                    take: 4,
                    orderBy: { publishedAt: "desc" },
                    select: { slug: true, title: true, coverImageUrl: true },
                }).catch(() => [])
                : [],
        ])
        : [[], [], []]

    const fallbacks: FeaturedContextItem[] = [
        ...artistGroups.map(({ group }) => {
            const scoreBreakdown = scoreHomeCandidate({ reason: "same_group", trendingScore: group.trendingScore })
            return {
                type: "group" as const,
                href: `/groups/${group.slug ?? group.id}`,
                title: group.name,
                imageUrl: group.profileImageUrl,
                reason: "same_group" as const,
                score: scoreBreakdown.total,
                scoreBreakdown,
            }
        }),
        ...artistProductions.map(({ production }) => {
            const scoreBreakdown = scoreHomeCandidate({ reason: "artist_cast", voteAverage: production.voteAverage, year: production.year })
            return {
                type: "production" as const,
                href: `/productions/${production.slug ?? production.id}`,
                title: production.titlePt,
                imageUrl: production.imageUrl,
                reason: "artist_cast" as const,
                score: scoreBreakdown.total,
                scoreBreakdown,
            }
        }),
        ...sameTopicPosts.map((article) => {
            const scoreBreakdown = scoreHomeCandidate({ reason: "same_topic" })
            return {
                type: "article" as const,
                href: `/blog/${article.slug}`,
                title: article.title,
                imageUrl: article.coverImageUrl,
                reason: "same_topic" as const,
                score: scoreBreakdown.total,
                scoreBreakdown,
            }
        }),
    ]

    const seen = new Set<string>()
    return [...directArtists, ...directGroups, ...directProductions, ...fallbacks]
        .filter((item) => !seen.has(item.href) && seen.add(item.href))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
}
