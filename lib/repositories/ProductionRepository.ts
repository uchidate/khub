/**
 * ProductionRepository
 *
 * Centraliza schema, regras de negócio e hooks para Production.
 * Side effects Next.js (revalidatePath, getArtistVisibilityService) ficam no route handler.
 */

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { logAudit } from '@/lib/services/audit-service'
import { detectLanguage } from '@/lib/services/language-detection-service'
import { createLogger } from '@/lib/utils/logger'
import { RepositoryError, ListParams, listResult, paginate, WriteContext } from './base'

const log = createLogger('REPO-PRODUCTION')

// ── Schema ────────────────────────────────────────────────────────────────────

const cleanStringArray = z.array(z.unknown())
    .transform(arr => arr.map(v => String(v ?? '')).filter(s => s.trim() !== '' && s !== '0' && s !== 'null' && s !== 'undefined'))
    .optional().default([])

const cleanUrlArray = z.array(z.unknown())
    .transform(arr => arr.map(v => String(v ?? '')).filter(s => s.startsWith('http')))
    .optional().default([])

export const ProductionSchema = z.object({
    titlePt: z.string().optional().nullable(),
    titleKr: z.string().min(1),
    type: z.string().min(1),
    year: z.number().int().min(1900).max(2100).optional().nullable(),
    releaseDate: z.string().optional().nullable().transform(v => (v === '' || v == null) ? null : v),
    tagline: z.string().optional().nullable(),
    synopsis: z.string().optional().nullable(),
    synopsisSource: z.enum(['tmdb_pt', 'tmdb_en', 'ai', 'manual']).optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
    backdropUrl: z.string().url().optional().nullable(),
    galleryUrls: cleanUrlArray,
    streamingPlatforms: cleanStringArray,
    sourceUrls: cleanUrlArray,
    tags: cleanStringArray,
    trailerUrl: z.string().url().optional().nullable(),
    ageRating: z.enum(['L', '10', '12', '14', '16', '18']).optional().nullable(),
    runtime: z.number().int().optional().nullable(),
    episodeCount: z.number().int().optional().nullable(),
    seasonCount: z.number().int().optional().nullable(),
    episodeRuntime: z.number().int().optional().nullable(),
    voteAverage: z.coerce.number().optional().nullable(),
    productionStatus: z.string().optional().nullable(),
    network: z.string().optional().nullable(),
    tmdbId: z.string().optional().nullable(),
    tmdbType: z.string().optional().nullable(),
    editorialReview: z.string().optional().nullable(),
    editorialRating: z.coerce.number().min(0).max(10).optional().nullable(),
    whyWatch: z.string().optional().nullable(),
    translationStatus: z.enum(['pending', 'completed', 'skipped']).optional(),
    isHidden: z.boolean().optional(),
    needsCuration: z.boolean().optional(),
    flaggedAsNonKorean: z.boolean().optional(),
    isAdultContent: z.boolean().optional().nullable(),
    adultContentType: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
})

export type ProductionInput = z.infer<typeof ProductionSchema>

// ── Filtros de listagem ────────────────────────────────────────────────────────

export interface ProductionListParams extends ListParams {
    filter?: string
}

const ALLOWED_SORT = new Set(['titlePt', 'year', 'releaseDate', 'createdAt', 'updatedAt', 'voteAverage'])

// ── Hook: synopsis translation ────────────────────────────────────────────────

async function afterSynopsis(id: string, synopsis: string | null | undefined, synopsisSource?: string | null) {
    if (synopsis === undefined) return

    if (synopsis) {
        const isPt = synopsisSource === 'tmdb_pt' || detectLanguage(synopsis) === 'pt'
        if (isPt) {
            await prisma.contentTranslation.upsert({
                where: { entityType_entityId_field_locale: { entityType: 'production', entityId: id, field: 'synopsis', locale: 'pt-BR' } },
                create: { entityType: 'production', entityId: id, field: 'synopsis', locale: 'pt-BR', value: synopsis, status: 'approved', sourceLang: 'pt' },
                update: { value: synopsis, status: 'approved', sourceLang: 'pt' },
            }).catch(() => {})
            await prisma.production.update({ where: { id }, data: { translationStatus: 'completed', translatedAt: new Date() } }).catch(() => {})
        } else {
            await prisma.production.update({ where: { id }, data: { translationStatus: 'pending', translatedAt: null } }).catch(() => {})
        }
    } else {
        await prisma.production.update({ where: { id }, data: { translationStatus: 'pending', translatedAt: null } }).catch(() => {})
    }
}

// ── Repository ────────────────────────────────────────────────────────────────

export const ProductionRepository = {

    // ── Read ──────────────────────────────────────────────────────────────────

    async findById(id: string) {
        const production = await prisma.production.findUnique({ where: { id } })
        if (!production) throw new RepositoryError('Produção não encontrada', 'NOT_FOUND', 404)
        return production
    },

    async findMany(params: ProductionListParams = {}) {
        const { search, filter, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params
        const { skip, take } = paginate(page, limit)
        const safeSort = ALLOWED_SORT.has(sortBy ?? '') ? sortBy! : 'createdAt'

        const filterWhere =
            filter === 'no_cast'             ? { artists: { none: {} } }
            : filter === 'no_cast_pending'   ? { artists: { none: {} }, tmdbId: { not: null }, castSyncAt: null }
            : filter === 'no_cast_attempted' ? { artists: { none: {} }, tmdbId: { not: null }, castSyncAt: { not: null } }
            : filter === 'no_cast_no_tmdb'   ? { artists: { none: {} }, tmdbId: null }
            : filter === 'no_rating'           ? { ageRating: null }
            : filter === 'no_rating_pending'   ? { ageRating: null, tmdbId: { not: null }, ageRatingSyncAt: null }
            : filter === 'no_rating_attempted' ? { ageRating: null, tmdbId: { not: null }, ageRatingSyncAt: { not: null } }
            : filter === 'no_rating_no_tmdb'   ? { ageRating: null, tmdbId: null }
            : filter === 'no_tmdb'  ? { tmdbId: null }
            : filter === 'has_tmdb' ? { tmdbId: { not: null as null } }
            : filter === 'hidden_from_public' ? {
                isHidden: false,
                OR: [{ ageRating: null }, { ageRating: '18' }, { flaggedAsNonKorean: true }],
            }
            : {}

        const where = search
            ? { AND: [filterWhere, { OR: [{ titlePt: { contains: search, mode: 'insensitive' as const } }, { titleKr: { contains: search, mode: 'insensitive' as const } }] }] }
            : filterWhere

        const [items, total] = await Promise.all([
            prisma.production.findMany({
                where, skip, take,
                orderBy: { [safeSort]: sortOrder },
                include: { _count: { select: { artists: true } } },
            }),
            prisma.production.count({ where }),
        ])

        const data = items.map(p => ({ ...p, artistsCount: p._count.artists }))
        return listResult(data, total, page, limit)
    },

    // ── Write ─────────────────────────────────────────────────────────────────

    async create(input: unknown, ctx: WriteContext) {
        const validated = ProductionSchema.parse(input)
        const titlePt = (validated.titlePt?.trim() || validated.titleKr).trim()

        const production = await prisma.production.create({
            data: { ...validated, titlePt } as Parameters<typeof prisma.production.create>[0]['data'],
        })

        await logAudit({ adminId: ctx.adminId, action: 'CREATE', entity: 'Production', entityId: production.id, ip: ctx.ip })
        log.info('Production created', { id: production.id, titlePt })
        return production
    },

    /**
     * Returns the updated production plus metadata for the route handler:
     *   - `visibilityChanged`: route handler deve chamar getArtistVisibilityService
     *   - `linkedArtistIds`: lista de artistas para reavaliar visibilidade
     */
    async update(id: string, input: unknown, ctx: WriteContext) {
        const before = await prisma.production.findUnique({ where: { id } })
        if (!before) throw new RepositoryError('Produção não encontrada', 'NOT_FOUND', 404)

        const validated = ProductionSchema.partial().parse(input)

        // Regra: produção com takedown ativo não pode ser restaurada aqui
        if (validated.isHidden === false && before.isTakenDown) {
            throw new RepositoryError(
                'Produção com takedown legal ativo não pode ser restaurada por este endpoint. Use /api/admin/productions/[id]/restore.',
                'CONSTRAINT', 409
            )
        }

        // Regra: se synopsis foi editada manualmente, marcar source como 'manual'
        const resolvedSynopsisSource = validated.synopsis !== undefined && !validated.synopsisSource
            ? 'manual'
            : validated.synopsisSource

        const resolvedTitleKr = validated.titleKr ?? before.titleKr
        const resolvedTitlePt = (validated.titlePt !== undefined || validated.titleKr !== undefined)
            ? (validated.titlePt?.trim() || resolvedTitleKr || before.titlePt).trim()
            : before.titlePt

        const production = await prisma.production.update({
            where: { id },
            data: { ...validated, titlePt: resolvedTitlePt, synopsisSource: resolvedSynopsisSource } as Parameters<typeof prisma.production.update>[0]['data'],
        })

        // Hook: tradução de synopsis
        await afterSynopsis(id, validated.synopsis, resolvedSynopsisSource)

        await logAudit({ adminId: ctx.adminId, action: 'UPDATE', entity: 'Production', entityId: id, before, after: production, ip: ctx.ip })
        log.info('Production updated', { id, fields: Object.keys(validated) })

        // Metadados para o route handler tratar side effects Next.js
        const visibilityChanged = validated.isHidden !== undefined && validated.isHidden !== before.isHidden
        let linkedArtistIds: string[] = []
        if (visibilityChanged) {
            const linked = await prisma.artistProduction.findMany({ where: { productionId: id }, select: { artistId: true } })
            linkedArtistIds = linked.map(a => a.artistId)
        }

        return { production, visibilityChanged, linkedArtistIds }
    },

    async delete(ids: string[], ctx: WriteContext) {
        const { ids: validated } = z.object({ ids: z.array(z.string().min(1)).min(1) }).parse({ ids })
        const result = await prisma.production.deleteMany({ where: { id: { in: validated } } })

        await logAudit({ adminId: ctx.adminId, action: 'DELETE', entity: 'Production', details: `IDs: ${validated.join(', ')}`, ip: ctx.ip })
        log.info('Productions deleted', { count: result.count })
        return result
    },
}
