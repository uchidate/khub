/**
 * ArtistRepository
 *
 * Centraliza schema, regras de negócio e hooks para Artist:
 *   - fieldSources tracking (protege campos editados manualmente do sync TMDB)
 *   - Gerenciamento de ArtistGroupMembership
 *   - Content translation auto-upsert
 *   - Audit log em toda escrita
 *   - Filtros complexos (incluindo raw SQL para regex de Hangul)
 *
 * Side effects Next.js (revalidatePath) ficam no route handler.
 */

import { z } from 'zod'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { logAudit } from '@/lib/services/audit-service'
import { detectLanguage } from '@/lib/services/language-detection-service'
import { createLogger } from '@/lib/utils/logger'
import { RepositoryError, ListParams, listResult, paginate, WriteContext } from './base'

const log = createLogger('REPO-ARTIST')

// ── Schema ────────────────────────────────────────────────────────────────────

export const ArtistSchema = z.object({
    nameRomanized: z.string().min(1),
    nameHangul: z.string().optional(),
    birthDate: z.string().optional(),
    birthName: z.string().optional(),
    placeOfBirth: z.string().optional(),
    gender: z.number().int().nullable().optional(),
    stageNames: z.array(z.string()).optional(),
    roles: z.array(z.string()).optional(),
    height: z.string().optional(),
    bloodType: z.string().optional(),
    zodiacSign: z.string().optional(),
    bio: z.string().optional(),
    primaryImageUrl: z.string().nullable().optional(),
    socialLinks: z.record(z.string(), z.string()).optional(),
    analiseEditorial: z.string().optional(),
    curiosidades: z.array(z.string()).optional(),
    flaggedAsNonKorean: z.boolean().optional(),
    tmdbId: z.string().optional(),
    mbid: z.string().optional(),
    agencyId: z.string().optional(),
    /** '' = remove all groups, id = upsert membership */
    musicalGroupId: z.string().optional(),
    isHidden: z.boolean().optional(),
    /** Campos que vieram do TMDB (não marcar como editados manualmente) */
    tmdbSyncedFields: z.array(z.string()).optional(),
})

export type ArtistInput = z.infer<typeof ArtistSchema>

// ── Campos rastreados por fieldSources ────────────────────────────────────────

const TRACKABLE_FIELDS = [
    'primaryImageUrl', 'bio', 'birthDate', 'placeOfBirth',
    'nameHangul', 'stageNames', 'gender',
] as const

type TrackableField = typeof TRACKABLE_FIELDS[number]

// ── Filtros de listagem ────────────────────────────────────────────────────────

export interface ArtistListParams extends ListParams {
    filter?: string
}

const ALLOWED_SORT = new Set(['nameRomanized', 'createdAt', 'trendingScore', 'trendingRank', 'viewCount', 'favoriteCount'])

const KOREAN_REGEX = "E'[\\\\uAC00-\\\\uD7AF\\\\u3131-\\\\u314E\\\\u314F-\\\\u3163]'"

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeArtistData(validated: Partial<ArtistInput>) {
    const data: Record<string, unknown> = { ...validated }

    if (validated.birthDate === '' || validated.birthDate === undefined) {
        data.birthDate = null
    } else if (validated.birthDate) {
        data.birthDate = new Date(validated.birthDate)
    }

    if (validated.primaryImageUrl === '' || validated.primaryImageUrl === null) data.primaryImageUrl = null
    if (validated.nameHangul === '') data.nameHangul = null
    if (validated.placeOfBirth === '') data.placeOfBirth = null
    if (validated.birthName === '') data.birthName = null
    if (validated.height === '') data.height = null
    if (validated.zodiacSign === '') data.zodiacSign = null
    if (validated.analiseEditorial === '') data.analiseEditorial = null
    if (validated.tmdbId === '') data.tmdbId = null
    if (validated.mbid === '') {
        data.mbid = null
        data.discographySyncAt = null
    }

    // Remove campos que não são colunas do modelo Artist
    delete data.musicalGroupId
    delete data.tmdbSyncedFields

    return data
}

async function computeFieldSources(
    artistId: string,
    validated: Partial<ArtistInput>,
    data: Record<string, unknown>,
    adminId: string
) {
    const current = await prisma.artist.findUnique({
        where: { id: artistId },
        select: {
            primaryImageUrl: true, bio: true, birthDate: true, placeOfBirth: true,
            nameHangul: true, stageNames: true, gender: true, fieldSources: true,
        },
    })
    if (!current) return

    const tmdbSynced = new Set(validated.tmdbSyncedFields ?? [])
    const sources = (current.fieldSources as Record<string, unknown> | null) ?? {}
    const now = new Date().toISOString()

    const newVals: Record<TrackableField, unknown> = {
        primaryImageUrl: (data.primaryImageUrl as string | null) ?? null,
        bio: validated.bio || null,
        birthDate: data.birthDate instanceof Date ? data.birthDate.toISOString().split('T')[0] : null,
        placeOfBirth: validated.placeOfBirth || null,
        nameHangul: validated.nameHangul || null,
        stageNames: JSON.stringify(validated.stageNames ?? current.stageNames ?? []),
        gender: validated.gender ?? null,
    }
    const oldVals: Record<TrackableField, unknown> = {
        primaryImageUrl: current.primaryImageUrl,
        bio: current.bio,
        birthDate: current.birthDate ? (current.birthDate as Date).toISOString().split('T')[0] : null,
        placeOfBirth: current.placeOfBirth,
        nameHangul: current.nameHangul,
        stageNames: JSON.stringify(current.stageNames ?? []),
        gender: current.gender,
    }

    const updatedSources = { ...sources }
    for (const field of TRACKABLE_FIELDS) {
        if (tmdbSynced.has(field)) {
            updatedSources[field] = { source: 'tmdb', at: now }
        } else if (String(newVals[field]) !== String(oldVals[field])) {
            updatedSources[field] = { source: 'manual', at: now, by: adminId }
        }
    }

    data.fieldSources = updatedSources
}

async function manageGroupMembership(artistId: string, musicalGroupId: string | undefined) {
    if (musicalGroupId === undefined) return

    if (musicalGroupId === '' || musicalGroupId === null) {
        await prisma.artistGroupMembership.deleteMany({ where: { artistId } })
    } else {
        await prisma.artistGroupMembership.upsert({
            where: { artistId_groupId: { artistId, groupId: musicalGroupId } },
            create: { artistId, groupId: musicalGroupId, isActive: true },
            update: { isActive: true, leaveDate: null },
        })
        await prisma.artistGroupMembership.updateMany({
            where: { artistId, groupId: { not: musicalGroupId } },
            data: { isActive: false },
        })
    }
}

async function afterBioWrite(artistId: string, bio: string | undefined) {
    if (!bio) return
    const lang = detectLanguage(bio)
    if (lang !== 'pt') return
    await prisma.contentTranslation.upsert({
        where: { entityType_entityId_field_locale: { entityType: 'artist', entityId: artistId, field: 'bio', locale: 'pt-BR' } },
        create: { entityType: 'artist', entityId: artistId, field: 'bio', locale: 'pt-BR', value: bio, status: 'approved', sourceLang: 'pt' },
        update: { value: bio, status: 'approved', sourceLang: 'pt' },
    }).catch(() => {})
    await prisma.artist.update({
        where: { id: artistId },
        data: { translationStatus: 'completed', translatedAt: new Date() },
    }).catch(() => {})
}

async function getKoreanRegexIds(filter: string): Promise<string[]> {
    type Row = { id: string }
    const base = `WHERE "flaggedAsNonKorean" = false AND "nameRomanized" ~ ${KOREAN_REGEX}`
    let raw: Row[]

    if (filter === 'no_romanized') {
        raw = await prisma.$queryRawUnsafe<Row[]>(`SELECT id FROM "Artist" ${base} ORDER BY "trendingScore" DESC`)
    } else if (filter === 'no_romanized_pending') {
        raw = await prisma.$queryRawUnsafe<Row[]>(`SELECT id FROM "Artist" ${base} AND "tmdbId" IS NOT NULL AND "nameSyncAt" IS NULL ORDER BY "trendingScore" DESC`)
    } else if (filter === 'no_romanized_attempted') {
        raw = await prisma.$queryRawUnsafe<Row[]>(`SELECT id FROM "Artist" ${base} AND "tmdbId" IS NOT NULL AND "nameSyncAt" IS NOT NULL ORDER BY "trendingScore" DESC`)
    } else {
        // korean_no_tmdb, no_romanized_no_tmdb
        raw = await prisma.$queryRawUnsafe<Row[]>(`SELECT id FROM "Artist" ${base} AND "tmdbId" IS NULL ORDER BY "trendingScore" DESC`)
    }
    return raw.map(r => r.id)
}

// ── Repository ────────────────────────────────────────────────────────────────

export const ArtistRepository = {

    // ── Read ──────────────────────────────────────────────────────────────────

    async findById(id: string) {
        const artist = await prisma.artist.findUnique({
            where: { id },
            select: {
                id: true, nameRomanized: true, nameHangul: true, stageNames: true,
                primaryImageUrl: true, birthDate: true, placeOfBirth: true,
                gender: true, roles: true, bio: true, birthName: true, height: true,
                zodiacSign: true, socialLinks: true, analiseEditorial: true,
                curiosidades: true, flaggedAsNonKorean: true, discographySyncAt: true,
                tmdbId: true, mbid: true, isHidden: true, fieldSources: true,
            },
        })
        if (!artist) throw new RepositoryError('Artista não encontrado', 'NOT_FOUND', 404)
        return artist
    },

    async findMany(params: ArtistListParams = {}) {
        const { search, filter, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params
        const { skip, take } = paginate(page, limit)
        const safeSort = ALLOWED_SORT.has(sortBy ?? '') ? sortBy! : 'createdAt'

        const koreanFilters = ['korean_no_tmdb', 'no_romanized', 'no_romanized_pending', 'no_romanized_attempted', 'no_romanized_no_tmdb']
        let rawIds: string[] | null = null
        if (koreanFilters.includes(filter ?? '')) {
            rawIds = await getKoreanRegexIds(filter!)
        }

        const active = { flaggedAsNonKorean: false }
        const filterWhere: Prisma.ArtistWhereInput = rawIds !== null
            ? { id: { in: rawIds } }
            : filter === 'with_tmdb'           ? { ...active, tmdbId: { not: null } }
            : filter === 'no_tmdb'             ? { ...active, tmdbId: null }
            : filter === 'no_hangul'           ? { ...active, nameHangul: null }
            : filter === 'no_hangul_pending'   ? { ...active, nameHangul: null, tmdbId: { not: null }, hangulSyncAt: null }
            : filter === 'no_hangul_attempted' ? { ...active, nameHangul: null, tmdbId: { not: null }, hangulSyncAt: { not: null } }
            : filter === 'no_hangul_no_tmdb'   ? { ...active, nameHangul: null, tmdbId: null }
            : filter === 'no_photo'            ? { ...active, primaryImageUrl: null }
            : filter === 'no_photo_pending'    ? { ...active, primaryImageUrl: null, tmdbId: { not: null }, photoSyncAt: null }
            : filter === 'no_photo_attempted'  ? { ...active, primaryImageUrl: null, tmdbId: { not: null }, photoSyncAt: { not: null } }
            : filter === 'no_photo_no_tmdb'    ? { ...active, primaryImageUrl: null, tmdbId: null }
            : filter === 'no_social' || filter === 'no_social_pending'
                                               ? { ...active, socialLinksUpdatedAt: null }
            : filter === 'no_social_attempted' ? { ...active, socialLinksUpdatedAt: { not: null }, socialLinks: { equals: Prisma.DbNull } }
            : filter === 'no_social_no_tmdb'   ? { ...active, socialLinksUpdatedAt: null, tmdbId: null }
            : filter === 'flagged'             ? { flaggedAsNonKorean: true }
            : filter === 'with_group'          ? { ...active, memberships: { some: { isActive: true } } }
            : filter === 'no_group'            ? { ...active, memberships: { none: { isActive: true } } }
            : filter === 'no_group_unsynced'   ? { ...active, memberships: { none: { isActive: true } }, groupSyncAt: null }
            : filter === 'no_group_solo'       ? { ...active, memberships: { none: { isActive: true } }, groupSyncAt: { not: null } }
            : filter === 'no_productions'      ? { ...active, productions: { none: {} } }
            : filter === 'auto_hidden'         ? { isHidden: true, autoHidden: true }
            : {}

        const searchWhere: Prisma.ArtistWhereInput = search
            ? { OR: [{ nameRomanized: { contains: search, mode: 'insensitive' } }, { nameHangul: { contains: search, mode: 'insensitive' } }] }
            : {}

        const where: Prisma.ArtistWhereInput = search
            ? { AND: [filterWhere, searchWhere] }
            : filterWhere

        const [items, total] = await Promise.all([
            prisma.artist.findMany({
                where, skip, take,
                orderBy: { [safeSort]: sortOrder },
                include: {
                    agency: { select: { id: true, name: true } },
                    _count: { select: { productions: true, albums: true } },
                    memberships: { where: { isActive: true }, include: { group: { select: { id: true, name: true } } }, take: 1 },
                },
            }),
            prisma.artist.count({ where }),
        ])

        const data = items.map(a => ({
            ...a,
            productionsCount: a._count.productions,
            albumsCount: a._count.albums,
            agencyName: a.agency?.name ?? null,
            musicalGroupName: a.memberships?.[0]?.group.name ?? null,
            musicalGroupId: a.memberships?.[0]?.group.id ?? null,
        }))

        return listResult(data, total, page, limit)
    },

    // ── Write ─────────────────────────────────────────────────────────────────

    async create(input: unknown, ctx: WriteContext) {
        const validated = ArtistSchema.parse(input)
        const data = normalizeArtistData(validated)

        const artist = await prisma.artist.create({
            data: data as Prisma.ArtistCreateInput,
            include: { agency: { select: { id: true, name: true } } },
        })

        await afterBioWrite(artist.id, validated.bio)
        await logAudit({ adminId: ctx.adminId, action: 'CREATE', entity: 'Artist', entityId: artist.id, details: `Criou artista "${artist.nameRomanized}"`, ip: ctx.ip })
        log.info('Artist created', { id: artist.id, name: artist.nameRomanized })
        return artist
    },

    async update(id: string, input: unknown, ctx: WriteContext) {
        const validated = ArtistSchema.partial().parse(input)
        const data = normalizeArtistData(validated)

        // fieldSources: rastrear origem de campos sincronizáveis
        await computeFieldSources(id, validated, data, ctx.adminId)

        // Se mbid foi apagado, deletar álbuns do artista
        let clearedAlbumsCount = 0
        if (validated.mbid === '') {
            const deleted = await prisma.album.deleteMany({ where: { artistId: id } })
            clearedAlbumsCount = deleted.count
        }

        const artist = await prisma.artist.update({
            where: { id },
            data: data as Prisma.ArtistUpdateInput,
            include: { agency: { select: { id: true, name: true } } },
        })

        // Gerenciar membership de grupo
        await manageGroupMembership(id, validated.musicalGroupId)

        // Auto-tradução da bio
        await afterBioWrite(id, validated.bio)

        await logAudit({ adminId: ctx.adminId, action: 'UPDATE', entity: 'Artist', entityId: id, details: `Editou artista "${artist.nameRomanized}"`, ip: ctx.ip })
        log.info('Artist updated', { id, fields: Object.keys(data) })

        return { artist, clearedAlbumsCount }
    },

    async bulkHide(ids: string[], isHidden: boolean, ctx: WriteContext) {
        const { ids: validated } = z.object({ ids: z.array(z.string().min(1)).min(1) }).parse({ ids })
        await prisma.artist.updateMany({ where: { id: { in: validated } }, data: { isHidden } })

        await logAudit({
            adminId: ctx.adminId,
            action: 'UPDATE',
            entity: 'Artist',
            details: `Bulk ${isHidden ? 'ocultou' : 'restaurou'} ${validated.length} artista(s) — IDs: ${validated.join(', ')}`,
            ip: ctx.ip,
        })
        return { updated: validated.length }
    },

    async delete(ids: string[], ctx: WriteContext) {
        const { ids: validated } = z.object({ ids: z.array(z.string().min(1)).min(1) }).parse({ ids })
        const result = await prisma.artist.deleteMany({ where: { id: { in: validated } } })

        await logAudit({ adminId: ctx.adminId, action: 'DELETE', entity: 'Artist', details: `Deletou ${result.count} artista(s) — IDs: ${validated.join(', ')}`, ip: ctx.ip })
        log.info('Artists deleted', { count: result.count })
        return result
    },
}
