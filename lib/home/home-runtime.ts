import prisma from "@/lib/prisma"
import { rankPosts } from "@/lib/blog/scoring"
import { HOME_FEED_CATEGORIES } from "@/lib/config/categories"
import { buildFeaturedContext } from "@/lib/home/featured-context"
import { buildFeaturedCluster, buildTrendingCluster } from "@/lib/home/home-clusters"
import {
    collectHomeEntityKeys,
    homeEntityKey,
    selectDistinctItems,
    selectDistinctRotatingItem,
} from "@/lib/home/home-diversity"
import { orchestrateEditorialSelection } from "@/lib/home/home-editorial-orchestrator"
import { buildHomeComposition } from "@/lib/home/home-composition"
import { getHomePostAffinity, rankPostsByHomeAffinity } from "@/lib/home/home-post-affinity"

const POST_SELECT = {
    id: true, slug: true, title: true, excerpt: true,
    coverImageUrl: true, publishedAt: true, readingTimeMin: true,
    featured: true, viewCount: true,
    category: { select: { name: true, slug: true } },
    tags: true,
    relatedArtists: {
        take: 2,
        select: {
            artist: { select: { id: true, slug: true, nameRomanized: true, primaryImageUrl: true, trendingScore: true } },
        },
    },
    relatedGroups: {
        take: 2,
        select: {
            group: { select: { id: true, slug: true, name: true, profileImageUrl: true, trendingScore: true } },
        },
    },
    relatedProductions: {
        take: 2,
        select: {
            production: { select: { id: true, slug: true, titlePt: true, imageUrl: true, voteAverage: true, year: true } },
        },
    },
} as const

function getWeekOfYear(date: Date) {
    const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    const day = utcDate.getUTCDay() || 7
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day)
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1))
    return Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function serializePost<T extends { publishedAt: Date | null }>(post: T) {
    return { ...post, publishedAt: post.publishedAt?.toISOString() ?? null }
}

function hasRenderableCover(post: { coverImageUrl?: string | null }) {
    const imageUrl = post.coverImageUrl?.trim()
    if (!imageUrl) return false
    return /^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("/")
}

function preferRenderableCovers<T extends { coverImageUrl?: string | null }>(posts: T[]) {
    return [...posts].sort((a, b) => Number(hasRenderableCover(b)) - Number(hasRenderableCover(a)))
}

function getDayOfYear(date: Date) {
    const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0))
    const diff = date.getTime() - start.getTime()
    const oneDay = 1000 * 60 * 60 * 24
    return Math.floor(diff / oneDay)
}

export async function buildHomeRuntimeData(now = new Date()) {
    const [
        trendingArtists,
        streamingShowsRaw,
        trendingGroupsRaw,
        settings,
    ] = await Promise.all([
        prisma.artist.findMany({
            where: { flaggedAsNonKorean: false, isHidden: false, nameRomanized: { not: "" } },
            take: 12,
            orderBy: { trendingScore: "desc" },
            select: {
                id: true, slug: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true,
                roles: true, gender: true, trendingScore: true, viewCount: true,
                trendingRank: true, trendingRankPrev: true, trendingBadgeOverride: true,
                createdAt: true,
                agency: { select: { name: true } },
            },
        }).catch(() => []),
        prisma.streamingShow.findMany({
            where: { expiresAt: { gt: now } },
            take: 100,
            select: {
                source: true, rank: true, showTitle: true, tmdbId: true,
                posterUrl: true, year: true, voteAverage: true, isKorean: true,
                productionId: true,
                production: { select: { titlePt: true } },
            },
            orderBy: [{ source: "asc" }, { rank: "asc" }],
        }).catch(() => []),
        prisma.musicalGroup.findMany({
            where: { isHidden: false, trendingScore: { gt: 0 } },
            take: 16,
            orderBy: { trendingScore: "desc" },
            select: {
                id: true, slug: true, name: true, nameHangul: true, profileImageUrl: true,
                officialColor: true, fanClubName: true, trendingScore: true,
                agency: { select: { name: true } },
            },
        }).catch(() => []),
        prisma.systemSettings.findUnique({ where: { id: "singleton" } }).catch(() => null),
    ])

    const slottedIds = new Set<string>()
    if (settings?.homeFeaturedPostId) slottedIds.add(settings.homeFeaturedPostId)
    settings?.homeSecondaryPostIds?.forEach((id) => slottedIds.add(id))
    settings?.homeCarouselPostIds?.forEach((id) => slottedIds.add(id))

    const [slottedPostsRaw, fallbackPostsRaw] = await Promise.all([
        slottedIds.size > 0
            ? prisma.blogPost.findMany({
                where: { id: { in: Array.from(slottedIds) }, status: "PUBLISHED" },
                select: POST_SELECT,
            }).catch(() => [])
            : [],
        Promise.all([
            prisma.blogPost.findMany({
                where: {
                    status: "PUBLISHED",
                    isPrivate: false,
                    ...(slottedIds.size > 0 ? { id: { notIn: Array.from(slottedIds) } } : {}),
                },
                take: 30,
                orderBy: { publishedAt: "desc" },
                select: POST_SELECT,
            }).catch(() => []),
            prisma.blogPost.findMany({
                where: {
                    status: "PUBLISHED",
                    isPrivate: false,
                    publishedAt: { gte: new Date(now.getTime() - 60 * 86_400_000) },
                    ...(slottedIds.size > 0 ? { id: { notIn: Array.from(slottedIds) } } : {}),
                },
                take: 10,
                orderBy: { viewCount: "desc" },
                select: POST_SELECT,
            }).catch(() => []),
            Promise.all(
                HOME_FEED_CATEGORIES.map((slug) =>
                    prisma.blogPost.findMany({
                        where: {
                            status: "PUBLISHED",
                            isPrivate: false,
                            category: { slug },
                            ...(slottedIds.size > 0 ? { id: { notIn: Array.from(slottedIds) } } : {}),
                        },
                        take: 8,
                        orderBy: { publishedAt: "desc" },
                        select: POST_SELECT,
                    }).catch(() => [])
                )
            ).then((postsByCategory) => postsByCategory.flat()),
        ]).then(([recent, trending, categoryLatest]) => {
            const seen = new Set<string>()
            const merged = [...recent, ...trending, ...categoryLatest]
                .filter((post) => !seen.has(post.id) && seen.add(post.id))
            return rankPosts(merged)
        }),
    ])

    const slottedById = Object.fromEntries(slottedPostsRaw.map((post) => [post.id, post]))
    const affinitySignals = {
        artistIds: new Set(trendingArtists.slice(0, 3).map((artist) => artist.id)),
        groupIds: new Set(trendingGroupsRaw.slice(0, 3).map((group) => group.id)),
        productionIds: new Set(
            streamingShowsRaw
                .map((show) => show.productionId)
                .filter((productionId): productionId is string => Boolean(productionId))
                .slice(0, 5)
        ),
    }
    const affinityWeights = {
        artist: settings?.homeAffinityArtistWeight ?? 3,
        group: settings?.homeAffinityGroupWeight ?? 3,
        production: settings?.homeAffinityProductionWeight ?? 2,
    }
    const affinityRankedFallbackPosts = preferRenderableCovers(
        rankPostsByHomeAffinity(fallbackPostsRaw, affinitySignals, affinityWeights)
    )
    const carouselSelection = settings?.homeCarouselPostIds?.length
        ? {
            items: settings.homeCarouselPostIds.map((id) => slottedById[id]).filter(Boolean).slice(0, 5),
            meta: null,
        }
        : orchestrateEditorialSelection({
            posts: affinityRankedFallbackPosts,
            count: 5,
            maxPerCategory: 2,
        })
    const carouselPosts = carouselSelection.items
    const carouselIds = new Set(carouselPosts.map((post) => post.id))
    const fallback = affinityRankedFallbackPosts.filter((post) => !carouselIds.has(post.id))
    const featuredPost = settings?.homeFeaturedPostId
        ? (
            hasRenderableCover(slottedById[settings.homeFeaturedPostId])
                ? slottedById[settings.homeFeaturedPostId]
                : fallback.find(hasRenderableCover) ?? slottedById[settings.homeFeaturedPostId] ?? fallback[0]
        )
        : fallback[0]
    const featuredContext = await buildFeaturedContext(featuredPost)
    const featuredCluster = buildFeaturedCluster(featuredContext)

    const featuredId = featuredPost?.id
    const secondarySelection = settings?.homeSecondaryPostIds?.length
        ? {
            items: settings.homeSecondaryPostIds.map((id) => slottedById[id]).filter(Boolean).slice(0, 4),
            meta: null,
        }
        : orchestrateEditorialSelection({
            posts: fallback,
            count: 4,
            maxPerCategory: 2,
            excludeIds: featuredId ? new Set([featuredId]) : new Set<string>(),
        })
    const secondaryPosts = secondarySelection.items
    const secondaryIds = new Set(secondaryPosts.map((post) => post.id))
    const feedCandidates = affinityRankedFallbackPosts.filter(
        (post) => !carouselIds.has(post.id) && post.id !== featuredId && !secondaryIds.has(post.id)
    )
    const feedSelection = orchestrateEditorialSelection({
        posts: feedCandidates,
        count: 12,
        maxPerCategory: 3,
    })
    const feedPosts = feedSelection.items
    const recentArticleCutoff = new Date(now.getTime() - 7 * 86_400_000)
    const recentArticleCount = fallbackPostsRaw.filter((post) =>
        post.publishedAt != null && post.publishedAt >= recentArticleCutoff
    ).length
    const streamingPlatformCount = new Set(streamingShowsRaw.map((show) => show.source)).size
    const composition = buildHomeComposition({
        recentArticleCount,
        streamingPlatformCount,
        streamingShowCount: streamingShowsRaw.length,
    })

    const spotlightCandidates = trendingArtists.slice(0, 8)
    const spotlightArtist = spotlightCandidates.length > 0
        ? spotlightCandidates[(getWeekOfYear(now) - 1) % spotlightCandidates.length]
        : null
    const spotlightProduction = spotlightArtist
        ? await prisma.production.findFirst({
            where: {
                isHidden: false,
                isTakenDown: false,
                flaggedAsNonKorean: false,
                year: { not: null },
                artists: { some: { artistId: spotlightArtist.id } },
            },
            orderBy: [
                { releaseDate: { sort: "desc", nulls: "last" } },
                { year: "desc" },
                { createdAt: "desc" },
            ],
            select: { id: true, slug: true, titlePt: true, type: true, year: true, imageUrl: true, voteAverage: true },
        }).catch(() => null)
        : null

    const allowAdult = settings?.allowAdultContent ?? false
    const ageFilter = allowAdult ? {} : {
        AND: [
            { OR: [{ ageRating: null }, { ageRating: { not: "18" } }] },
            { OR: [{ isAdultContent: null }, { isAdultContent: false }] },
        ],
    }
    const latestProductions = await prisma.production.findMany({
        where: { isHidden: false, flaggedAsNonKorean: false, ...ageFilter },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, slug: true, titlePt: true, type: true, year: true, imageUrl: true, voteAverage: true },
    }).catch(() => [])

    const topStreamingShowRaw = streamingShowsRaw
        .filter((show) => show.productionId)
        .sort((left, right) => left.rank - right.rank)[0] ?? null
    const topStreamingShow = topStreamingShowRaw
        ? {
            id: topStreamingShowRaw.productionId ?? undefined,
            title: topStreamingShowRaw.production?.titlePt ?? topStreamingShowRaw.showTitle,
            posterUrl: topStreamingShowRaw.posterUrl,
            year: topStreamingShowRaw.year,
            rank: topStreamingShowRaw.rank,
        }
        : null
    const dayIndex = getDayOfYear(now)
    const reservedEntityKeys = collectHomeEntityKeys(featuredCluster?.items ?? [])
    if (trendingArtists[0]) {
        reservedEntityKeys.add(homeEntityKey("artist", `/artists/${trendingArtists[0].slug ?? trendingArtists[0].id}`))
    }
    if (trendingGroupsRaw[0]) {
        reservedEntityKeys.add(homeEntityKey("group", `/groups/${trendingGroupsRaw[0].slug ?? trendingGroupsRaw[0].id}`))
    }
    if (topStreamingShow?.id) {
        reservedEntityKeys.add(homeEntityKey("production", `/productions/${topStreamingShow.id}`))
    }

    const randomArtist = selectDistinctRotatingItem({
        items: trendingArtists,
        getKey: (artist) => homeEntityKey("artist", `/artists/${artist.slug ?? artist.id}`),
        excludedKeys: reservedEntityKeys,
        startIndex: dayIndex,
    })
    const randomGroup = selectDistinctRotatingItem({
        items: trendingGroupsRaw,
        getKey: (group) => homeEntityKey("group", `/groups/${group.slug ?? group.id}`),
        excludedKeys: reservedEntityKeys,
        startIndex: dayIndex + 1,
    })
    const randomProduction = selectDistinctRotatingItem({
        items: latestProductions,
        getKey: (production) => homeEntityKey("production", `/productions/${production.slug ?? production.id}`),
        excludedKeys: reservedEntityKeys,
        startIndex: dayIndex + 2,
    })
    const watchProductions = selectDistinctItems({
        items: latestProductions,
        getKey: (production) => homeEntityKey("production", `/productions/${production.slug ?? production.id}`),
        excludedKeys: reservedEntityKeys,
        limit: 5,
    })
    const trendingCluster = await buildTrendingCluster({
        artist: trendingArtists[0] ?? null,
        group: trendingGroupsRaw[0] ?? null,
        production: topStreamingShow
            ? {
                id: topStreamingShow.id,
                title: topStreamingShow.title,
                posterUrl: topStreamingShow.posterUrl,
                rank: topStreamingShow.rank,
            }
            : randomProduction
                ? {
                    id: randomProduction.id,
                    title: randomProduction.titlePt,
                    posterUrl: randomProduction.imageUrl,
                    rank: null,
                }
                : null,
        excludeHrefs: new Set([
            trendingArtists[0] ? `/artists/${trendingArtists[0].slug ?? trendingArtists[0].id}` : "",
            trendingGroupsRaw[0] ? `/groups/${trendingGroupsRaw[0].slug ?? trendingGroupsRaw[0].id}` : "",
            topStreamingShow?.id ? `/productions/${topStreamingShow.id}` : "",
        ].filter(Boolean)),
    })

    return {
        generatedAt: now.toISOString(),
        trendingArtists,
        featuredPost: featuredPost ? serializePost(featuredPost) : null,
        carouselPosts: carouselPosts.map(serializePost),
        secondaryPosts: secondaryPosts.map(serializePost),
        feedPosts: feedPosts.map(serializePost),
        streamingShowsRaw,
        trendingGroups: trendingGroupsRaw,
        spotlightArtist,
        spotlightProduction,
        latestProductions,
        watchProductions,
        randomArtist,
        randomGroup,
        randomProduction,
        topStreamingShow,
        featuredContext,
        featuredCluster,
        trendingCluster,
        composition,
        affinitySignals: {
            artistIds: Array.from(affinitySignals.artistIds),
            groupIds: Array.from(affinitySignals.groupIds),
            productionIds: Array.from(affinitySignals.productionIds),
        },
        affinityWeights,
        articleAffinity: {
            carousel: carouselPosts.map((post) => ({
                id: post.id,
                slug: post.slug,
                title: post.title,
                ...getHomePostAffinity(post, affinitySignals, affinityWeights),
            })),
            secondary: secondaryPosts.map((post) => ({
                id: post.id,
                slug: post.slug,
                title: post.title,
                ...getHomePostAffinity(post, affinitySignals, affinityWeights),
            })),
            feed: feedPosts.map((post) => ({
                id: post.id,
                slug: post.slug,
                title: post.title,
                ...getHomePostAffinity(post, affinitySignals, affinityWeights),
            })),
        },
        editorialMeta: {
            carousel: carouselSelection.meta,
            secondary: secondarySelection.meta,
            feed: feedSelection.meta,
        },
    }
}

export type HomeRuntimeData = Awaited<ReturnType<typeof buildHomeRuntimeData>>
