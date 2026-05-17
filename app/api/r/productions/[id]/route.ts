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

    const slug = production?.slug ?? production?.id ?? id
    const base = process.env.NEXTAUTH_URL ?? 'https://www.hallyuhub.com.br'
    // When slug === id (both CUIDs), a plain redirect would loop back into this rewrite.
    // ?_direct=1 bypasses the rewrite (missing condition in next.config.mjs).
    const target = slug === id ? `${slug}?_direct=1` : slug
    return NextResponse.redirect(`${base}/productions/${target}`, { status: 301 })
}
