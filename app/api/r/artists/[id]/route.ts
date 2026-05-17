import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const artist = await prisma.artist.findFirst({
        where: { id },
        select: { slug: true, id: true },
    }).catch(() => null)

    const slug = artist?.slug ?? artist?.id ?? id
    const base = process.env.NEXTAUTH_URL ?? 'https://www.hallyuhub.com.br'
    const target = slug === id ? `${slug}?_direct=1` : slug
    return NextResponse.redirect(`${base}/artists/${target}`, { status: 301 })
}
