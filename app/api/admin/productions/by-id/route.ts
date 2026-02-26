import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-helpers'

export async function GET(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const production = await prisma.production.findUnique({
        where: { id },
        select: {
            id: true,
            titlePt: true,
            titleKr: true,
            type: true,
            year: true,
            tagline: true,
            synopsis: true,
            imageUrl: true,
            trailerUrl: true,
            tags: true,
            ageRating: true,
            tmdbId: true,
        },
    })

    if (!production) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(production)
}
