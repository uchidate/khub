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
    }
}
