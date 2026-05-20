import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

const EnrichSchema = z.object({
    bio: z.string().min(100, 'Bio muito curta (mín. 100 chars)').optional(),
    analiseEditorial: z.string().min(100, 'Análise muito curta (mín. 100 chars)').optional(),
    curiosidades: z.array(z.string().min(20, 'Curiosidade muito curta')).min(3).max(10).optional(),
    fanClubName: z.string().optional().nullable(),
    officialColor: z.string().regex(/^#[0-9a-fA-F]{3,6}$/, 'Cor deve ser hex (ex: #c6a852)').optional().nullable(),
    socialLinks: z.record(z.string(), z.string().url().or(z.literal('')).nullable()).optional().nullable(),
    seoTitle: z.string().max(60).optional().nullable(),
    metaDescription: z.string().min(140).max(158).optional().nullable(),
    tags: z.array(z.string()).min(1).max(15).optional(),
})

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params

    const group = await prisma.musicalGroup.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            nameHangul: true,
            bio: true,
            analiseEditorial: true,
            curiosidades: true,
            fanClubName: true,
            officialColor: true,
            socialLinks: true,
            editorialGeneratedAt: true,
            agency: { select: { name: true } },
        },
    })

    if (!group) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })
    return NextResponse.json({ group })
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params

    const group = await prisma.musicalGroup.findUnique({
        where: { id },
        select: { id: true, name: true, slug: true },
    })
    if (!group) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })

    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>
        if (typeof b.seoTitle === 'string' && b.seoTitle.length > 60) b.seoTitle = b.seoTitle.slice(0, 60).trimEnd()
        if (typeof b.metaDescription === 'string' && b.metaDescription.length > 158) b.metaDescription = b.metaDescription.slice(0, 158).trimEnd()
    }

    if (body && typeof body === 'object' && 'socialLinks' in body && body.socialLinks && typeof body.socialLinks === 'object') {
        const cleaned: Record<string, string | null> = {}
        for (const [k, v] of Object.entries(body.socialLinks as Record<string, unknown>)) {
            if (!v || typeof v !== 'string') { cleaned[k] = null; continue }
            const mdMatch = v.match(/\[.*?\]\((.*?)\)/)
            const url = mdMatch ? mdMatch[1] : v
            cleaned[k] = url.includes('google.com/search') ? null : url.trim() || null
        }
        ;(body as Record<string, unknown>).socialLinks = cleaned
    }

    const parsed = EnrichSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({
            error: 'Validação falhou',
            details: parsed.error.issues.map(e => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        }, { status: 422 })
    }

    const data = parsed.data
    const update: Record<string, unknown> = { editorialGeneratedAt: new Date() }

    const GENERIC_BIO_PATTERNS = [/conhecido\(a\) na ind[uú]stria/, /talentoso\(a\).*ind[uú]stria/]
    if (data.bio && !GENERIC_BIO_PATTERNS.some(p => p.test(data.bio!))) {
        update.bio = data.bio
    }
    if (data.analiseEditorial) update.analiseEditorial = data.analiseEditorial
    if (data.curiosidades)     update.curiosidades     = data.curiosidades
    if (data.fanClubName)      update.fanClubName      = data.fanClubName
    if (data.officialColor)    update.officialColor    = data.officialColor
    if (data.socialLinks) {
        const cleaned = Object.fromEntries(
            Object.entries(data.socialLinks).filter(([, v]) => v && v.trim() !== '')
        )
        if (Object.keys(cleaned).length > 0) update.socialLinks = cleaned
    }
    try {
        const updated = await prisma.musicalGroup.update({
            where: { id },
            data: update,
            select: { id: true, name: true, slug: true, editorialGeneratedAt: true },
        })

        if (data.seoTitle || data.metaDescription) {
            await prisma.seoMeta.upsert({
                where: { entityType_entityId: { entityType: 'group', entityId: id } },
                create: {
                    entityType: 'group',
                    entityId: id,
                    ...(data.seoTitle && { metaTitle: data.seoTitle }),
                    ...(data.metaDescription && { metaDesc: data.metaDescription }),
                },
                update: {
                    ...(data.seoTitle && { metaTitle: data.seoTitle }),
                    ...(data.metaDescription && { metaDesc: data.metaDescription }),
                },
            })
        }

        revalidatePath(`/groups/${updated.slug ?? updated.id}`)
        revalidatePath('/groups')
        return NextResponse.json({
            ok: true,
            group: updated,
            fieldsUpdated: Object.keys(update).filter(k => k !== 'editorialGeneratedAt'),
        })
    } catch (err) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
    }
}
