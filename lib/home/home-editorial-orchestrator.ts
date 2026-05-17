import type { CategorizedScoringInput } from "@/lib/blog/scoring"

export type EditorialSelectionMeta = {
    requested: number
    selected: number
    maxPerCategory: number
    categoryCounts: Record<string, number>
    relaxedCategoryCap: boolean
}

function getPostId<T extends CategorizedScoringInput>(post: T, fallbackIndex: number) {
    return "id" in post && typeof post.id === "string"
        ? post.id
        : `${post.publishedAt?.toISOString() ?? ""}:${fallbackIndex}`
}

export function orchestrateEditorialSelection<T extends CategorizedScoringInput>({
    posts,
    count,
    maxPerCategory,
    excludeIds = new Set<string>(),
}: {
    posts: T[]
    count: number
    maxPerCategory: number
    excludeIds?: Set<string>
}): { items: T[]; meta: EditorialSelectionMeta } {
    const selected: T[] = []
    const selectedIds = new Set<string>(excludeIds)
    const categoryCounts = new Map<string, number>()
    let relaxedCategoryCap = false

    posts.forEach((post, index) => {
        if (selected.length >= count) return
        const id = getPostId(post, index)
        if (selectedIds.has(id)) return

        const category = post.category?.slug ?? "__uncategorized"
        if ((categoryCounts.get(category) ?? 0) >= maxPerCategory) return

        selected.push(post)
        selectedIds.add(id)
        categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1)
    })

    posts.forEach((post, index) => {
        if (selected.length >= count) return
        const id = getPostId(post, index)
        if (selectedIds.has(id)) return

        relaxedCategoryCap = true
        const category = post.category?.slug ?? "__uncategorized"
        selected.push(post)
        selectedIds.add(id)
        categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1)
    })

    return {
        items: selected,
        meta: {
            requested: count,
            selected: selected.length,
            maxPerCategory,
            categoryCounts: Object.fromEntries(categoryCounts),
            relaxedCategoryCap,
        },
    }
}
