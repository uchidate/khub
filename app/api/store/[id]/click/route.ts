import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/store/[id]/click — incrementa contador de clique (público, sem auth)
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    try {
        await prisma.storeProduct.update({
            where: { id },
            data: { clickCount: { increment: 1 } },
        })
        return NextResponse.json({ ok: true })
    } catch {
        // Silencia erro se produto não existir — não bloqueia o redirect
        return NextResponse.json({ ok: false })
    }
}
