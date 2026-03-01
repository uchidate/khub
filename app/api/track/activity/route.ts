import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

const ALLOWED_TYPES = ['FAVORITE_ADD', 'FAVORITE_REMOVE', 'COMMENT_CREATE', 'PROFILE_UPDATE', 'PAGE_VIEW'] as const

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 })

        const body = await req.json()
        const { type, entityId, entityType, metadata } = body

        if (!ALLOWED_TYPES.includes(type)) {
            return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
        }

        await prisma.activity.create({
            data: {
                userId: session.user.id,
                type,
                entityId: entityId ?? null,
                entityType: entityType ?? null,
                metadata: metadata ?? null,
            },
        })

        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ ok: false }, { status: 500 })
    }
}
