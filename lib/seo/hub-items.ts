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

const PRODUCTION_NETWORK_FILTERS = {
    'doramas-tvn': { network: 'tvN' },
    'doramas-sbs': { network: 'SBS' },
    'doramas-mbc': { OR: [{ network: 'MBC' }, { network: 'MBC every1' }] },
    'doramas-kbs': { OR: [{ network: 'KBS2' }, { network: 'KBS1' }] },
    'doramas-jtbc': { network: 'JTBC' },
    'doramas-tving': { OR: [{ network: 'TVING' }, { streamingPlatforms: { has: 'TVING' } }] },
    'doramas-ocn': { network: 'OCN' },
    'doramas-ena': { network: 'ENA' },
} satisfies Record<string, Record<string, unknown>>

const PRODUCTION_GENRE_FILTERS = {
    'doramas-historicos-coreanos': {
        OR: [
            { tags: { hasSome: ['History', 'Histórico', 'sageuk', 'Sageuk', 'histórico', 'historico', 'period', 'joseon', 'Joseon'] } },
            { type: { in: ['Sageuk', 'sageuk', 'K-Drama Histórico', 'Historical'] } },
            { synopsis: { contains: 'Joseon', mode: 'insensitive' as const } },
            { synopsis: { contains: 'dinastia', mode: 'insensitive' as const } },
        ],
    },
    'doramas-romanticos': {
        OR: [
            { tags: { hasSome: ['Romance', 'Rom-com', 'romance', 'romântico', 'romantico', 'Romantic', 'romantic comedy', 'rom-com'] } },
            { type: { contains: 'romance', mode: 'insensitive' as const } },
            { synopsis: { contains: 'amor', mode: 'insensitive' as const } },
        ],
    },
    'doramas-terror-coreanos': {
        OR: [
            { tags: { hasSome: ['Horror', 'terror', 'horror', 'scary', 'monster', 'monstro', 'sobrenatural'] } },
            { type: { contains: 'horror', mode: 'insensitive' as const } },
            { type: { contains: 'terror', mode: 'insensitive' as const } },
        ],
    },
    'doramas-thriller-coreanos': {
        OR: [
            { tags: { hasSome: ['Thriller', 'Mystery', 'Suspense', 'Mistério', 'thriller', 'suspense', 'mistério', 'misterio', 'mystery', 'psychological'] } },
            { type: { contains: 'thriller', mode: 'insensitive' as const } },
            { type: { contains: 'suspense', mode: 'insensitive' as const } },
        ],
    },
    'doramas-acao-coreanos': {
        OR: [
            { tags: { hasSome: ['Action', 'Action & Adventure', 'Ação', 'Adventure', 'ação', 'acao', 'action', 'espionagem', 'spy', 'luta', 'fight'] } },
            { type: { contains: 'ação', mode: 'insensitive' as const } },
            { type: { contains: 'action', mode: 'insensitive' as const } },
        ],
    },
    'doramas-comedia-coreanos': {
        OR: [
            { tags: { hasSome: ['Comedy', 'Comédia', 'Rom-com', 'comédia', 'comedia', 'comedy', 'rom-com', 'sitcom'] } },
            { type: { contains: 'comédia', mode: 'insensitive' as const } },
            { type: { contains: 'comedy', mode: 'insensitive' as const } },
        ],
    },
    'doramas-fantasia-coreanos': {
        OR: [
            { tags: { hasSome: ['Fantasy', 'Sci-Fi & Fantasy', 'Fantasia', 'fantasia', 'fantasy', 'sobrenatural', 'supernatural', 'magic', 'gumiho', 'dokkaebi'] } },
            { type: { contains: 'fantasia', mode: 'insensitive' as const } },
            { type: { contains: 'fantasy', mode: 'insensitive' as const } },
        ],
    },
    'doramas-medicos-coreanos': {
        OR: [
            { tags: { hasSome: ['médico', 'medico', 'medical', 'hospital', 'doctor', 'doctors', 'cirurgia'] } },
            { type: { contains: 'medical', mode: 'insensitive' as const } },
            { type: { contains: 'hospital', mode: 'insensitive' as const } },
            { synopsis: { contains: 'hospital', mode: 'insensitive' as const } },
            { synopsis: { contains: 'médic', mode: 'insensitive' as const } },
            { synopsis: { contains: 'medic', mode: 'insensitive' as const } },
        ],
    },
    'doramas-escolares-coreanos': {
        OR: [
            { tags: { hasSome: ['Kids', 'school', 'escola', 'colegial', 'high school', 'universidade', 'college', 'youth', 'juventude'] } },
            { type: { contains: 'school', mode: 'insensitive' as const } },
            { type: { contains: 'youth', mode: 'insensitive' as const } },
            { synopsis: { contains: 'escola', mode: 'insensitive' as const } },
            { synopsis: { contains: 'estudante', mode: 'insensitive' as const } },
            { synopsis: { contains: 'universidade', mode: 'insensitive' as const } },
        ],
    },
    'doramas-policiais-coreanos': {
        OR: [
            { tags: { hasSome: ['Crime', 'Mystery', 'crime', 'policial', 'police', 'detective', 'detetive', 'investigação', 'investigacao', 'law', 'prosecutor'] } },
            { type: { contains: 'crime', mode: 'insensitive' as const } },
            { type: { contains: 'police', mode: 'insensitive' as const } },
            { synopsis: { contains: 'detetive', mode: 'insensitive' as const } },
            { synopsis: { contains: 'polícia', mode: 'insensitive' as const } },
            { synopsis: { contains: 'crime', mode: 'insensitive' as const } },
        ],
    },
    'doramas-de-vinganca-coreanos': {
        OR: [
            { tags: { hasSome: ['vingança', 'vinganca', 'revenge', 'revanche', 'bullying', 'justice', 'justiça'] } },
            { type: { contains: 'revenge', mode: 'insensitive' as const } },
            { type: { contains: 'vingança', mode: 'insensitive' as const } },
            { synopsis: { contains: 'vingança', mode: 'insensitive' as const } },
            { synopsis: { contains: 'vingar', mode: 'insensitive' as const } },
            { synopsis: { contains: 'justiça', mode: 'insensitive' as const } },
        ],
    },
    'doramas-zumbis-coreanos': {
        OR: [
            { tags: { hasSome: ['zumbi', 'zombie', 'zombies', 'infection', 'infecção', 'epidemia', 'survival'] } },
            { type: { contains: 'zombie', mode: 'insensitive' as const } },
            { type: { contains: 'zumbi', mode: 'insensitive' as const } },
            { synopsis: { contains: 'zumbi', mode: 'insensitive' as const } },
            { synopsis: { contains: 'infect', mode: 'insensitive' as const } },
            { synopsis: { contains: 'sobreviv', mode: 'insensitive' as const } },
        ],
    },
    'doramas-viagem-no-tempo-coreanos': {
        OR: [
            { tags: { hasSome: ['viagem no tempo', 'time travel', 'timeline', 'passado', 'future', 'futuro', 'destino', 'reencarnação'] } },
            { type: { contains: 'time travel', mode: 'insensitive' as const } },
            { type: { contains: 'tempo', mode: 'insensitive' as const } },
            { synopsis: { contains: 'viagem no tempo', mode: 'insensitive' as const } },
            { synopsis: { contains: 'volta no tempo', mode: 'insensitive' as const } },
            { synopsis: { contains: 'passado', mode: 'insensitive' as const } },
            { synopsis: { contains: 'futuro', mode: 'insensitive' as const } },
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
            { tags: { hasSome: ['Melodrama', 'triste', 'sad', 'melodrama', 'emocionante', 'choro', 'tearjerker', 'drama familiar'] } },
            { type: { contains: 'melodrama', mode: 'insensitive' as const } },
        ],
    },
    'doramas-coreanos-baseados-em-webtoon': {
        OR: [
            { tags: { hasSome: ['Webtoon', 'webtoon', 'manhwa', 'quadrinho digital', 'adaptação', 'adaptacao'] } },
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
    'doramas-ceo-coreanos': {
        OR: [
            { tags: { hasSome: ['CEO', 'ceo', 'chaebol', 'executivo', 'empresa', 'office romance', 'workplace romance', 'business'] } },
            { type: { contains: 'office', mode: 'insensitive' as const } },
            { type: { contains: 'business', mode: 'insensitive' as const } },
            { synopsis: { contains: 'CEO', mode: 'insensitive' as const } },
            { synopsis: { contains: 'empresa', mode: 'insensitive' as const } },
            { synopsis: { contains: 'herdeir', mode: 'insensitive' as const } },
            { synopsis: { contains: 'executiv', mode: 'insensitive' as const } },
        ],
    },
    'doramas-casamento-por-contrato': {
        OR: [
            { tags: { hasSome: ['casamento por contrato', 'contract marriage', 'fake marriage', 'fake dating', 'namoro falso', 'marriage contract', 'cohabitation'] } },
            { type: { contains: 'contract', mode: 'insensitive' as const } },
            { type: { contains: 'marriage', mode: 'insensitive' as const } },
            { synopsis: { contains: 'contrato', mode: 'insensitive' as const } },
            { synopsis: { contains: 'casamento', mode: 'insensitive' as const } },
            { synopsis: { contains: 'encontro às cegas', mode: 'insensitive' as const } },
        ],
    },
    'doramas-enemies-to-lovers': {
        OR: [
            { tags: { hasSome: ['enemies to lovers', 'haters to lovers', 'rivais', 'rivals', 'rivalry', 'love-hate', 'slow burn'] } },
            { type: { contains: 'rival', mode: 'insensitive' as const } },
            { type: { contains: 'love-hate', mode: 'insensitive' as const } },
            { synopsis: { contains: 'rival', mode: 'insensitive' as const } },
            { synopsis: { contains: 'odeia', mode: 'insensitive' as const } },
            { synopsis: { contains: 'inimig', mode: 'insensitive' as const } },
        ],
    },
    'doramas-amigos-de-infancia': {
        OR: [
            { tags: { hasSome: ['amigos de infância', 'amigos de infancia', 'childhood friends', 'first love', 'primeiro amor', 'reunion', 'reencontro'] } },
            { type: { contains: 'first love', mode: 'insensitive' as const } },
            { type: { contains: 'childhood', mode: 'insensitive' as const } },
        ],
    },
    'doramas-noona-romance': {
        OR: [
            { tags: { hasSome: ['noona romance', 'older woman younger man', 'mulher mais velha', 'diferença de idade', 'age gap romance'] } },
            { type: { contains: 'noona', mode: 'insensitive' as const } },
            { type: { contains: 'age gap', mode: 'insensitive' as const } },
        ],
    },
    'doramas-slice-of-life-coreanos': {
        OR: [
            { tags: { hasSome: ['Slice of Life', 'slice of life', 'healing', 'cura', 'cotidiano', 'vida real', 'amizade', 'friendship', 'coming of age'] } },
            { type: { contains: 'slice of life', mode: 'insensitive' as const } },
            { type: { contains: 'healing', mode: 'insensitive' as const } },
            { synopsis: { contains: 'amizade', mode: 'insensitive' as const } },
            { synopsis: { contains: 'cotidiano', mode: 'insensitive' as const } },
        ],
    },
    'doramas-de-advogados-coreanos': {
        OR: [
            { tags: { hasSome: ['advogado', 'advogada', 'lawyer', 'legal', 'tribunal', 'courtroom', 'promotor', 'prosecutor', 'juiz', 'judge'] } },
            { type: { contains: 'legal', mode: 'insensitive' as const } },
            { type: { contains: 'law', mode: 'insensitive' as const } },
            { synopsis: { contains: 'advog', mode: 'insensitive' as const } },
            { synopsis: { contains: 'promotor', mode: 'insensitive' as const } },
            { synopsis: { contains: 'tribunal', mode: 'insensitive' as const } },
            { synopsis: { contains: 'juiz', mode: 'insensitive' as const } },
        ],
    },
    'doramas-de-familia-coreanos': {
        OR: [
            { tags: { hasSome: ['Family', 'Melodrama', 'família', 'familia', 'family', 'drama familiar', 'family drama', 'melodrama', 'reconciliação'] } },
            { type: { contains: 'family', mode: 'insensitive' as const } },
            { episodeCount: { gte: 24 } },
        ],
    },
    'doramas-sobre-musica-kpop': {
        OR: [
            { tags: { hasSome: ['Music', 'Música', 'K-Pop', 'music', 'música', 'musica', 'k-pop', 'kpop', 'idol', 'trainee', 'band', 'banda', 'singer', 'dance'] } },
            { type: { contains: 'music', mode: 'insensitive' as const } },
            { type: { contains: 'idol', mode: 'insensitive' as const } },
        ],
    },
    'doramas-de-esportes-coreanos': {
        OR: [
            { tags: { hasSome: ['sports', 'esporte', 'esportes', 'athlete', 'atleta', 'competition', 'competição', 'baseball', 'badminton', 'basketball'] } },
            { type: { contains: 'sport', mode: 'insensitive' as const } },
            { type: { contains: 'athlete', mode: 'insensitive' as const } },
            { synopsis: { contains: 'esporte', mode: 'insensitive' as const } },
            { synopsis: { contains: 'atleta', mode: 'insensitive' as const } },
            { synopsis: { contains: 'basquete', mode: 'insensitive' as const } },
            { synopsis: { contains: 'competição', mode: 'insensitive' as const } },
        ],
    },
    'doramas-para-maratonar': {
        OR: [
            { episodeCount: { lte: 16 } },
            { voteAverage: { gte: 8 } },
            { voteCount: { gte: 500 } },
            { tags: { hasSome: ['binge watch', 'maratonar', 'viciante', 'addictive', 'fast paced', 'popular'] } },
        ],
    },
    'doramas-misterio-coreanos': {
        OR: [
            { tags: { hasSome: ['Mystery', 'Mistério', 'mystery', 'mistério', 'misterio', 'whodunit', 'enigma', 'segredo'] } },
            { type: { contains: 'mystery', mode: 'insensitive' as const } },
            { type: { contains: 'mistério', mode: 'insensitive' as const } },
        ],
    },
    'doramas-crime-coreanos': {
        OR: [
            { tags: { hasSome: ['Crime', 'crime', 'criminal', 'assassino', 'murderer', 'serial killer', 'corrupção', 'corruption', 'underworld', 'submundo'] } },
            { type: { contains: 'crime', mode: 'insensitive' as const } },
            { synopsis: { contains: 'assassin', mode: 'insensitive' as const } },
            { synopsis: { contains: 'crime', mode: 'insensitive' as const } },
        ],
    },
    'doramas-sobrevivencia-coreanos': {
        OR: [
            { tags: { hasSome: ['survival', 'sobrevivência', 'sobrevivencia', 'apocalipse', 'apocalypse', 'zombie', 'zumbi', 'infecção', 'pandemia', 'pandemic', 'survival game', 'game of death'] } },
            { type: { contains: 'survival', mode: 'insensitive' as const } },
            { synopsis: { contains: 'sobreviv', mode: 'insensitive' as const } },
            { synopsis: { contains: 'apocalip', mode: 'insensitive' as const } },
        ],
    },
    'doramas-reencarnacao-coreanos': {
        OR: [
            { tags: { hasSome: ['reencarnação', 'reincarnation', 'vidas passadas', 'past lives', 'destino', 'fate', 'soul', 'alma', 'previous life', 'vida anterior'] } },
            { type: { contains: 'reencarnação', mode: 'insensitive' as const } },
            { type: { contains: 'reincarnation', mode: 'insensitive' as const } },
            { synopsis: { contains: 'reencarnação', mode: 'insensitive' as const } },
            { synopsis: { contains: 'vida anterior', mode: 'insensitive' as const } },
            { synopsis: { contains: 'destino', mode: 'insensitive' as const } },
        ],
    },
    'doramas-sobre-comida-coreanos': {
        OR: [
            { tags: { hasSome: ['food', 'comida', 'culinária', 'culinaria', 'cooking', 'cozinha', 'chef', 'restaurante', 'restaurant', 'gastronomia', 'recipe'] } },
            { type: { contains: 'food', mode: 'insensitive' as const } },
            { type: { contains: 'cooking', mode: 'insensitive' as const } },
            { synopsis: { contains: 'restaurante', mode: 'insensitive' as const } },
            { synopsis: { contains: 'cozinheiro', mode: 'insensitive' as const } },
            { synopsis: { contains: 'chef', mode: 'insensitive' as const } },
        ],
    },
    'doramas-thriller-politico-coreanos': {
        OR: [
            { tags: { hasSome: ['political thriller', 'político', 'politico', 'governo', 'government', 'conspiração', 'conspiracy', 'corrupção', 'corruption', 'chaebol', 'presidential', 'presidente', 'espião político'] } },
            { type: { contains: 'political', mode: 'insensitive' as const } },
            { synopsis: { contains: 'governo', mode: 'insensitive' as const } },
            { synopsis: { contains: 'presidente', mode: 'insensitive' as const } },
            { synopsis: { contains: 'conspiração', mode: 'insensitive' as const } },
        ],
    },
    'doramas-sobrenatural-coreanos': {
        OR: [
            { tags: { hasSome: ['supernatural', 'sobrenatural', 'gumiho', 'dokkaebi', 'goblin', 'ghost', 'fantasm', 'espírito', 'espirito', 'power', 'poder especial', 'imortal', 'immortal', 'shaman', 'xamã'] } },
            { type: { contains: 'supernatural', mode: 'insensitive' as const } },
            { type: { contains: 'sobrenatural', mode: 'insensitive' as const } },
        ],
    },
    'filmes-terror-coreanos': {
        OR: [
            { tags: { hasSome: ['Horror', 'terror', 'horror', 'scary', 'monstro', 'monster', 'assombrado', 'paranormal', 'gore'] } },
            { type: { contains: 'horror', mode: 'insensitive' as const } },
            { type: { contains: 'terror', mode: 'insensitive' as const } },
        ],
    },
    'filmes-acao-coreanos': {
        OR: [
            { tags: { hasSome: ['Action', 'Ação', 'ação', 'action', 'spy', 'espionagem', 'luta', 'fight', 'assassin', 'gangster', 'mercenary'] } },
            { type: { contains: 'action', mode: 'insensitive' as const } },
            { type: { contains: 'ação', mode: 'insensitive' as const } },
        ],
    },
    'filmes-romance-coreanos': {
        OR: [
            { tags: { hasSome: ['Romance', 'romance', 'romântico', 'romantico', 'melodrama', 'Melodrama', 'love story', 'romantic comedy', 'rom-com'] } },
            { type: { contains: 'romance', mode: 'insensitive' as const } },
            { type: { contains: 'romantic', mode: 'insensitive' as const } },
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
                : hub.slug === 'kpop-stars-e-kbeauty'
                ? {
                    ...commonWhere,
                    roles: { hasSome: SINGER_ROLES },
                    OR: [
                        { memberships: { some: { group: { slug: { in: ['blackpink', 'bts', 'aespa', 'twice', 'exo', 'nct-127', 'stray-kids', 'ive', 'newjeans', 'le-sserafim'] } } } } },
                        { bio: { contains: 'beleza', mode: 'insensitive' as const } },
                        { bio: { contains: 'beauty', mode: 'insensitive' as const } },
                    ],
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
        PRODUCTION_NETWORK_FILTERS[hub.slug as keyof typeof PRODUCTION_NETWORK_FILTERS] ??
        PRODUCTION_GENRE_FILTERS[hub.slug as keyof typeof PRODUCTION_GENRE_FILTERS] ??
        {}

    const yearFilter = hub.year ? { year: hub.year } : {}
    const MOVIE_HUB_SLUGS = new Set(['filmes-coreanos', 'filmes-terror-coreanos', 'filmes-acao-coreanos', 'filmes-romance-coreanos'])
    const isMovieHub = MOVIE_HUB_SLUGS.has(hub.slug)
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

export type HubBlogPost = {
    id: string
    slug: string | null
    title: string
    excerpt: string | null
    coverImageUrl: string | null
    publishedAt: Date | null
    readingTimeMin: number | null
    category: { name: string } | null
}

export async function getHubBlogPosts(hub: ArchiveHub): Promise<HubBlogPost[]> {
    if (!hub.keywords?.length) return []
    const terms = hub.keywords.slice(0, 6)
    return prisma.blogPost.findMany({
        where: {
            status: 'PUBLISHED',
            isPrivate: false,
            OR: terms.flatMap(term => [
                { title: { contains: term, mode: 'insensitive' as const } },
                { tags: { has: term } },
            ]),
        },
        select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true,
            coverImageUrl: true,
            publishedAt: true,
            readingTimeMin: true,
            category: { select: { name: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 6,
    }) as Promise<HubBlogPost[]>
}
