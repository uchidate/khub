/**
 * UserRepository
 *
 * Centraliza schema, regras de negócio e hooks para User.
 * Side effects Next.js ficam no route handler.
 */

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { logAudit } from '@/lib/services/audit-service'
import { createLogger } from '@/lib/utils/logger'
import { RepositoryError, ListParams, listResult, paginate, WriteContext } from './base'

const log = createLogger('REPO-USER')

// ── Schema ────────────────────────────────────────────────────────────────────

export const UserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    role: z.enum(['user', 'admin']).default('user'),
})

export type UserInput = z.infer<typeof UserSchema>

// ── Select padrão ──────────────────────────────────────────────────────────────

const userSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    emailVerified: true,
    createdAt: true,
    updatedAt: true,
    _count: { select: { favorites: true } },
} as const

const ALLOWED_SORT = new Set(['name', 'email', 'createdAt', 'updatedAt'])

// ── Repository ────────────────────────────────────────────────────────────────

export const UserRepository = {

    // ── Read ──────────────────────────────────────────────────────────────────

    async findMany(params: ListParams & { role?: string } = {}) {
        const { search, role, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params
        const { skip, take } = paginate(page, limit)
        const safeSort = ALLOWED_SORT.has(sortBy ?? '') ? sortBy! : 'createdAt'

        const where = {
            ...(role ? { role } : {}),
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                ],
            } : {}),
        }

        const [items, total] = await Promise.all([
            prisma.user.findMany({ where, skip, take, orderBy: { [safeSort]: sortOrder }, select: userSelect }),
            prisma.user.count({ where }),
        ])

        const data = items.map(u => ({ ...u, favoritesCount: u._count.favorites }))
        return listResult(data, total, page, limit)
    },

    async stats() {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const [total, admins, verified, newThisWeek] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: 'admin' } }),
            prisma.user.count({ where: { emailVerified: { not: null } } }),
            prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
        ])
        return { total, admins, verified, newThisWeek }
    },

    // ── Write ─────────────────────────────────────────────────────────────────

    async create(input: unknown, ctx: WriteContext) {
        const validated = UserSchema.parse(input)

        const existing = await prisma.user.findUnique({ where: { email: validated.email } })
        if (existing) throw new RepositoryError('Email já cadastrado', 'CONFLICT', 409)

        const user = await prisma.user.create({
            data: { name: validated.name, email: validated.email, role: validated.role },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        })

        await logAudit({ adminId: ctx.adminId, action: 'CREATE', entity: 'User', entityId: user.id, after: user, ip: ctx.ip })
        log.info('User created', { id: user.id, email: user.email })
        return user
    },

    async update(id: string, input: unknown, ctx: WriteContext) {
        const before = await prisma.user.findUnique({ where: { id } })
        if (!before) throw new RepositoryError('Usuário não encontrado', 'NOT_FOUND', 404)

        const validated = UserSchema.partial().parse(input)

        if (validated.email && validated.email !== before.email) {
            const conflict = await prisma.user.findUnique({ where: { email: validated.email } })
            if (conflict) throw new RepositoryError('Email já cadastrado', 'CONFLICT', 409)
        }

        const user = await prisma.user.update({
            where: { id },
            data: validated,
            select: { id: true, name: true, email: true, role: true, updatedAt: true },
        })

        await logAudit({ adminId: ctx.adminId, action: 'UPDATE', entity: 'User', entityId: id, details: `Atualizou "${user.name}" — papel: ${user.role}`, ip: ctx.ip })
        log.info('User updated', { id, fields: Object.keys(validated) })
        return user
    },

    async delete(ids: string[], callerAdminId: string, ctx: WriteContext) {
        const { ids: validated } = z.object({ ids: z.array(z.string().min(1)).min(1) }).parse({ ids })

        // Regra: admin não pode deletar a própria conta
        if (validated.includes(callerAdminId)) {
            throw new RepositoryError('Você não pode deletar sua própria conta', 'CONSTRAINT', 400)
        }

        const result = await prisma.user.deleteMany({ where: { id: { in: validated } } })

        await logAudit({ adminId: ctx.adminId, action: 'DELETE', entity: 'User', details: `IDs: ${validated.join(', ')}`, ip: ctx.ip })
        log.info('Users deleted', { count: result.count })
        return result
    },
}
