import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { applyAgeRatingFilter } from '@/lib/utils/age-rating-filter'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '18')))
    const skip = (page - 1) * limit

    const search = searchParams.get('search') || undefined
    const type = searchParams.get('type') || undefined
    const ageRating = searchParams.get('ageRating') || undefined
    const sortBy = searchParams.get('sortBy') || 'newest'

    const where: any = {}

    if (search) {
        where.OR = [
            { titlePt: { contains: search, mode: 'insensitive' } },
            { titleKr: { contains: search, mode: 'insensitive' } },
            { synopsis: { contains: search, mode: 'insensitive' } },
        ]
    }

    if (type) {
        where.type = type
    }

    // Aplicar filtro de classificação etária (respeita SystemSettings + UserContentPreferences)
    const ageRatingFilter = await applyAgeRatingFilter(ageRating)
    Object.assign(where, ageRatingFilter)

    let orderBy: any
    switch (sortBy) {
        case 'rating':
            orderBy = [{ voteAverage: 'desc' }, { year: 'desc' }]
            break
        case 'year':
            orderBy = { year: 'desc' }
            break
        case 'name':
            orderBy = { titlePt: 'asc' }
            break
        case 'newest':
        default:
            orderBy = { createdAt: 'desc' }
    }

    const [productions, total] = await Promise.all([
        prisma.production.findMany({
            where,
            take: limit,
            skip,
            orderBy,
            select: {
                id: true,
                titlePt: true,
                titleKr: true,
                type: true,
                year: true,
                imageUrl: true,
                backdropUrl: true,
                voteAverage: true,
                streamingPlatforms: true,
                ageRating: true,
            }
        }),
        prisma.production.count({ where }),
    ])

    return NextResponse.json({
        productions,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    })
}
