import prisma from '@/lib/prisma'
import { applyAgeRatingFilter } from '@/lib/utils/age-rating-filter'
import type { ArchiveHub } from '@/lib/seo/archive-hubs'
import type { HubArtistItem, HubGroupItem, HubItem, HubProductionItem } from '@/components/seo/HubPageContent'

const SINGER_ROLES = ['CANTOR', 'CANTORA', 'Cantor', 'Cantora', 'Cantor/Cantora', 'SINGER', 'Singer', 'VOCALIST', 'Vocalist', 'RAPPER', 'Rapper', 'IDOL', 'Idol']
const ACTOR_ROLES = ['ATOR', 'ATRIZ', 'Ator', 'Atriz', 'Ator/Atriz', 'ACTOR', 'ACTRESS', 'Actor', 'Actress']

export const MIN_INDEXABLE_HUB_ITEMS = 8

export function hasIndexableHubInventory(items: HubItem[]) {
    return items.length >= MIN_INDEXABLE_HUB_ITEMS
}

const PRODUCTION_PLATFORM_FILTERS = {
    'doramas-coreanos-netflix': {
        OR: [
            { streamingPlatforms: { has: 'Netflix' } },
            { network: { contains: 'Netflix', mode: 'insensitive' as const } },
            { sourceUrls: { has: 'Netflix' } },
        ],
    },
    'doramas-amazon-prime': {
        OR: [
            { streamingPlatforms: { has: 'Amazon Prime Video' } },
            { streamingPlatforms: { has: 'Prime Video' } },
            { network: { contains: 'Amazon', mode: 'insensitive' as const } },
        ],
    },
    'doramas-disney-plus': {
        OR: [
            { streamingPlatforms: { has: 'Disney+' } },
            { streamingPlatforms: { has: 'Disney Plus' } },
            { network: { contains: 'Disney', mode: 'insensitive' as const } },
        ],
    },
    'doramas-apple-tv-plus': {
        OR: [
            { streamingPlatforms: { has: 'Apple TV+' } },
            { streamingPlatforms: { has: 'Apple TV Plus' } },
            { network: { contains: 'Apple', mode: 'insensitive' as const } },
        ],
    },
    'doramas-viki': {
        OR: [
            { streamingPlatforms: { has: 'Viki' } },
            { streamingPlatforms: { has: 'Rakuten Viki' } },
            { network: { contains: 'Viki', mode: 'insensitive' as const } },
        ],
    },
    'doramas-kocowa': {
        OR: [
            { streamingPlatforms: { has: 'Kocowa' } },
            { streamingPlatforms: { has: 'KOCOWA' } },
            { network: { contains: 'Kocowa', mode: 'insensitive' as const } },
        ],
    },
} satisfies Record<string, Record<string, unknown>>

const PRODUCTION_GENRE_FILTERS = {
    'doramas-historicos-coreanos': {
        OR: [
            { tags: { hasSome: ['sageuk', 'Sageuk', 'histórico', 'Histórico', 'historico', 'period', 'joseon', 'Joseon'] } },
            { type: { in: ['Sageuk', 'sageuk', 'K-Drama Histórico', 'Historical'] } },
        ],
    },
    'doramas-romanticos': {
        OR: [
            { tags: { hasSome: ['romance', 'romântico', 'romantico', 'Romance', 'Romantic', 'romantic comedy', 'rom-com'] } },
            { type: { contains: 'romance', mode: 'insensitive' as const } },
        ],
    },
    'doramas-terror-coreanos': {
        OR: [
            { tags: { hasSome: ['terror', 'horror', 'Horror', 'scary', 'monster', 'monstro', 'sobrenatural'] } },
            { type: { contains: 'horror', mode: 'insensitive' as const } },
            { type: { contains: 'terror', mode: 'insensitive' as const } },
        ],
    },
    'doramas-thriller-coreanos': {
        OR: [
            { tags: { hasSome: ['thriller', 'suspense', 'mistério', 'misterio', 'mystery', 'psychological'] } },
            { type: { contains: 'thriller', mode: 'insensitive' as const } },
            { type: { contains: 'suspense', mode: 'insensitive' as const } },
        ],
    },
    'doramas-acao-coreanos': {
        OR: [
            { tags: { hasSome: ['ação', 'acao', 'action', 'espionagem', 'spy', 'luta', 'fight'] } },
            { type: { contains: 'ação', mode: 'insensitive' as const } },
            { type: { contains: 'action', mode: 'insensitive' as const } },
        ],
    },
    'doramas-comedia-coreanos': {
        OR: [
            { tags: { hasSome: ['comédia', 'comedia', 'comedy', 'rom-com', 'sitcom'] } },
            { type: { contains: 'comédia', mode: 'insensitive' as const } },
            { type: { contains: 'comedy', mode: 'insensitive' as const } },
        ],
    },
    'doramas-fantasia-coreanos': {
        OR: [
            { tags: { hasSome: ['fantasia', 'fantasy', 'sobrenatural', 'supernatural', 'magic', 'gumiho', 'dokkaebi'] } },
            { type: { contains: 'fantasia', mode: 'insensitive' as const } },
            { type: { contains: 'fantasy', mode: 'insensitive' as const } },
        ],
    },
    'doramas-medicos-coreanos': {
        OR: [
            { tags: { hasSome: ['médico', 'medico', 'medical', 'hospital', 'doctor', 'doctors', 'cirurgia'] } },
            { type: { contains: 'medical', mode: 'insensitive' as const } },
            { type: { contains: 'hospital', mode: 'insensitive' as const } },
        ],
    },
    'doramas-escolares-coreanos': {
        OR: [
            { tags: { hasSome: ['school', 'escola', 'colegial', 'high school', 'universidade', 'college', 'youth', 'juventude'] } },
            { type: { contains: 'school', mode: 'insensitive' as const } },
            { type: { contains: 'youth', mode: 'insensitive' as const } },
        ],
    },
    'doramas-policiais-coreanos': {
        OR: [
            { tags: { hasSome: ['crime', 'policial', 'police', 'detective', 'detetive', 'investigação', 'investigacao', 'law', 'prosecutor'] } },
            { type: { contains: 'crime', mode: 'insensitive' as const } },
            { type: { contains: 'police', mode: 'insensitive' as const } },
        ],
    },
    'doramas-de-vinganca-coreanos': {
        OR: [
            { tags: { hasSome: ['vingança', 'vinganca', 'revenge', 'revanche', 'bullying', 'justice', 'justiça'] } },
            { type: { contains: 'revenge', mode: 'insensitive' as const } },
            { type: { contains: 'vingança', mode: 'insensitive' as const } },
        ],
    },
    'doramas-zumbis-coreanos': {
        OR: [
            { tags: { hasSome: ['zumbi', 'zombie', 'zombies', 'infection', 'infecção', 'epidemia', 'survival'] } },
            { type: { contains: 'zombie', mode: 'insensitive' as const } },
            { type: { contains: 'zumbi', mode: 'insensitive' as const } },
        ],
    },
    'doramas-viagem-no-tempo-coreanos': {
        OR: [
            { tags: { hasSome: ['viagem no tempo', 'time travel', 'timeline', 'passado', 'future', 'futuro', 'destino', 'reencarnação'] } },
            { type: { contains: 'time travel', mode: 'insensitive' as const } },
            { type: { contains: 'tempo', mode: 'insensitive' as const } },
        ],
    },
    'doramas-coreanos-para-iniciantes': {
        OR: [
            { voteAverage: { gte: 8 } },
            { voteCount: { gte: 500 } },
            { tags: { hasSome: ['popular', 'iniciante', 'beginner', 'clássico', 'classico', 'must watch'] } },
        ],
    },
    'doramas-coreanos-curtos': {
        OR: [
            { episodeCount: { lte: 12 } },
            { tags: { hasSome: ['curto', 'short', 'minissérie', 'miniseries', 'web drama'] } },
        ],
    },
    'doramas-coreanos-com-final-feliz': {
        OR: [
            { tags: { hasSome: ['final feliz', 'happy ending', 'feel good', 'comfort drama', 'conforto', 'leve'] } },
            { type: { contains: 'happy ending', mode: 'insensitive' as const } },
        ],
    },
    'doramas-coreanos-tristes': {
        OR: [
            { tags: { hasSome: ['triste', 'sad', 'melodrama', 'emocionante', 'choro', 'tearjerker', 'drama familiar'] } },
            { type: { contains: 'melodrama', mode: 'insensitive' as const } },
        ],
    },
    'doramas-coreanos-baseados-em-webtoon': {
        OR: [
            { tags: { hasSome: ['webtoon', 'Webtoon', 'manhwa', 'quadrinho digital', 'adaptação', 'adaptacao'] } },
            { sourceUrls: { has: 'webtoon' } },
            { type: { contains: 'webtoon', mode: 'insensitive' as const } },
        ],
    },
    'doramas-coreanos-melhor-avaliados': {
        OR: [
            { voteAverage: { gte: 8.5 } },
            { editorialRating: { gte: 8.5 } },
            { tags: { hasSome: ['melhor avaliado', 'top rated', 'aclamado', 'critically acclaimed'] } },
        ],
    },
    'doramas-coreanos-populares': {
        OR: [
            { voteCount: { gte: 1000 } },
            { tags: { hasSome: ['popular', 'famoso', 'hit', 'viral', 'mainstream'] } },
        ],
    },
    'doramas-coreanos-recentes': {
        OR: [
            { year: { gte: 2024 } },
            { releaseDate: { gte: new Date('2024-01-01T00:00:00.000Z') } },
            { tags: { hasSome: ['lançamento', 'lancamento', 'recent', 'novo', 'new'] } },
        ],
    },
    'doramas-coreanos-longos': {
        OR: [
            { episodeCount: { gte: 24 } },
            { tags: { hasSome: ['longo', 'long', 'family drama', 'drama familiar', 'daily drama'] } },
        ],
    },
    'filmes-coreanos': {
        OR: [
            { tmdbType: 'movie' },
            { type: { contains: 'filme', mode: 'insensitive' as const } },
            { type: { contains: 'movie', mode: 'insensitive' as const } },
        ],
    },
} satisfies Record<string, Record<string, unknown>>

export async function getHubItems(hub: ArchiveHub): Promise<HubItem[]> {
    if (process.env.SKIP_BUILD_STATIC_GENERATION) return []

    if (hub.kind === 'artists') {
        const commonWhere = {
            flaggedAsNonKorean: false,
            isHidden: false,
            slug: { not: null },
            OR: [{ bio: { not: null } }, { primaryImageUrl: { not: null } }],
        }

        const where = hub.groupSlug
            ? {
                ...commonWhere,
                memberships: { some: { group: { slug: hub.groupSlug } } },
            }
            : hub.agencyName
            ? {
                ...commonWhere,
                agency: { name: hub.agencyName },
            }
            : hub.slug === 'idols-que-atuam-em-doramas'
            ? {
                ...commonWhere,
                AND: [
                    { roles: { hasSome: SINGER_ROLES } },
                    { roles: { hasSome: ACTOR_ROLES } },
                    { productions: { some: { production: { isHidden: false, flaggedAsNonKorean: false } } } },
                ],
            }
            : hub.slug === 'idols-atores-coreanos'
            ? {
                ...commonWhere,
                AND: [
                    { roles: { hasSome: SINGER_ROLES } },
                    { roles: { hasSome: ACTOR_ROLES } },
                    { memberships: { some: { isActive: true } } },
                    { productions: { some: { production: { isHidden: false, flaggedAsNonKorean: false } } } },
                ],
            }
            : hub.slug === 'atrizes-de-doramas-romanticos'
            ? {
                ...commonWhere,
                gender: 1,
                roles: { hasSome: ACTOR_ROLES },
                productions: {
                    some: {
                        production: {
                            isHidden: false,
                            flaggedAsNonKorean: false,
                            OR: [
                                { tags: { hasSome: ['romance', 'romântico', 'romantico', 'Romance', 'Romantic', 'romantic comedy', 'rom-com'] } },
                                { type: { contains: 'romance', mode: 'insensitive' as const } },
                            ],
                        },
                    },
                },
            }
            : hub.slug === 'artistas-solo-kpop'
                ? {
                    ...commonWhere,
                    roles: { hasSome: SINGER_ROLES },
                    memberships: { none: { isActive: true } },
                }
                : hub.slug === 'cantores-kpop'
                ? {
                    ...commonWhere,
                    gender: 2,
                    roles: { hasSome: SINGER_ROLES },
                }
                : hub.slug === 'atrizes-coreanas'
                ? {
                    ...commonWhere,
                    gender: 1,
                    roles: { hasSome: ACTOR_ROLES },
                }
                : hub.slug === 'atores-coreanos'
                ? {
                    ...commonWhere,
                    gender: 2,
                    roles: { hasSome: ACTOR_ROLES },
                }
                : hub.slug === 'kpop-idols-famosos'
                ? {
                    ...commonWhere,
                    roles: { hasSome: SINGER_ROLES },
                }
                : {
                    ...commonWhere,
                    gender: 1,
                    roles: { hasSome: SINGER_ROLES },
                }

        return prisma.artist.findMany({
            where,
            select: {
                id: true,
                slug: true,
                nameRomanized: true,
                nameHangul: true,
                primaryImageUrl: true,
                roles: true,
                updatedAt: true,
                memberships: {
                    where: { isActive: true },
                    select: { group: { select: { id: true, slug: true, name: true } } },
                    take: 1,
                },
            },
            orderBy: hub.groupSlug
                ? [{ nameRomanized: 'asc' }]
                : [{ trendingScore: 'desc' }, { nameRomanized: 'asc' }],
            take: 48,
        }) as Promise<HubArtistItem[]>
    }

    if (hub.kind === 'groups') {
        const isMaleHub = hub.slug === 'grupos-masculinos-kpop'
        const is4thGen = hub.slug === 'grupos-kpop-4a-geracao'
        const groupWhere = hub.agencyName
            ? { isHidden: false, slug: { not: null }, agency: { name: hub.agencyName } }
            : is4thGen
            ? { isHidden: false, slug: { not: null }, debutDate: { gte: new Date('2018-01-01') } }
            : { isHidden: false, slug: { not: null }, members: { some: { isActive: true, artist: { gender: isMaleHub ? 2 : 1 } } } }
        const groups = await prisma.musicalGroup.findMany({
            where: groupWhere,
            select: {
                id: true,
                slug: true,
                name: true,
                nameHangul: true,
                profileImageUrl: true,
                debutDate: true,
                updatedAt: true,
                members: {
                    where: { isActive: true },
                    select: { artist: { select: { gender: true } } },
                },
            },
            orderBy: [{ trendingScore: 'desc' }, { name: 'asc' }],
            take: 64,
        })

        return groups
            .filter(group => {
                if (hub.agencyName || is4thGen) return true
                const female = group.members.filter(member => member.artist.gender === 1).length
                const male = group.members.filter(member => member.artist.gender === 2).length
                return isMaleHub ? male >= Math.max(1, female) : female >= Math.max(1, male)
            })
            .slice(0, 48) as HubGroupItem[]
    }

    const ageFilter = await applyAgeRatingFilter().catch(() => ({}))

    const productionFilter =
        PRODUCTION_PLATFORM_FILTERS[hub.slug as keyof typeof PRODUCTION_PLATFORM_FILTERS] ??
        PRODUCTION_GENRE_FILTERS[hub.slug as keyof typeof PRODUCTION_GENRE_FILTERS] ??
        {}

    const yearFilter = hub.year ? { year: hub.year } : {}
    const isMovieHub = hub.slug === 'filmes-coreanos'
    const mediaTypeFilter = isMovieHub
        ? [{ type: { contains: 'filme', mode: 'insensitive' as const } }, { tmdbType: 'movie' }]
        : [{ type: 'SERIE' }, { tmdbType: 'tv' }]

    return prisma.production.findMany({
        where: {
            ...ageFilter,
            ...yearFilter,
            flaggedAsNonKorean: false,
            isHidden: false,
            slug: { not: null },
            OR: mediaTypeFilter,
            AND: hub.year
                ? [{ OR: [{ isAdultContent: null }, { isAdultContent: false }] }]
                : [
                    { OR: [{ isAdultContent: null }, { isAdultContent: false }] },
                    productionFilter,
                ],
        },
        select: {
            id: true,
            slug: true,
            titlePt: true,
            titleKr: true,
            imageUrl: true,
            year: true,
            type: true,
            voteAverage: true,
            updatedAt: true,
        },
        orderBy: [{ voteAverage: 'desc' }, { year: 'desc' }],
        take: 48,
    }) as Promise<HubProductionItem[]>
}
