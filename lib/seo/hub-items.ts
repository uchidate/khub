import prisma from '@/lib/prisma'
import { applyAgeRatingFilter } from '@/lib/utils/age-rating-filter'
import type { ArchiveHub } from '@/lib/seo/archive-hubs'
import type { HubArtistItem, HubGroupItem, HubItem, HubProductionItem } from '@/components/seo/HubPageContent'

const SINGER_ROLES = ['CANTOR', 'CANTORA', 'Cantor', 'Cantora', 'Cantor/Cantora', 'SINGER', 'Singer', 'VOCALIST', 'Vocalist', 'RAPPER', 'Rapper', 'IDOL', 'Idol']
const ACTOR_ROLES = ['ATOR', 'ATRIZ', 'Ator', 'Atriz', 'Ator/Atriz', 'ACTOR', 'ACTRESS', 'Actor', 'Actress']

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

    const platformFilter =
        hub.slug === 'doramas-amazon-prime'
            ? {
                OR: [
                    { streamingPlatforms: { has: 'Amazon Prime Video' } },
                    { streamingPlatforms: { has: 'Prime Video' } },
                    { network: { contains: 'Amazon', mode: 'insensitive' as const } },
                ],
            }
            : hub.slug === 'doramas-historicos-coreanos'
            ? {
                OR: [
                    { tags: { hasSome: ['sageuk', 'Sageuk', 'histórico', 'Histórico', 'historico', 'period', 'joseon', 'Joseon'] } },
                    { type: { in: ['Sageuk', 'sageuk', 'K-Drama Histórico', 'Historical'] } },
                ],
            }
            : hub.slug === 'doramas-romanticos'
            ? {
                OR: [
                    { tags: { hasSome: ['romance', 'romântico', 'romantico', 'Romance', 'Romantic', 'romantic comedy', 'rom-com'] } },
                    { type: { contains: 'romance', mode: 'insensitive' as const } },
                ],
            }
            : {
                OR: [
                    { streamingPlatforms: { has: 'Netflix' } },
                    { network: { contains: 'Netflix', mode: 'insensitive' as const } },
                    { sourceUrls: { has: 'Netflix' } },
                ],
            }

    const yearFilter = hub.year ? { year: hub.year } : {}

    return prisma.production.findMany({
        where: {
            ...ageFilter,
            ...yearFilter,
            flaggedAsNonKorean: false,
            isHidden: false,
            slug: { not: null },
            OR: [
                { type: 'SERIE' },
                { tmdbType: 'tv' },
            ],
            AND: hub.year
                ? [{ OR: [{ isAdultContent: null }, { isAdultContent: false }] }]
                : [
                    { OR: [{ isAdultContent: null }, { isAdultContent: false }] },
                    platformFilter,
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
