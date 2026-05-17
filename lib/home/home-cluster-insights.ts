import type { HomeCluster } from "@/lib/home/home-clusters"
import { buildHomeRuntimeData } from "@/lib/home/home-runtime"

export type HomeClusterInsights = {
    generatedAt: string
    featuredPost: { id: string; slug: string; title: string } | null
    clusters: HomeCluster[]
    editorialMeta: {
        carousel: {
            requested: number
            selected: number
            maxPerCategory: number
            categoryCounts: Record<string, number>
            relaxedCategoryCap: boolean
        } | null
        secondary: {
            requested: number
            selected: number
            maxPerCategory: number
            categoryCounts: Record<string, number>
            relaxedCategoryCap: boolean
        } | null
        feed: {
            requested: number
            selected: number
            maxPerCategory: number
            categoryCounts: Record<string, number>
            relaxedCategoryCap: boolean
        }
    }
    composition: {
        mode: "editorial" | "watch" | "balanced"
        recentArticleCount: number
        streamingPlatformCount: number
        streamingShowCount: number
        reason: string
    }
    affinityWeights: {
        artist: number
        group: number
        production: number
    }
    articleAffinity: {
        carousel: Array<{
            id: string
            slug: string
            title: string
            score: number
            matchedSignals: Array<"artist" | "group" | "production">
        }>
        secondary: Array<{
            id: string
            slug: string
            title: string
            score: number
            matchedSignals: Array<"artist" | "group" | "production">
        }>
        feed: Array<{
            id: string
            slug: string
            title: string
            score: number
            matchedSignals: Array<"artist" | "group" | "production">
        }>
    }
}

export async function buildHomeClusterInsights(): Promise<HomeClusterInsights> {
    const runtime = await buildHomeRuntimeData()

    return {
        generatedAt: runtime.generatedAt,
        featuredPost: runtime.featuredPost
            ? { id: runtime.featuredPost.id, slug: runtime.featuredPost.slug, title: runtime.featuredPost.title }
            : null,
        clusters: [runtime.featuredCluster, runtime.trendingCluster]
            .filter((cluster): cluster is HomeCluster => cluster !== null),
        editorialMeta: runtime.editorialMeta,
        composition: runtime.composition,
        affinityWeights: runtime.affinityWeights,
        articleAffinity: runtime.articleAffinity,
    }
}
