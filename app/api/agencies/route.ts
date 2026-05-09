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

    // Para relevância, buscamos tudo e ordenamos em JS
    // (Prisma não suporta CASE WHEN em orderBy)
    const TYPE_ORDER: Record<string, number> = { MAJOR: 0, SUBSIDIARY: 1, INDIE: 2 }

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
                { musicalGroups: { _count: 'desc' } },
                { artists: { _count: 'desc' } },
            ]
    }

    try {
        const [agencies, total] = await Promise.all([
            prisma.agency.findMany({
                where,
                take: sortBy === 'relevance' ? undefined : limit,
                skip: sortBy === 'relevance' ? undefined : skip,
                orderBy,
                select: {
                    id: true,
                    slug: true,
                    name: true,
                    description: true,
                    accentColor: true,
                    type: true,
                    foundedYear: true,
                    isVerified: true,
                    website: true,
                    parent: { select: { id: true, slug: true, name: true } },
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
                    subsidiaries: {
                        select: {
                            id: true,
                            name: true,
                            accentColor: true,
                            _count: { select: { artists: true, musicalGroups: true } },
                            musicalGroups: {
                                select: { id: true, name: true, profileImageUrl: true, disbandDate: true },
                                orderBy: { trendingScore: 'desc' },
                                take: 3,
                                where: { disbandDate: null },
                            },
                        },
                        orderBy: { name: 'asc' },
                    },
                    _count: { select: { artists: true, musicalGroups: true, subsidiaries: true } },
                },
            }),
            prisma.agency.count({ where }),
        ])

        // Ordenação por importância: MAJOR → SUBSIDIARY → INDIE, depois por volume
        const sorted = sortBy === 'relevance'
            ? [...agencies].sort((a, b) => {
                const ta = TYPE_ORDER[a.type] ?? 3
                const tb = TYPE_ORDER[b.type] ?? 3
                if (ta !== tb) return ta - tb
                const sa = a._count.musicalGroups * 2 + a._count.artists
                const sb = b._count.musicalGroups * 2 + b._count.artists
                return sb - sa
            }).slice(skip, skip + limit)
            : agencies

        // Add aggregated totals for parent agencies (e.g. HYBE has 0 direct artists but many via sub-labels)
        const withTotals = sorted.map(a => ({
            ...a,
            _totalArtists: a._count.artists + a.subsidiaries.reduce((s, sub) => s + sub._count.artists, 0),
            _totalGroups:  a._count.musicalGroups + a.subsidiaries.reduce((s, sub) => s + sub._count.musicalGroups, 0),
        }))

        return NextResponse.json({
            agencies: withTotals,
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
