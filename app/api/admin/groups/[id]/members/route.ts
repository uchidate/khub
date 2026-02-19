import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

const log = createLogger('ADMIN-GROUPS')

const addMemberSchema = z.object({
    artistId: z.string().min(1),
    role: z.string().optional(),
    joinDate: z.string().optional(),
    isActive: z.boolean().optional().default(true),
    position: z.number().int().optional(),
})

const updateMemberSchema = z.object({
    artistId: z.string().min(1),
    role: z.string().optional(),
    leaveDate: z.string().optional(),
    isActive: z.boolean().optional(),
    position: z.number().int().optional(),
})

/** GET /api/admin/groups/[id]/members — lista membros do grupo */
export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const members = await prisma.artistGroupMembership.findMany({
            where: { groupId: params.id },
            include: {
                artist: {
                    select: {
                        id: true,
                        nameRomanized: true,
                        nameHangul: true,
                        primaryImageUrl: true,
                    },
                },
            },
            orderBy: [{ isActive: 'desc' }, { position: 'asc' }, { joinDate: 'asc' }],
        })

        return NextResponse.json({ members })
    } catch (error) {
        log.error('Get group members error', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Erro ao buscar membros' }, { status: 500 })
    }
}

/** POST /api/admin/groups/[id]/members — adiciona membro ao grupo */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const body = await request.json()
        const { artistId, role, joinDate, isActive, position } = addMemberSchema.parse(body)

        const membership = await prisma.artistGroupMembership.upsert({
            where: { artistId_groupId: { artistId, groupId: params.id } },
            create: {
                artistId,
                groupId: params.id,
                role: role || null,
                joinDate: joinDate ? new Date(joinDate) : null,
                isActive: isActive ?? true,
                position: position ?? null,
            },
            update: {
                role: role || null,
                joinDate: joinDate ? new Date(joinDate) : null,
                isActive: isActive ?? true,
                position: position ?? null,
                leaveDate: null,
            },
            include: {
                artist: { select: { id: true, nameRomanized: true, primaryImageUrl: true } },
            },
        })

        log.info('Member added to group', { groupId: params.id, artistId })
        return NextResponse.json({ membership })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
        }
        log.error('Add group member error', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Erro ao adicionar membro' }, { status: 500 })
    }
}

/** PATCH /api/admin/groups/[id]/members — atualiza membro (ex: marcar como ex-membro) */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const body = await request.json()
        const { artistId, role, leaveDate, isActive, position } = updateMemberSchema.parse(body)

        const membership = await prisma.artistGroupMembership.update({
            where: { artistId_groupId: { artistId, groupId: params.id } },
            data: {
                role: role !== undefined ? role || null : undefined,
                leaveDate: leaveDate !== undefined ? (leaveDate ? new Date(leaveDate) : null) : undefined,
                isActive: isActive !== undefined ? isActive : undefined,
                position: position !== undefined ? position : undefined,
            },
        })

        log.info('Group member updated', { groupId: params.id, artistId })
        return NextResponse.json({ membership })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
        }
        log.error('Update group member error', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Erro ao atualizar membro' }, { status: 500 })
    }
}

/** DELETE /api/admin/groups/[id]/members?artistId=xxx — remove membro do grupo */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const artistId = request.nextUrl.searchParams.get('artistId')
        if (!artistId) {
            return NextResponse.json({ error: 'artistId é obrigatório' }, { status: 400 })
        }

        await prisma.artistGroupMembership.delete({
            where: { artistId_groupId: { artistId, groupId: params.id } },
        })

        log.info('Member removed from group', { groupId: params.id, artistId })
        return NextResponse.json({ success: true })
    } catch (error) {
        log.error('Remove group member error', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Erro ao remover membro' }, { status: 500 })
    }
}
