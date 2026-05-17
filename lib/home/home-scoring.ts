export type HomeScoreReason =
    | "linked_directly"
    | "same_group"
    | "artist_cast"
    | "same_topic"
    | "trending_artist"
    | "trending_group"
    | "streaming_rank"
    | "recent_article"

export type HomeScoreBreakdown = {
    base: number
    trend: number
    quality: number
    freshness: number
    rank: number
    total: number
}

const BASE_WEIGHTS: Record<HomeScoreReason, number> = {
    linked_directly: 100,
    same_group: 72,
    artist_cast: 64,
    same_topic: 58,
    trending_artist: 100,
    trending_group: 96,
    streaming_rank: 92,
    recent_article: 80,
}

function clamp(value: number, min = 0, max = Number.POSITIVE_INFINITY) {
    return Math.min(max, Math.max(min, value))
}

export function productionFreshness(year: number | null, now = new Date()) {
    if (!year) return 0
    const age = now.getFullYear() - year
    return clamp(12 - age, 0, 12)
}

export function scoreHomeCandidate({
    reason,
    trendingScore = 0,
    voteAverage = null,
    year = null,
    rank = null,
    now = new Date(),
}: {
    reason: HomeScoreReason
    trendingScore?: number | null
    voteAverage?: number | null
    year?: number | null
    rank?: number | null
    now?: Date
}): HomeScoreBreakdown {
    const base = BASE_WEIGHTS[reason]
    const trend = clamp(trendingScore ?? 0, 0, 25)
    const quality = clamp(voteAverage ?? 0, 0, 10)
    const freshness = productionFreshness(year, now)
    const rankScore = rank == null ? 0 : clamp(12 - rank, 0, 11)
    const total = base + trend + quality + freshness + rankScore

    return { base, trend, quality, freshness, rank: rankScore, total }
}
