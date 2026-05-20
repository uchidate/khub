import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const q      = searchParams.get('q')?.trim() ?? ''
    const filter = searchParams.get('filter') ?? 'incomplete'
    const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const PAGE_SIZE = 50

    const where: Prisma.MusicalGroupWhereInput = {
        isHidden: false,
    }

    if (q) {
        where.AND = [
            { OR: [
                { name:       { contains: q, mode: 'insensitive' } },
                { nameHangul: { contains: q, mode: 'insensitive' } },
                { slug:       { contains: q, mode: 'insensitive' } },
            ]},
        ]
    }

    if (filter === 'incomplete') {
        const incompleteOr: Prisma.MusicalGroupWhereInput[] = [
            { bio: null },
            { analiseEditorial: null },
            { fanClubName: null },
        ]
        if (where.AND) {
            (where.AND as Prisma.MusicalGroupWhereInput[]).push({ OR: incompleteOr })
        } else {
            where.OR = incompleteOr
        }
    } else if (filter === 'enriched') {
        where.editorialGeneratedAt = { not: null }
    }

    const [total, groups] = await Promise.all([
        prisma.musicalGroup.count({ where }),
        prisma.musicalGroup.findMany({
            where,
            orderBy: { trendingScore: 'desc' },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
            select: {
                id: true,
                name: true,
                nameHangul: true,
                profileImageUrl: true,
                slug: true,
                trendingScore: true,
                bio: true,
                analiseEditorial: true,
                curiosidades: true,
                fanClubName: true,
                officialColor: true,
                socialLinks: true,
                editorialGeneratedAt: true,
            },
        }),
    ])

    const result = groups.map(g => ({
        id: g.id,
        name: g.name,
        nameHangul: g.nameHangul,
        profileImageUrl: g.profileImageUrl,
        slug: g.slug,
        trendingScore: g.trendingScore,
        hasBio: !!g.bio && g.bio.length > 80,
        hasEditorial: !!g.analiseEditorial && g.analiseEditorial.length > 80,
        hasCuriosidades: g.curiosidades.length > 0,
        nCuriosidades: g.curiosidades.length,
        hasFanInfo: !!g.fanClubName,
        hasColor: !!g.officialColor,
        hasSocialLinks: !!g.socialLinks,
        enrichedAt: g.editorialGeneratedAt?.toISOString() ?? null,
    }))

    return NextResponse.json({
        groups: result,
        total,
        page,
        pages: Math.ceil(total / PAGE_SIZE),
        pageSize: PAGE_SIZE,
    })
}
