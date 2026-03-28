import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '24')))
    const skip = (page - 1) * limit

    const search = searchParams.get('search') || undefined
    const type = searchParams.get('type') || undefined
    const verifiedOnly = searchParams.get('verified') === '1'
    const sortBy = searchParams.get('sortBy') || 'relevance'

    const where: any = {}

    if (verifiedOnly) {
        where.isVerified = true
    }

    if (type && ['MAJOR', 'INDIE', 'SUBSIDIARY'].includes(type)) {
        where.type = type
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ]
    }

    let orderBy: any
    switch (sortBy) {
        case 'name':
            orderBy = { name: 'asc' }
            break
        case 'founded':
            orderBy = [{ foundedYear: 'asc' }]
            break
        case 'relevance':
        default:
            orderBy = [
                { type: 'asc' },
                { musicalGroups: { _count: 'desc' } },
                { artists: { _count: 'desc' } },
            ]
    }

    try {
        const [agencies, total] = await Promise.all([
            prisma.agency.findMany({
                where,
                take: limit,
                skip,
                orderBy,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    accentColor: true,
                    type: true,
                    foundedYear: true,
                    isVerified: true,
                    website: true,
                    parent: { select: { id: true, name: true } },
                    musicalGroups: {
                        select: { id: true, name: true, profileImageUrl: true, disbandDate: true },
                        take: 4,
                        orderBy: { trendingScore: 'desc' },
                    },
                    artists: {
                        where: { isHidden: false, flaggedAsNonKorean: false },
                        select: { id: true, nameRomanized: true, primaryImageUrl: true },
                        take: 5,
                        orderBy: { trendingScore: 'desc' },
                    },
                    _count: { select: { artists: true, musicalGroups: true, subsidiaries: true } },
                },
            }),
            prisma.agency.count({ where }),
        ])

        return NextResponse.json({
            agencies,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
    } catch (error) {
        console.error('[agencies]', error)
        return NextResponse.json({ error: 'Failed to fetch agencies' }, { status: 500 })
    }
}
