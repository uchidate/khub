import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

async function requireAdmin() {
    const session = await auth()
    if (!session || !['admin', 'editor'].includes(session.user.role?.toLowerCase() ?? '')) {
        return null
    }
    return session
}

const upsertSchema = z.object({
    entityType:   z.enum(['artist', 'production', 'group', 'blog_post']),
    entityId:     z.string().min(1),
    metaTitle:    z.string().max(70).optional().nullable(),
    metaDesc:     z.string().max(160).optional().nullable(),
    ogTitle:      z.string().max(70).optional().nullable(),
    ogDesc:       z.string().max(200).optional().nullable(),
    ogImageUrl:   z.string().url().optional().nullable().or(z.literal('')),
    canonicalUrl: z.string().url().optional().nullable().or(z.literal('')),
    noIndex:      z.boolean().optional(),
})

// GET /api/admin/seo?entityType=artist&entityId=xxx  → busca um override
// GET /api/admin/seo?page=1                          → lista todos
export async function GET(request: NextRequest) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const entityType = searchParams.get('entityType')
    const entityId   = searchParams.get('entityId')

    if (entityType && entityId) {
        const meta = await prisma.seoMeta.findUnique({
            where: { entityType_entityId: { entityType, entityId } },
        })
        return NextResponse.json(meta ?? null)
    }

    const page  = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = 30
    const type  = searchParams.get('type') ?? undefined

    const where = type ? { entityType: type } : {}
    const [data, total] = await Promise.all([
        prisma.seoMeta.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.seoMeta.count({ where }),
    ])

    return NextResponse.json({ data, total, pages: Math.ceil(total / limit) })
}

// PUT /api/admin/seo — cria ou atualiza (upsert)
export async function PUT(request: NextRequest) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = upsertSchema.parse(body)

    const meta = await prisma.seoMeta.upsert({
        where: { entityType_entityId: { entityType: validated.entityType, entityId: validated.entityId } },
        create: {
            entityType:   validated.entityType,
            entityId:     validated.entityId,
            metaTitle:    validated.metaTitle ?? null,
            metaDesc:     validated.metaDesc ?? null,
            ogTitle:      validated.ogTitle ?? null,
            ogDesc:       validated.ogDesc ?? null,
            ogImageUrl:   validated.ogImageUrl || null,
            canonicalUrl: validated.canonicalUrl || null,
            noIndex:      validated.noIndex ?? false,
        },
        update: {
            metaTitle:    validated.metaTitle ?? null,
            metaDesc:     validated.metaDesc ?? null,
            ogTitle:      validated.ogTitle ?? null,
            ogDesc:       validated.ogDesc ?? null,
            ogImageUrl:   validated.ogImageUrl || null,
            canonicalUrl: validated.canonicalUrl || null,
            noIndex:      validated.noIndex ?? false,
        },
    })

    return NextResponse.json(meta)
}

// DELETE /api/admin/seo?entityType=artist&entityId=xxx
export async function DELETE(request: NextRequest) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const entityType = searchParams.get('entityType')
    const entityId   = searchParams.get('entityId')

    if (!entityType || !entityId) {
        return NextResponse.json({ error: 'entityType e entityId são obrigatórios' }, { status: 400 })
    }

    await prisma.seoMeta.deleteMany({
        where: { entityType, entityId },
    })

    return NextResponse.json({ success: true })
}
