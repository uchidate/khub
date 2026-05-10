/**
 * AgencyRepository
 *
 * Fonte de verdade para todas as operações em Agency:
 *   - Schema Zod centralizado
 *   - Regras de negócio (unique name, não deletar com artistas)
 *   - Hooks beforeChange / afterChange
 *   - Audit log automático em toda escrita
 *   - Logging estruturado
 *
 * Route handlers ficam como thin wrappers — apenas auth + parse de request.
 */

import { z } from 'zod'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { logAudit } from '@/lib/services/audit-service'
import { createLogger } from '@/lib/utils/logger'
import {
    RepositoryError,
    ListParams,
    listResult,
    paginate,
    WriteContext,
} from './base'

const log = createLogger('REPO-AGENCY')

// ── Schema ────────────────────────────────────────────────────────────────────

export const AgencySchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    website: z.string().url('URL inválida').optional().nullable(),
    description: z.string().optional().nullable(),
    logoUrl: z.string().url('URL inválida').optional().nullable(),
    coverImageUrl: z.string().url('URL inválida').optional().nullable(),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens').optional().nullable(),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve ser hex (#rrggbb)').optional().nullable(),
    type: z.string().default('INDIE'),
    foundedYear: z.number().int().min(1900).max(2100).optional().nullable(),
    country: z.string().length(2, 'Use código ISO de 2 letras').default('KR'),
    ceoName: z.string().optional().nullable(),
    isVerified: z.boolean().default(false),
    parentId: z.string().optional().nullable(),
    socials: z.record(z.string(), z.unknown()).optional().nullable(),
})

export type AgencyInput = z.infer<typeof AgencySchema>

// Tipo retornado com includes padrão
const agencySelect = {
    id: true,
    slug: true,
    name: true,
    description: true,
    accentColor: true,
    type: true,
    foundedYear: true,
    isVerified: true,
    website: true,
    logoUrl: true,
    coverImageUrl: true,
    ceoName: true,
    country: true,
    parentId: true,
    createdAt: true,
    updatedAt: true,
    parent: { select: { id: true, name: true } },
    _count: { select: { artists: true, musicalGroups: true, subsidiaries: true } },
} satisfies Prisma.AgencySelect

// ── Filtros de listagem ───────────────────────────────────────────────────────

export interface AgencyListParams extends ListParams {
    type?: string
    verifiedOnly?: boolean
}

const ALLOWED_SORT = new Set(['name', 'foundedYear', 'createdAt', 'updatedAt'])

// ── Hooks internos ────────────────────────────────────────────────────────────

async function beforeWrite(data: Partial<AgencyInput>, excludeId?: string) {
    // Regra: nome único
    if (data.name) {
        const conflict = await prisma.agency.findFirst({
            where: {
                name: { equals: data.name, mode: 'insensitive' },
                ...(excludeId ? { id: { not: excludeId } } : {}),
            },
        })
        if (conflict) {
            throw new RepositoryError('Agência com este nome já existe', 'CONFLICT', 409)
        }
    }

    // Regra: parentId deve existir (e não pode criar circular reference)
    if (data.parentId) {
        const parent = await prisma.agency.findUnique({ where: { id: data.parentId } })
        if (!parent) {
            throw new RepositoryError('Agência-mãe não encontrada', 'NOT_FOUND', 404)
        }
        if (excludeId && data.parentId === excludeId) {
            throw new RepositoryError('Agência não pode ser seu próprio parent', 'VALIDATION', 422)
        }
    }
}

// ── Repository ────────────────────────────────────────────────────────────────

export const AgencyRepository = {

    // ── Read ──────────────────────────────────────────────────────────────────

    async findById(id: string) {
        const agency = await prisma.agency.findUnique({
            where: { id },
            select: agencySelect,
        })
        if (!agency) throw new RepositoryError('Agência não encontrada', 'NOT_FOUND', 404)
        return agency
    },

    async findMany(params: AgencyListParams = {}) {
        const {
            search, type, verifiedOnly,
            page = 1, limit = 20,
            sortBy = 'createdAt', sortOrder = 'desc',
        } = params

        const { skip, take } = paginate(page, limit)
        const safeSort = ALLOWED_SORT.has(sortBy ?? '') ? sortBy! : 'createdAt'

        const where: Prisma.AgencyWhereInput = {}
        if (verifiedOnly) where.isVerified = true
        if (type && ['MAJOR', 'INDIE', 'SUBSIDIARY'].includes(type)) where.type = type
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ]
        }

        const [data, total] = await Promise.all([
            prisma.agency.findMany({ where, skip, take, orderBy: { [safeSort]: sortOrder }, select: agencySelect }),
            prisma.agency.count({ where }),
        ])

        return listResult(data, total, page, limit)
    },

    /** Lista simplificada para selects/dropdowns */
    async findAllSimple() {
        return prisma.agency.findMany({
            select: { id: true, name: true, type: true },
            orderBy: { name: 'asc' },
        })
    },

    /** Lista pública: apenas agências com artistas, para filtros de busca */
    async findPublicList() {
        return prisma.agency.findMany({
            where: { artists: { some: {} } },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        })
    },

    // ── Write ─────────────────────────────────────────────────────────────────

    async create(input: unknown, ctx: WriteContext) {
        const data = AgencySchema.parse(input)

        await beforeWrite(data)

        const agency = await prisma.agency.create({ data: data as Prisma.AgencyCreateInput })

        await logAudit({
            adminId: ctx.adminId,
            action: 'CREATE',
            entity: 'Agency',
            entityId: agency.id,
            after: agency,
            ip: ctx.ip,
        })

        log.info('Agency created', { id: agency.id, name: agency.name })
        return agency
    },

    async update(id: string, input: unknown, ctx: WriteContext) {
        const before = await prisma.agency.findUnique({ where: { id } })
        if (!before) throw new RepositoryError('Agência não encontrada', 'NOT_FOUND', 404)

        const data = AgencySchema.partial().parse(input)

        await beforeWrite(data, id)

        const agency = await prisma.agency.update({ where: { id }, data: data as Prisma.AgencyUpdateInput })

        await logAudit({
            adminId: ctx.adminId,
            action: 'UPDATE',
            entity: 'Agency',
            entityId: id,
            before,
            after: agency,
            ip: ctx.ip,
        })

        log.info('Agency updated', { id, fields: Object.keys(data) })
        return agency
    },

    async delete(ids: string[], ctx: WriteContext) {
        const { ids: validated } = z.object({ ids: z.array(z.string().min(1)).min(1) }).parse({ ids })

        // Regra: não deletar agências com artistas vinculados
        const withArtists = await prisma.agency.findMany({
            where: { id: { in: validated } },
            include: { _count: { select: { artists: true } } },
        })
        const blocked = withArtists.filter(a => a._count.artists > 0)
        if (blocked.length > 0) {
            throw new RepositoryError(
                `Não é possível deletar ${blocked.map(a => `"${a.name}"`).join(', ')} — possuem artistas vinculados`,
                'CONSTRAINT',
                400
            )
        }

        const result = await prisma.agency.deleteMany({ where: { id: { in: validated } } })

        await logAudit({
            adminId: ctx.adminId,
            action: 'DELETE',
            entity: 'Agency',
            details: `IDs deletados: ${validated.join(', ')}`,
            ip: ctx.ip,
        })

        log.info('Agencies deleted', { count: result.count })
        return result
    },
}
