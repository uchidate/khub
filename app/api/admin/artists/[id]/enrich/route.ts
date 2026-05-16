import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

const BLOOD_TYPES = ['A', 'B', 'AB', 'O'] as const
const VALID_ROLES = ['ATOR', 'CANTOR', 'MODELO', 'IDOL', 'APRESENTADOR', 'DANÇARINO', 'COMPOSITOR', 'PRODUTOR']

const EnrichSchema = z.object({
    nameRomanized: z.string().min(1).optional(),
    nameHangul: z.string().optional().nullable(),
    birthName: z.string().optional().nullable(),
    height: z.string().regex(/^\d{2,3}$/, 'Altura deve ser apenas número (ex: 183)').optional().nullable(),
    bloodType: z.enum(BLOOD_TYPES).optional().nullable(),
    placeOfBirth: z.string().optional().nullable(),
    bio: z.string().min(100, 'Bio muito curta (mín. 100 chars)').optional(),
    analiseEditorial: z.string().min(100, 'Análise muito curta (mín. 100 chars)').optional(),
    curiosidades: z.array(z.string().min(20, 'Curiosidade muito curta')).min(3).max(10).optional(),
    musicalStyle: z.string().optional().nullable(),
    fanInfo: z.object({
        fanName: z.string().optional().nullable(),
        fanColor: z.string().optional().nullable(),
        lightstick: z.string().optional().nullable(),
    }).optional().nullable(),
    awards: z.array(z.object({
        premio: z.string(),
        categoria: z.string(),
        ano: z.number().int().min(1990).max(2030),
    })).optional().nullable(),
    destaques: z.object({
        dramas: z.array(z.object({
            titulo: z.string(),
            ano: z.number().int(),
            personagem: z.string().optional(),
            nota: z.string().optional(),
        })).optional(),
        filmes: z.array(z.object({
            titulo: z.string(),
            ano: z.number().int(),
            nota: z.string().optional(),
        })).optional(),
        albuns: z.array(z.object({
            titulo: z.string(),
            ano: z.number().int(),
            tipo: z.string().optional(),
            destaque: z.string().optional(),
        })).optional(),
    }).optional().nullable(),
    nationality: z.string().optional().nullable(),
    debutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data no formato YYYY-MM-DD').optional().nullable(),
    roles: z.array(z.string()).optional(),
    socialLinks: z.record(z.string(), z.string().url().or(z.literal(''))).optional(),
})

/**
 * GET /api/admin/artists/[id]/enrich
 * Retorna dados atuais do artista para comparação no validador
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
            id: true,
            nameRomanized: true,
            nameHangul: true,
            birthName: true,
            height: true,
            bloodType: true,
            placeOfBirth: true,
            bio: true,
            analiseEditorial: true,
            curiosidades: true,
            musicalStyle: true,
            fanInfo: true,
            awards: true,
            destaques: true,
            roles: true,
            socialLinks: true,
            nationality: true,
            debutDate: true,
            enrichedAt: true,
            editorialGeneratedAt: true,
            agency: { select: { name: true } },
        },
    })

    if (!artist) return NextResponse.json({ error: 'Artista não encontrado' }, { status: 404 })
    return NextResponse.json({ artist })
}

/**
 * POST /api/admin/artists/[id]/enrich
 * Valida e aplica o JSON gerado pelo Gemini no artista
 * Body: payload do idol-enrich.md (campos opcionais — só atualiza o que vier)
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireAdmin()
    if (error) return error

    const { id } = await params

    const artist = await prisma.artist.findUnique({
        where: { id },
        select: { id: true, nameRomanized: true },
    })
    if (!artist) return NextResponse.json({ error: 'Artista não encontrado' }, { status: 404 })

    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
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
    const update: Record<string, unknown> = { enrichedAt: new Date() }

    if (data.nameRomanized)    update.nameRomanized    = data.nameRomanized
    if (data.nameHangul)       update.nameHangul       = data.nameHangul
    if (data.birthName)        update.birthName        = data.birthName
    if (data.height)           update.height           = data.height
    if (data.bloodType)        update.bloodType        = data.bloodType
    if (data.placeOfBirth)     update.placeOfBirth     = data.placeOfBirth
    if (data.nationality)      update.nationality      = data.nationality
    if (data.debutDate)        update.debutDate        = new Date(data.debutDate)
    if (data.bio)              update.bio              = data.bio
    if (data.analiseEditorial) update.analiseEditorial = data.analiseEditorial
    if (data.curiosidades)     update.curiosidades     = data.curiosidades
    if (data.musicalStyle)     update.musicalStyle     = data.musicalStyle
    if (data.fanInfo)          update.fanInfo          = data.fanInfo
    if (data.awards)           update.awards           = data.awards
    if (data.destaques)        update.destaques        = data.destaques
    if (data.roles?.length)    update.roles            = data.roles.map(r => r.toUpperCase())
        .filter(r => VALID_ROLES.includes(r))
    if (data.socialLinks) {
        const cleaned = Object.fromEntries(
            Object.entries(data.socialLinks).filter(([, v]) => v.trim() !== '')
        )
        if (Object.keys(cleaned).length > 0) update.socialLinks = cleaned
    }

    try {
        const updated = await prisma.artist.update({
            where: { id },
            data: update,
            select: { id: true, nameRomanized: true, enrichedAt: true },
        })
        return NextResponse.json({ ok: true, artist: updated, fieldsUpdated: Object.keys(update).filter(k => k !== 'enrichedAt') })
    } catch (err) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
    }
}
