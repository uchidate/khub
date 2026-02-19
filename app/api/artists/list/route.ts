import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('ARTISTS')

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '24')))
    const skip = (page - 1) * limit

    // Filtros
    const search = searchParams.get('search') || undefined
    const role = searchParams.get('role') || undefined
    const groupId = searchParams.get('groupId') || undefined
    const memberType = searchParams.get('memberType') || undefined // 'solo' | 'group'
    const sortBy = searchParams.get('sortBy') || 'trending'

    // Construir where clause
    const where: any = {}

    if (search) {
        where.OR = [
            { nameRomanized: { contains: search, mode: 'insensitive' } },
            { nameHangul: { contains: search, mode: 'insensitive' } },
            { stageNames: { has: search } },
        ]
    }

    if (role) {
        where.roles = { has: role }
    }

    if (groupId) {
        where.memberships = { some: { groupId, isActive: true } }
    }

    if (memberType === 'group') {
        where.memberships = { some: { isActive: true } }
    } else if (memberType === 'solo') {
        where.memberships = { none: { isActive: true } }
    }

    // Construir orderBy
    let orderBy: any

    switch (sortBy) {
        case 'name':
            orderBy = { nameRomanized: 'asc' }
            break
        case 'newest':
            orderBy = { createdAt: 'desc' }
            break
        case 'trending':
        default:
            orderBy = { trendingScore: 'desc' }
            break
    }

    try {
        const [artists, total] = await Promise.all([
            prisma.artist.findMany({
                where,
                take: limit,
                skip,
                orderBy,
                select: {
                    id: true,
                    nameRomanized: true,
                    nameHangul: true,
                    primaryImageUrl: true,
                    roles: true,
                    memberships: {
                        where: { isActive: true },
                        select: { group: { select: { id: true, name: true } } },
                        take: 1,
                    },
                }
            }),
            prisma.artist.count({ where }),
        ])

        return NextResponse.json({
            artists,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
            filters: { search, role, sortBy },
        })
    } catch (error: unknown) {
        log.error('Error fetching artists', { error: getErrorMessage(error) })
        return NextResponse.json(
            { error: 'Failed to fetch artists' },
            { status: 500 }
        )
    }
}
