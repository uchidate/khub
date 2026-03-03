import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('PRODUCTIONS-WATCH')

/**
 * GET /api/productions/[id]/watch
 * Returns the current user's WatchEntry for this production (or null).
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ entry: null })
    }

    const entry = await prisma.watchEntry.findUnique({
        where: { userId_productionId: { userId: session.user.id, productionId: params.id } },
        select: { id: true, status: true, rating: true, notes: true, watchedAt: true, createdAt: true, updatedAt: true },
    })

    return NextResponse.json({ entry })
}

/**
 * POST /api/productions/[id]/watch
 * Upserts a WatchEntry for the current user.
 * Body: { status, rating?, notes?, watchedAt? }
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
        }

        const body = await request.json()
        const { status, rating, notes, watchedAt } = body

        if (!['WANT_TO_WATCH', 'WATCHING', 'WATCHED', 'DROPPED'].includes(status)) {
            return NextResponse.json({ success: false, error: 'Status inválido' }, { status: 400 })
        }

        if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
            return NextResponse.json({ success: false, error: 'Avaliação deve ser entre 1 e 5' }, { status: 400 })
        }

        const data = {
            status,
            rating: rating ?? null,
            notes: notes ?? null,
            watchedAt: watchedAt ? new Date(watchedAt) : (status === 'WATCHED' ? new Date() : null),
        }

        const entry = await prisma.watchEntry.upsert({
            where: { userId_productionId: { userId: session.user.id, productionId: params.id } },
            create: { userId: session.user.id, productionId: params.id, ...data },
            update: data,
            select: { id: true, status: true, rating: true, notes: true, watchedAt: true, updatedAt: true },
        })

        return NextResponse.json({ success: true, entry })
    } catch (error) {
        log.error('Watch entry upsert error', { error: getErrorMessage(error) })
        return NextResponse.json({ success: false }, { status: 500 })
    }
}

/**
 * DELETE /api/productions/[id]/watch
 * Removes the current user's WatchEntry for this production.
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
        }

        await prisma.watchEntry.deleteMany({
            where: { userId: session.user.id, productionId: params.id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        log.error('Watch entry delete error', { error: getErrorMessage(error) })
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
