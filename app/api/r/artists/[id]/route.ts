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

    const target = artist?.slug ?? artist?.id ?? id
    const base = process.env.NEXTAUTH_URL ?? 'https://www.hallyuhub.com.br'
    return NextResponse.redirect(`${base}/artists/${target}`, { status: 308 })
}
