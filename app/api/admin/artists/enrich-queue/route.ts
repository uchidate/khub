import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/artists/enrich-queue?q=lisa&filter=incomplete&page=1
 * - q: busca por nome/hangul/slug
 * - filter: "incomplete" (padrão) | "enriched" | "all"
 * - page: paginação (padrão 1, 50 por página)
 */
export async function GET(req: Request) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const q      = searchParams.get('q')?.trim() ?? ''
    const filter = searchParams.get('filter') ?? 'incomplete'
    const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const PAGE_SIZE = 50

    const where: Prisma.ArtistWhereInput = {
        isHidden: false,
        flaggedAsNonKorean: false,
    }

    if (q) {
        where.AND = [
            { OR: [
                { nameRomanized: { contains: q, mode: 'insensitive' } },
                { nameHangul:    { contains: q, mode: 'insensitive' } },
                { slug:          { contains: q, mode: 'insensitive' } },
            ]},
        ]
    }

    if (filter === 'incomplete') {
        const incompleteOr = [
            { bio:              null },
            { analiseEditorial: null },
            { fanInfo:          { equals: Prisma.JsonNull } },
            { awards:           { equals: Prisma.JsonNull } },
        ]
        if (where.AND) {
            (where.AND as Prisma.ArtistWhereInput[]).push({ OR: incompleteOr })
        } else {
            where.OR = incompleteOr
        }
    } else if (filter === 'enriched') {
        where.enrichedAt = { not: null }
    }

    const [total, artists] = await Promise.all([
        prisma.artist.count({ where }),
        prisma.artist.findMany({
            where,
            orderBy: { trendingScore: 'desc' },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
            select: {
                id: true,
                nameRomanized: true,
                nameHangul: true,
                primaryImageUrl: true,
                slug: true,
                trendingScore: true,
                bio: true,
                analiseEditorial: true,
                curiosidades: true,
                height: true,
                bloodType: true,
                fanInfo: true,
                awards: true,
                musicalStyle: true,
                enrichedAt: true,
            },
        }),
    ])

    const result = artists.map(a => ({
        id: a.id,
        nameRomanized: a.nameRomanized,
        nameHangul: a.nameHangul,
        primaryImageUrl: a.primaryImageUrl,
        slug: a.slug,
        trendingScore: a.trendingScore,
        hasBio: !!a.bio && a.bio.length > 80,
        hasEditorial: !!a.analiseEditorial && a.analiseEditorial.length > 80,
        hasCuriosidades: a.curiosidades.length > 0,
        nCuriosidades: a.curiosidades.length,
        hasHeight: !!a.height,
        hasBloodType: !!a.bloodType,
        hasFanInfo: !!a.fanInfo,
        hasAwards: Array.isArray(a.awards) ? (a.awards as unknown[]).length > 0 : !!a.awards,
        hasMusicalStyle: !!a.musicalStyle,
        enrichedAt: a.enrichedAt?.toISOString() ?? null,
    }))

    return NextResponse.json({
        artists: result,
        total,
        page,
        pages: Math.ceil(total / PAGE_SIZE),
        pageSize: PAGE_SIZE,
    })
}
