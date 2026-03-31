/**
 * MusicalGroupRepository
 *
 * Centraliza schema, regras de negócio e hooks para MusicalGroup.
 * Side effects Next.js (revalidatePath) ficam no route handler.
 */

import { z } from 'zod'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { logAudit } from '@/lib/services/audit-service'
import { detectLanguage } from '@/lib/services/language-detection-service'
import { createLogger } from '@/lib/utils/logger'
import { RepositoryError, ListParams, listResult, paginate, WriteContext } from './base'

const log = createLogger('REPO-MUSICAL-GROUP')

// ── Schema ────────────────────────────────────────────────────────────────────

const videoSchema = z.array(z.object({ title: z.string(), url: z.string().min(1) })).optional().nullable()

export const MusicalGroupSchema = z.object({
    name: z.string().min(1).max(100),
    nameHangul: z.string().optional().nullable(),
    mbid: z.string().optional().nullable(),
    bio: z.string().optional().nullable(),
    profileImageUrl: z.string().optional().nullable(),
    debutDate: z.string().optional().nullable(),
    disbandDate: z.string().optional().nullable(),
    agencyId: z.string().optional().nullable(),
    socialLinks: z.record(z.string(), z.string()).optional().nullable(),
    fanClubName: z.string().optional().nullable(),
    officialColor: z.string().optional().nullable(),
    videos: videoSchema,
    isHidden: z.boolean().optional(),
})

export type MusicalGroupInput = z.infer<typeof MusicalGroupSchema>

// ── Helpers de normalização ────────────────────────────────────────────────────

function normalizeJsonFields(validated: Partial<MusicalGroupInput>) {
    const data: Record<string, unknown> = { ...validated }

    if (validated.profileImageUrl !== undefined) {
        data.profileImageUrl = validated.profileImageUrl === '' ? null : validated.profileImageUrl
    }
    if (validated.debutDate !== undefined) {
        data.debutDate = validated.debutDate ? new Date(validated.debutDate) : null
    }
    if (validated.disbandDate !== undefined) {
        data.disbandDate = validated.disbandDate ? new Date(validated.disbandDate) : null
    }
    if (validated.agencyId !== undefined) {
        data.agencyId = validated.agencyId === '' ? null : validated.agencyId
    }
    if (validated.socialLinks !== undefined) {
        const cleaned = validated.socialLinks
            ? Object.fromEntries(Object.entries(validated.socialLinks).filter(([, v]) => v !== ''))
            : null
        data.socialLinks = cleaned && Object.keys(cleaned).length > 0 ? cleaned : Prisma.JsonNull
    }
    if (validated.videos !== undefined) {
        data.videos = validated.videos && validated.videos.length > 0 ? validated.videos : Prisma.JsonNull
    }

    return data
}

// ── Hooks internos ─────────────────────────────────────────────────────────────

async function beforeWrite(data: Partial<MusicalGroupInput>, excludeId?: string) {
    if (data.name) {
        const conflict = await prisma.musicalGroup.findFirst({
            where: {
                name: { equals: data.name, mode: 'insensitive' },
                ...(excludeId ? { id: { not: excludeId } } : {}),
            },
        })
        if (conflict) throw new RepositoryError('Grupo musical já cadastrado com este nome', 'CONFLICT', 409)
    }
}

async function afterWrite(id: string, bio: string | null | undefined) {
    if (!bio) return
    const lang = detectLanguage(bio)
    if (lang !== 'pt') return
    await prisma.contentTranslation.upsert({
        where: { entityType_entityId_field_locale: { entityType: 'group', entityId: id, field: 'bio', locale: 'pt-BR' } },
        create: { entityType: 'group', entityId: id, field: 'bio', locale: 'pt-BR', value: bio, status: 'approved', sourceLang: 'pt' },
        update: { value: bio, status: 'approved', sourceLang: 'pt' },
    }).catch(() => {})
}

// ── Filtros de listagem ────────────────────────────────────────────────────────

export interface MusicalGroupListParams extends ListParams {
    status?: 'active' | 'disbanded' | 'hidden' | string
}

const ALLOWED_SORT = new Set(['name', 'debutDate', 'disbandDate', 'createdAt', 'trendingScore'])

// ── Repository ────────────────────────────────────────────────────────────────

export const MusicalGroupRepository = {

    // ── Read ──────────────────────────────────────────────────────────────────

    async findById(id: string) {
        const group = await prisma.musicalGroup.findUnique({
            where: { id },
            include: { agency: { select: { id: true, name: true } } },
        })
        if (!group) throw new RepositoryError('Grupo não encontrado', 'NOT_FOUND', 404)
        return group
    },

    async findMany(params: MusicalGroupListParams = {}) {
        const { search, status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params
        const { skip, take } = paginate(page, limit)
        const safeSort = ALLOWED_SORT.has(sortBy ?? '') ? sortBy! : 'createdAt'

        const statusWhere: Prisma.MusicalGroupWhereInput =
            status === 'active'    ? { disbandDate: null, isHidden: false } :
            status === 'disbanded' ? { disbandDate: { not: null } } :
            status === 'hidden'    ? { isHidden: true } :
            {}

        const where: Prisma.MusicalGroupWhereInput = {
            ...statusWhere,
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { nameHangul: { contains: search, mode: 'insensitive' } },
                ],
            } : {}),
        }

        const [items, total] = await Promise.all([
            prisma.musicalGroup.findMany({
                where, skip, take,
                orderBy: { [safeSort]: sortOrder },
                include: {
                    agency: { select: { name: true } },
                    _count: { select: { members: true } },
                },
            }),
            prisma.musicalGroup.count({ where }),
        ])

        const data = items.map(g => ({
            ...g,
            agencyName: g.agency?.name ?? null,
            membersCount: g._count.members,
        }))

        return listResult(data, total, page, limit)
    },

    async stats() {
        const [total, active, disbanded, noMembers, hidden] = await Promise.all([
            prisma.musicalGroup.count(),
            prisma.musicalGroup.count({ where: { disbandDate: null, isHidden: false } }),
            prisma.musicalGroup.count({ where: { disbandDate: { not: null } } }),
            prisma.musicalGroup.count({ where: { members: { none: {} } } }),
            prisma.musicalGroup.count({ where: { isHidden: true } }),
        ])
        return { total, active, disbanded, noMembers, hidden }
    },

    // ── Write ─────────────────────────────────────────────────────────────────

    async create(input: unknown, ctx: WriteContext) {
        const validated = MusicalGroupSchema.parse(input)
        await beforeWrite(validated)

        const data = normalizeJsonFields(validated)
        const group = await prisma.musicalGroup.create({ data: data as Prisma.MusicalGroupCreateInput })

        await afterWrite(group.id, validated.bio)
        await logAudit({ adminId: ctx.adminId, action: 'CREATE', entity: 'MusicalGroup', entityId: group.id, after: group, ip: ctx.ip })
        log.info('MusicalGroup created', { id: group.id, name: group.name })
        return group
    },

    async update(id: string, input: unknown, ctx: WriteContext) {
        const before = await prisma.musicalGroup.findUnique({ where: { id } })
        if (!before) throw new RepositoryError('Grupo não encontrado', 'NOT_FOUND', 404)

        const validated = MusicalGroupSchema.partial().parse(input)
        await beforeWrite(validated, id)

        const data = normalizeJsonFields(validated)
        const group = await prisma.musicalGroup.update({ where: { id }, data: data as Prisma.MusicalGroupUpdateInput })

        await afterWrite(id, validated.bio)
        await logAudit({ adminId: ctx.adminId, action: 'UPDATE', entity: 'MusicalGroup', entityId: id, before, after: group, ip: ctx.ip })
        log.info('MusicalGroup updated', { id, fields: Object.keys(data) })
        return group
    },

    async delete(ids: string[], ctx: WriteContext) {
        const { ids: validated } = z.object({ ids: z.array(z.string().min(1)).min(1) }).parse({ ids })

        const withMembers = await prisma.musicalGroup.findMany({
            where: { id: { in: validated } },
            include: { _count: { select: { members: true } } },
        })
        const blocked = withMembers.filter(g => g._count.members > 0)
        if (blocked.length > 0) {
            throw new RepositoryError(
                `Não é possível deletar ${blocked.map(g => `"${g.name}"`).join(', ')} — possuem membros vinculados`,
                'CONSTRAINT', 400
            )
        }

        const result = await prisma.musicalGroup.deleteMany({ where: { id: { in: validated } } })

        await logAudit({ adminId: ctx.adminId, action: 'DELETE', entity: 'MusicalGroup', details: `IDs: ${validated.join(', ')}`, ip: ctx.ip })
        log.info('MusicalGroups deleted', { count: result.count })
        return result
    },
}
