/**
 * Busca accent-insensitive usando unaccent() do PostgreSQL.
 *
 * Prisma não suporta unaccent nativamente — usamos $queryRaw para
 * produções e artistas, de forma que "caes de caca" encontra "Cães de Caça".
 */
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type ProductionSearchResult = {
    id: string
    titlePt: string
    titleKr: string | null
    type: string
    year: number | null
    imageUrl: string | null
    voteAverage: number | null
}

type ArtistSearchResult = {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    roles: string[]
    gender: number | null
    trendingScore: number | null
}

type GroupSearchResult = {
    id: string
    name: string
    nameHangul: string | null
    profileImageUrl: string | null
}

/**
 * Busca produções com suporte a acentos, ex: "caes de caca" → "Cães de Caça"
 */
export async function searchProductionsUnaccent(
    searchTerm: string,
    opts: {
        limit?: number
        ageRatingFilter?: Prisma.ProductionWhereInput
    } = {}
): Promise<ProductionSearchResult[]> {
    const limit = opts.limit ?? 5
    const pattern = `%${searchTerm}%`

    // Filtros extras de ageRating viram cláusulas SQL adicionais
    const ageFilter = opts.ageRatingFilter ?? {}
    const hasAgeFilter = Object.keys(ageFilter).length > 0

    // Cláusula extra: bloquear isAdultContent=true e ageRating=18
    // (equivalente ao filtro padrão do applyAgeRatingFilter)
    const adultClause = hasAgeFilter
        ? Prisma.sql`AND (p."ageRating" IS NULL OR p."ageRating" != '18') AND (p."isAdultContent" IS NULL OR p."isAdultContent" = false)`
        : Prisma.sql``

    const rows = await prisma.$queryRaw<ProductionSearchResult[]>`
        SELECT p.id, p."titlePt", p."titleKr", p.type, p.year, p."imageUrl", p."voteAverage"
        FROM "Production" p
        WHERE p."flaggedAsNonKorean" = false
          AND p."isHidden" = false
          AND p."isTakenDown" = false
          ${adultClause}
          AND (
            unaccent(p."titlePt") ILIKE unaccent(${pattern})
            OR p."titleKr" ILIKE ${pattern}
          )
        ORDER BY p."voteAverage" DESC NULLS LAST, p.year DESC NULLS LAST
        LIMIT ${limit}
    `
    return rows
}

/**
 * Busca artistas com suporte a acentos no nome romanizado
 */
export async function searchArtistsUnaccent(
    searchTerm: string,
    limit = 5
): Promise<ArtistSearchResult[]> {
    const pattern = `%${searchTerm}%`

    const rows = await prisma.$queryRaw<ArtistSearchResult[]>`
        SELECT a.id, a."nameRomanized", a."nameHangul", a."primaryImageUrl",
               a.roles, a.gender, a."trendingScore"
        FROM "Artist" a
        WHERE a."flaggedAsNonKorean" = false
          AND a."isHidden" = false
          AND a."autoHidden" = false
          AND (
            unaccent(a."nameRomanized") ILIKE unaccent(${pattern})
            OR a."nameHangul" ILIKE ${pattern}
          )
        ORDER BY a."trendingScore" DESC NULLS LAST
        LIMIT ${limit}
    `
    return rows
}

/**
 * Busca grupos musicais com suporte a acentos
 */
export async function searchGroupsUnaccent(
    searchTerm: string,
    limit = 3
): Promise<GroupSearchResult[]> {
    const pattern = `%${searchTerm}%`

    const rows = await prisma.$queryRaw<GroupSearchResult[]>`
        SELECT g.id, g.name, g."nameHangul", g."profileImageUrl"
        FROM "MusicalGroup" g
        WHERE g."isHidden" = false
          AND (
            unaccent(g.name) ILIKE unaccent(${pattern})
            OR g."nameHangul" ILIKE ${pattern}
          )
        ORDER BY g.name ASC
        LIMIT ${limit}
    `
    return rows
}
