/**
 * Configuração centralizada dos aliases e identidade visual de cada plataforma
 * de streaming. Usada em StreamingTopShows, badges em produções, e qualquer
 * outro lugar que precise identificar visualmente uma plataforma.
 */

export interface StreamingPlatformConfig {
    /** Nome de exibição (ex: "Netflix", "Disney+") */
    label: string
    /** Tailwind class para background do badge */
    bgColor: string
    /** Tailwind class para texto do badge */
    textColor: string
    /** Tailwind class para borda do card quando ativo */
    borderColor: string
    /** Tailwind class para o dot indicador ativo */
    dotColor: string
    /** Tailwind class para hover da borda do card */
    hoverBorderColor: string
    /** TMDB watch provider ID para filtro em /discover/tv (undefined = sem filtro) */
    tmdbProviderId?: number
}

export const STREAMING_CONFIG: Record<string, StreamingPlatformConfig> = {
    trending_global: {
        label:           'Trending',
        bgColor:         'bg-orange-600',
        textColor:       'text-white',
        borderColor:     'border-orange-400',
        dotColor:        'bg-orange-400',
        hoverBorderColor: 'hover:border-orange-400/60',
        tmdbProviderId:  undefined, // /trending/tv/day — sem filtro de provider
    },
    netflix_br: {
        label:           'Netflix',
        bgColor:         'bg-red-600',
        textColor:       'text-white',
        borderColor:     'border-red-500',
        dotColor:        'bg-red-500',
        hoverBorderColor: 'hover:border-red-500/60',
        tmdbProviderId:  8,
    },
    disney_br: {
        label:           'Disney+',
        bgColor:         'bg-blue-700',
        textColor:       'text-white',
        borderColor:     'border-blue-500',
        dotColor:        'bg-blue-500',
        hoverBorderColor: 'hover:border-blue-500/60',
        tmdbProviderId:  337,
    },
    prime_br: {
        label:           'Prime Video',
        bgColor:         'bg-sky-500',
        textColor:       'text-white',
        borderColor:     'border-sky-400',
        dotColor:        'bg-sky-400',
        hoverBorderColor: 'hover:border-sky-400/60',
        tmdbProviderId:  119,
    },
    apple_br: {
        label:           'Apple TV+',
        bgColor:         'bg-zinc-600',
        textColor:       'text-white',
        borderColor:     'border-zinc-400',
        dotColor:        'bg-zinc-400',
        hoverBorderColor: 'hover:border-zinc-400/60',
        tmdbProviderId:  350,
    },
    tmdb_trending: {
        label:           'K-Drama',
        bgColor:         'bg-purple-600',
        textColor:       'text-white',
        borderColor:     'border-purple-400',
        dotColor:        'bg-purple-400',
        hoverBorderColor: 'hover:border-purple-400/60',
    },
    internal_production: {
        label:           'Em Alta',
        bgColor:         'bg-orange-600',
        textColor:       'text-white',
        borderColor:     'border-orange-400',
        dotColor:        'bg-orange-400',
        hoverBorderColor: 'hover:border-orange-400/60',
    },
}

/** Ordem de exibição dos tabs na UI da seção StreamingTopShows */
export const STREAMING_TAB_ORDER = [
    'trending_global',
    'netflix_br',
    'disney_br',
    'prime_br',
    'apple_br',
]

/** Retorna a config de uma plataforma ou um fallback genérico */
export function getStreamingConfig(source: string): StreamingPlatformConfig {
    return STREAMING_CONFIG[source] ?? {
        label:           source,
        bgColor:         'bg-zinc-700',
        textColor:       'text-white',
        borderColor:     'border-zinc-500',
        dotColor:        'bg-zinc-500',
        hoverBorderColor: 'hover:border-zinc-500/60',
    }
}
