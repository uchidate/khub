export type HomeCompositionMode = "editorial" | "watch" | "balanced"

export type HomeComposition = {
    mode: HomeCompositionMode
    recentArticleCount: number
    streamingPlatformCount: number
    streamingShowCount: number
    reason: string
}

export function buildHomeComposition({
    recentArticleCount,
    streamingPlatformCount,
    streamingShowCount,
}: {
    recentArticleCount: number
    streamingPlatformCount: number
    streamingShowCount: number
}): HomeComposition {
    if (recentArticleCount >= 6) {
        return {
            mode: "editorial",
            recentArticleCount,
            streamingPlatformCount,
            streamingShowCount,
            reason: "Muitas publicações recentes tornam leitura a prioridade do dia.",
        }
    }

    if (streamingPlatformCount >= 2 && streamingShowCount >= 6) {
        return {
            mode: "watch",
            recentArticleCount,
            streamingPlatformCount,
            streamingShowCount,
            reason: "Há movimento suficiente nas plataformas para priorizar o radar audiovisual.",
        }
    }

    return {
        mode: "balanced",
        recentArticleCount,
        streamingPlatformCount,
        streamingShowCount,
        reason: "Nenhum sinal domina o dia, então a home mantém uma composição equilibrada.",
    }
}
