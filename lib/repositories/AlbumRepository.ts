/**
 * AlbumRepository
 *
 * Centraliza schema, regras de negócio e hooks para Album.
 * Side effects Next.js ficam no route handler.
 */

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { logAudit } from '@/lib/services/audit-service'
import { createLogger } from '@/lib/utils/logger'
import { RepositoryError, ListParams, listResult, paginate, WriteContext } from './base'

const log = createLogger('REPO-ALBUM')

// ── Schema ────────────────────────────────────────────────────────────────────

export const AlbumSchema = z.object({
    title: z.string().min(1),
    type: z.enum(['ALBUM', 'EP', 'SINGLE', 'MINI_ALBUM', 'FULL_ALBUM', 'OST', 'REPACKAGE', 'COMPILATION']),
    releaseDate: z.string().optional().nullable(),
    coverUrl: z.string().url().optional().nullable(),
    spotifyUrl: z.string().url().optional().nullable(),
    appleMusicUrl: z.string().url().optional().nullable(),
    youtubeUrl: z.string().url().optional().nullable(),
    artistId: z.string().min(1),
})

export type AlbumInput = z.infer<typeof AlbumSchema>

// ── Filtros de listagem ────────────────────────────────────────────────────────

export interface AlbumListParams extends ListParams {
    artistId?: string
}

const ALLOWED_SORT = new Set(['title', 'releaseDate', 'createdAt', 'type'])

// ── Hook: validar artista existe ───────────────────────────────────────────────

async function validateArtist(artistId: string) {
    const artist = await prisma.artist.findUnique({ where: { id: artistId } })
    if (!artist) throw new RepositoryError('Artista não encontrado', 'NOT_FOUND', 404)
}

// ── Repository ────────────────────────────────────────────────────────────────

export const AlbumRepository = {

    // ── Read ──────────────────────────────────────────────────────────────────

    async findById(id: string) {
        const album = await prisma.album.findUnique({
            where: { id },
            include: { artist: { select: { id: true, nameRomanized: true } } },
        })
        if (!album) throw new RepositoryError('Álbum não encontrado', 'NOT_FOUND', 404)
        return album
    },

    async findMany(params: AlbumListParams = {}) {
        const { search, artistId, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params
        const { skip, take } = paginate(page, limit)
        const safeSort = ALLOWED_SORT.has(sortBy ?? '') ? sortBy! : 'createdAt'

        const where = {
            ...(artistId ? { artistId } : {}),
            ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' as const } }] } : {}),
        }

        const [items, total] = await Promise.all([
            prisma.album.findMany({
                where, skip, take,
                orderBy: { [safeSort]: sortOrder },
                include: { artist: { select: { id: true, nameRomanized: true } } },
            }),
            prisma.album.count({ where }),
        ])

        const data = items.map(a => ({ ...a, artistName: a.artist.nameRomanized }))
        return listResult(data, total, page, limit)
    },

    // ── Write ─────────────────────────────────────────────────────────────────

    async create(input: unknown, ctx: WriteContext) {
        const validated = AlbumSchema.parse(input)
        await validateArtist(validated.artistId)

        const album = await prisma.album.create({
            data: {
                ...validated,
                releaseDate: validated.releaseDate ? new Date(validated.releaseDate) : null,
            } as Parameters<typeof prisma.album.create>[0]['data'],
            include: { artist: { select: { id: true, nameRomanized: true } } },
        })

        await logAudit({ adminId: ctx.adminId, action: 'CREATE', entity: 'Album', entityId: album.id, after: album, ip: ctx.ip })
        log.info('Album created', { id: album.id, title: album.title })
        return album
    },

    async update(id: string, input: unknown, ctx: WriteContext) {
        const before = await prisma.album.findUnique({ where: { id } })
        if (!before) throw new RepositoryError('Álbum não encontrado', 'NOT_FOUND', 404)

        const validated = AlbumSchema.partial().parse(input)
        if (validated.artistId) await validateArtist(validated.artistId)

        const album = await prisma.album.update({
            where: { id },
            data: {
                ...validated,
                ...(validated.releaseDate !== undefined
                    ? { releaseDate: validated.releaseDate ? new Date(validated.releaseDate) : null }
                    : {}),
            } as Parameters<typeof prisma.album.update>[0]['data'],
            include: { artist: { select: { id: true, nameRomanized: true } } },
        })

        await logAudit({ adminId: ctx.adminId, action: 'UPDATE', entity: 'Album', entityId: id, before, after: album, ip: ctx.ip })
        log.info('Album updated', { id, fields: Object.keys(validated) })
        return album
    },

    async delete(ids: string[], ctx: WriteContext) {
        const { ids: validated } = z.object({ ids: z.array(z.string().min(1)).min(1) }).parse({ ids })
        const result = await prisma.album.deleteMany({ where: { id: { in: validated } } })

        await logAudit({ adminId: ctx.adminId, action: 'DELETE', entity: 'Album', details: `IDs: ${validated.join(', ')}`, ip: ctx.ip })
        log.info('Albums deleted', { count: result.count })
        return result
    },
}
