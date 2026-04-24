import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const production = await prisma.production.findFirst({
        where: { id },
        select: { slug: true, id: true },
    }).catch(() => null)

    const target = production?.slug ?? production?.id ?? id
    const base = process.env.NEXTAUTH_URL ?? 'https://www.hallyuhub.com.br'
    return NextResponse.redirect(`${base}/productions/${target}`, { status: 308 })
}
