import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const q        = searchParams.get('q')?.trim() ?? ''
    const filter   = searchParams.get('filter') ?? 'incomplete'
    const typeFilter = searchParams.get('type') ?? 'all'
    const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const PAGE_SIZE = 50

    const where: Prisma.ProductionWhereInput = {
        isHidden: false,
        flaggedAsNonKorean: false,
    }

    if (q) {
        where.OR = [
            { titlePt: { contains: q, mode: 'insensitive' } },
            { titleKr: { contains: q, mode: 'insensitive' } },
        ]
    }

    if (typeFilter !== 'all') {
        where.type = typeFilter
    }

    if (filter === 'incomplete') {
        where.AND = [
            {
                OR: [
                    { whyWatch: null },
                    { editorialReview: null },
                    { editorialRating: null },
                ],
            },
        ]
    } else if (filter === 'enriched') {
        where.enrichedAt = { not: null }
    }

    const [total, productions] = await Promise.all([
        prisma.production.count({ where }),
        prisma.production.findMany({
            where,
            orderBy: { releaseDate: 'desc' },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
            select: {
                id: true,
                titlePt: true,
                titleKr: true,
                type: true,
                year: true,
                network: true,
                imageUrl: true,
                voteAverage: true,
                episodeCount: true,
                synopsis: true,
                tagline: true,
                whyWatch: true,
                editorialReview: true,
                editorialRating: true,
                curiosidades: true,
                enrichedAt: true,
            },
        }),
    ])

    const result = productions.map(p => ({
        id: p.id,
        titlePt: p.titlePt,
        titleKr: p.titleKr,
        type: p.type,
        year: p.year,
        network: p.network,
        imageUrl: p.imageUrl,
        voteAverage: p.voteAverage,
        episodeCount: p.episodeCount,
        hasSynopsis: !!p.synopsis,
        hasTagline: !!p.tagline,
        hasWhyWatch: !!p.whyWatch,
        hasEditorialReview: !!p.editorialReview,
        hasEditorialRating: p.editorialRating != null,
        hasCuriosidades: p.curiosidades.length > 0,
        nCuriosidades: p.curiosidades.length,
        enrichedAt: p.enrichedAt?.toISOString() ?? null,
        score: Math.round([!!p.synopsis, !!p.tagline, !!p.whyWatch, !!p.editorialReview, p.editorialRating != null, p.curiosidades.length > 0].filter(Boolean).length / 6 * 100),
    }))

    return NextResponse.json({ productions: result, total, page, pages: Math.ceil(total / PAGE_SIZE), pageSize: PAGE_SIZE })
}
