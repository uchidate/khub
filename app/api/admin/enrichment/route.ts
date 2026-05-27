import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/enrichment
 * Returns the backlog for the reviewed prompt/Gemini workflow only.
 */
export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    const [artists, groups, productions] = await Promise.all([
        prisma.artist.count({
            where: {
                isHidden: false,
                flaggedAsNonKorean: false,
                OR: [
                    { bio: null },
                    { analiseEditorial: null },
                    { curiosidades: { isEmpty: true } },
                    { height: null },
                    { bloodType: null },
                    { fanInfo: { equals: Prisma.JsonNull } },
                    { awards: { equals: Prisma.JsonNull } },
                ],
            },
        }),
        prisma.musicalGroup.count({
            where: {
                isHidden: false,
                OR: [
                    { bio: null },
                    { analiseEditorial: null },
                    { curiosidades: { isEmpty: true } },
                    { fanClubName: null },
                    { officialColor: null },
                    { socialLinks: { equals: Prisma.JsonNull } },
                ],
            },
        }),
        prisma.production.count({
            where: {
                isHidden: false,
                flaggedAsNonKorean: false,
                OR: [
                    { synopsis: null },
                    { tagline: null },
                    { whyWatch: null },
                    { editorialReview: null },
                    { editorialRating: null },
                    { curiosidades: { isEmpty: true } },
                ],
            },
        }),
    ])

    const detailedQueues = { artists, groups, productions }

    return NextResponse.json({
        mode: 'reviewed_gemini',
        counts: detailedQueues,
        detailedQueues,
        totalEstimate: 0,
    })
}

/**
 * Automated editorial enrichment previously generated content through DeepSeek.
 * Writing curated fields now happens only through the reviewed Gemini import pages.
 */
export async function POST() {
    const { error } = await requireAdmin()
    if (error) return error

    return NextResponse.json(
        {
            error: 'Enriquecimento automatico desativado. Use a fila manual com prompt e retorno do Gemini.',
            href: '/admin/enrichment',
        },
        { status: 410 },
    )
}
