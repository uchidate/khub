import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const PLACEHOLDER_PATTERNS = /não (há|existe|encontr|dispon)|informaç.o não|dados indispon|sem (informaç|sinopse|dados)|indisponível/i

const EnrichSchema = z.object({
    titlePt:         z.string().min(2).optional().nullable(),
    synopsis:        z.string().min(80, 'Sinopse muito curta (mín. 80 chars)').refine(v => !v || !PLACEHOLDER_PATTERNS.test(v), 'Sinopse contém texto de placeholder — retorne null se não souber').optional().nullable(),
    tagline:         z.string().optional().nullable(),
    whyWatch:        z.string().min(50, 'Muito curto (mín. 50 chars)').optional().nullable(),
    editorialReview: z.string().min(100, 'Muito curto (mín. 100 chars)').optional().nullable(),
    editorialRating: z.number().min(0).max(10).optional().nullable(),
    curiosidades:    z.array(z.string().min(20)).min(1).max(8).optional(),
})

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
            id: true,
            slug: true,
            titlePt: true,
            titleKr: true,
            type: true,
            year: true,
            network: true,
            episodeCount: true,
            synopsis: true,
            tagline: true,
            whyWatch: true,
            editorialReview: true,
            editorialRating: true,
            curiosidades: true,
            imageUrl: true,
            enrichedAt: true,
            artists: {
                include: { artist: { select: { nameRomanized: true } } },
                orderBy: { castOrder: 'asc' },
                take: 5,
            },
        },
    })

    if (!production) return NextResponse.json({ error: 'Produção não encontrada' }, { status: 404 })
    return NextResponse.json({ production })
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params

    const exists = await prisma.production.findUnique({ where: { id }, select: { id: true } })
    if (!exists) return NextResponse.json({ error: 'Produção não encontrada' }, { status: 404 })

    let body: unknown
    try { body = await req.json() } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const parsed = EnrichSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({
            error: 'Validação falhou',
            details: parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })),
        }, { status: 422 })
    }

    const data = parsed.data
    const update: Record<string, unknown> = { enrichedAt: new Date() }

    if (data.titlePt         != null) {
        update.titlePt = data.titlePt
        // regenerate slug from new titlePt
        const baseSlug = data.titlePt
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '')
            || id
        // ensure uniqueness
        const conflict = await prisma.production.findFirst({ where: { slug: baseSlug, NOT: { id } }, select: { id: true } })
        update.slug = conflict ? `${baseSlug}-${id.slice(-4)}` : baseSlug
    }
    if (data.synopsis        != null) update.synopsis        = data.synopsis
    if (data.tagline         != null) update.tagline         = data.tagline
    if (data.whyWatch        != null) update.whyWatch        = data.whyWatch
    if (data.editorialReview != null) update.editorialReview = data.editorialReview
    if (data.editorialRating != null) update.editorialRating = data.editorialRating
    if (data.curiosidades?.length)    update.curiosidades    = data.curiosidades

    // Campos que o enriquecimento manual sobrescreve — apagar traduções automáticas para evitar conflito
    const fieldsToClean = ['synopsis', 'tagline', 'whyWatch', 'editorialReview'].filter(f => update[f] != null)
    if (fieldsToClean.length > 0) {
        await prisma.contentTranslation.deleteMany({
            where: { entityType: 'production', entityId: id, field: { in: fieldsToClean } },
        })
    }

    await prisma.production.update({ where: { id }, data: update })

    return NextResponse.json({ ok: true, fieldsUpdated: Object.keys(update).filter(k => k !== 'enrichedAt') })
}
