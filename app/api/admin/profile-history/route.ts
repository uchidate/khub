import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

const PROFILE_ENTITIES = new Set(['Artist', 'MusicalGroup', 'Production'])

export async function GET(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const entity = req.nextUrl.searchParams.get('entity') ?? ''
    const entityId = req.nextUrl.searchParams.get('entityId') ?? ''
    const rawLimit = Number(req.nextUrl.searchParams.get('limit') ?? 20)
    const limit = Number.isFinite(rawLimit) ? Math.min(50, Math.max(1, rawLimit)) : 20

    if (!PROFILE_ENTITIES.has(entity)) {
        return NextResponse.json({ error: 'Entidade inválida' }, { status: 400 })
    }

    if (!entityId) {
        return NextResponse.json({ error: 'entityId obrigatório' }, { status: 400 })
    }

    const logs = await prisma.auditLog.findMany({
        where: { entity, entityId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { admin: { select: { id: true, name: true, email: true, image: true } } },
    })

    return NextResponse.json({ logs })
}
