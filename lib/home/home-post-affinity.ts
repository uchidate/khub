type RelatedArtistPost = {
    relatedArtists?: Array<{ artist: { id: string } }>
}

type RelatedGroupPost = {
    relatedGroups?: Array<{ group: { id: string } }>
}

type RelatedProductionPost = {
    relatedProductions?: Array<{ production: { id: string } }>
}

export type HomeAffinitySignals = {
    artistIds: Set<string>
    groupIds: Set<string>
    productionIds: Set<string>
}

export type HomeAffinityWeights = {
    artist: number
    group: number
    production: number
}

export const DEFAULT_HOME_AFFINITY_WEIGHTS: HomeAffinityWeights = {
    artist: 3,
    group: 3,
    production: 2,
}

export type HomeAffinityPost = RelatedArtistPost & RelatedGroupPost & RelatedProductionPost

export type HomePostAffinity = {
    score: number
    matchedSignals: Array<"artist" | "group" | "production">
}

export function getHomePostAffinity(
    post: HomeAffinityPost,
    signals: HomeAffinitySignals,
    weights: HomeAffinityWeights = DEFAULT_HOME_AFFINITY_WEIGHTS,
): HomePostAffinity {
    let score = 0
    const matchedSignals: HomePostAffinity["matchedSignals"] = []
    if (post.relatedArtists?.some(({ artist }) => signals.artistIds.has(artist.id))) {
        score += weights.artist
        matchedSignals.push("artist")
    }
    if (post.relatedGroups?.some(({ group }) => signals.groupIds.has(group.id))) {
        score += weights.group
        matchedSignals.push("group")
    }
    if (post.relatedProductions?.some(({ production }) => signals.productionIds.has(production.id))) {
        score += weights.production
        matchedSignals.push("production")
    }
    return { score, matchedSignals }
}

export function getHomePostAffinityScore(
    post: HomeAffinityPost,
    signals: HomeAffinitySignals,
    weights: HomeAffinityWeights = DEFAULT_HOME_AFFINITY_WEIGHTS,
) {
    return getHomePostAffinity(post, signals, weights).score
}

export function rankPostsByHomeAffinity<T extends HomeAffinityPost>(
    posts: T[],
    signals: HomeAffinitySignals,
    weights: HomeAffinityWeights = DEFAULT_HOME_AFFINITY_WEIGHTS,
) {
    return [...posts].sort((left, right) =>
        getHomePostAffinityScore(right, signals, weights) - getHomePostAffinityScore(left, signals, weights)
    )
}
