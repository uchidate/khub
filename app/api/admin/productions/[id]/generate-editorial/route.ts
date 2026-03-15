import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'
import { assertBudgetAvailable, getBudgetStatus } from '@/lib/ai/budget-guard'
import {
    generateProductionReview,
    EDITORIAL_COST_ESTIMATES,
} from '@/lib/ai/generators/editorial-generator'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/productions/[id]/generate-editorial
 * Dry-run: retorna estimativa de custo e status atual.
 */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params

    const production = await prisma.production.findUnique({
        where: { id },
        select: {
            titlePt: true,
            editorialReview: true,
            whyWatch: true,
            editorialRating: true,
            editorialGeneratedAt: true,
        },
    })

    if (!production) return NextResponse.json({ error: 'Produção não encontrada' }, { status: 404 })

    const budget = await getBudgetStatus('production_review')

    return NextResponse.json({
        production: { titlePt: production.titlePt },
        hasReview: !!production.editorialReview,
        editorialGeneratedAt: production.editorialGeneratedAt,
        estimate: EDITORIAL_COST_ESTIMATES.production_review,
        budget,
    })
}

/**
 * POST /api/admin/productions/[id]/generate-editorial
 * Gera review editorial para a produção.
 * Body: { overwrite?: boolean }
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const body = await req.json() as { overwrite?: boolean }
    const overwrite = body.overwrite ?? false

    const production = await prisma.production.findUnique({
        where: { id },
        select: {
            titlePt: true,
            titleKr: true,
            type: true,
            year: true,
            synopsis: true,
            tagline: true,
            voteAverage: true,
            streamingPlatforms: true,
            network: true,
            editorialReview: true,
        },
    })

    if (!production) return NextResponse.json({ error: 'Produção não encontrada' }, { status: 404 })

    if (!overwrite && production.editorialReview) {
        return NextResponse.json({ error: 'Já possui review. Use overwrite: true para substituir.' }, { status: 409 })
    }

    try {
        await assertBudgetAvailable('production_review')
        const r = await generateProductionReview(production)

        await prisma.production.update({
            where: { id },
            data: {
                editorialReview:      r.editorialReview,
                whyWatch:             r.whyWatch,
                editorialRating:      r.editorialRating,
                editorialGeneratedAt: new Date(),
            },
        })

        return NextResponse.json({
            editorialReview:  r.editorialReview,
            whyWatch:         r.whyWatch,
            editorialRating:  r.editorialRating,
            totalCostUsd:     r.cost,
        })
    } catch (err) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
    }
}
