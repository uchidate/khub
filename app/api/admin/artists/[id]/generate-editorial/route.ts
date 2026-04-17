import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'
import { assertBudgetAvailable, getBudgetStatus } from '@/lib/ai/budget-guard'
import {
    generateArtistBio,
    generateArtistEditorial,
    generateArtistCuriosidades,
    EDITORIAL_COST_ESTIMATES,
} from '@/lib/ai/generators/editorial-generator'
import type { AiFeature } from '@/lib/ai/ai-features'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/artists/[id]/generate-editorial
 * Dry-run: retorna estimativa de custo e status de budget sem gerar nada.
 */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params

    const artist = await prisma.artist.findUnique({
        where: { id },
        select: {
            nameRomanized: true,
            bio: true,
            analiseEditorial: true,
            curiosidades: true,
            editorialGeneratedAt: true,
        },
    })

    if (!artist) return NextResponse.json({ error: 'Artista não encontrado' }, { status: 404 })

    const features: AiFeature[] = ['artist_bio_enrichment', 'artist_editorial', 'artist_curiosidades']
    const budgetStatuses = await Promise.all(features.map(f => getBudgetStatus(f)))

    return NextResponse.json({
        artist: { nameRomanized: artist.nameRomanized },
        hasBio: !!artist.bio,
        hasEditorial: !!artist.analiseEditorial,
        hasCuriosidades: artist.curiosidades.length > 0,
        editorialGeneratedAt: artist.editorialGeneratedAt,
        estimates: {
            bio:          EDITORIAL_COST_ESTIMATES.artist_bio_enrichment,
            editorial:    EDITORIAL_COST_ESTIMATES.artist_editorial,
            curiosidades: EDITORIAL_COST_ESTIMATES.artist_curiosidades,
            total:        Object.values(EDITORIAL_COST_ESTIMATES).slice(0, 3).reduce((a, b) => a + b, 0),
        },
        budgets: Object.fromEntries(budgetStatuses.map(s => [s.feature, s])),
    })
}

/**
 * POST /api/admin/artists/[id]/generate-editorial
 * Gera conteúdo editorial para o artista.
 * Body: { generate: ('bio' | 'editorial' | 'curiosidades')[] }
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const body = await req.json() as { generate?: string[]; overwrite?: boolean }
    const toGenerate = body.generate ?? ['bio', 'editorial', 'curiosidades']
    const overwrite = body.overwrite ?? false

    const artist = await prisma.artist.findUnique({
        where: { id },
        select: {
            nameRomanized: true,
            nameHangul: true,
            roles: true,
            birthDate: true,
            birthName: true,
            placeOfBirth: true,
            bio: true,
            analiseEditorial: true,
            curiosidades: true,
            agency: { select: { name: true } },
            memberships: { select: { group: { select: { name: true } }, isActive: true } },
        },
    })

    if (!artist) return NextResponse.json({ error: 'Artista não encontrado' }, { status: 404 })

    const results: Record<string, unknown> = {}
    const errors: Record<string, string> = {}
    let totalCost = 0

    // Bio
    if (toGenerate.includes('bio') && (overwrite || !artist.bio)) {
        try {
            await assertBudgetAvailable('artist_bio_enrichment')
            const r = await generateArtistBio(artist)
            await prisma.artist.update({ where: { id }, data: { bio: r.bio } })
            results.bio = r.bio
            totalCost += r.cost
        } catch (err) {
            errors.bio = getErrorMessage(err)
        }
    }

    // Análise editorial
    if (toGenerate.includes('editorial') && (overwrite || !artist.analiseEditorial)) {
        try {
            await assertBudgetAvailable('artist_editorial')
            const updated = await prisma.artist.findUnique({ where: { id }, select: { bio: true } })
            const r = await generateArtistEditorial({ ...artist, bio: updated?.bio ?? artist.bio })
            await prisma.artist.update({ where: { id }, data: { analiseEditorial: r.analiseEditorial } })
            results.editorial = r.analiseEditorial
            totalCost += r.cost
        } catch (err) {
            errors.editorial = getErrorMessage(err)
        }
    }

    // Curiosidades
    if (toGenerate.includes('curiosidades') && (overwrite || artist.curiosidades.length === 0)) {
        try {
            await assertBudgetAvailable('artist_curiosidades')
            const r = await generateArtistCuriosidades(artist)
            await prisma.artist.update({ where: { id }, data: { curiosidades: r.curiosidades } })
            results.curiosidades = r.curiosidades
            totalCost += r.cost
        } catch (err) {
            errors.curiosidades = getErrorMessage(err)
        }
    }

    // Atualizar timestamp se algo foi gerado
    if (Object.keys(results).length > 0) {
        await prisma.artist.update({
            where: { id },
            data:  { editorialGeneratedAt: new Date() },
        })
    }

    return NextResponse.json({
        generated: results,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        totalCostUsd: totalCost,
    })
}
