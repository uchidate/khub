import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

const BLOOD_TYPES = ['A', 'B', 'AB', 'O'] as const
const VALID_ROLES = ['ATOR', 'CANTOR', 'MODELO', 'IDOL', 'APRESENTADOR', 'DANÇARINO', 'COMPOSITOR', 'PRODUTOR']

function normalizeGeneratedUrl(value: string): string {
    let s = value.trim()

    // Extrai URL de markdown [texto](url) — pode precisar de múltiplos passes
    // (Gemini às vezes gera [url](google_redirect) onde o redirect contém outra url em ?q=)
    for (let i = 0; i < 3; i++) {
        const m = s.match(/\[[^\]]*\]\(([^)]+)\)/)
        if (!m) break
        s = m[1].trim()
    }

    // Remove qualquer colchete/parêntese residual
    s = s.replace(/^\[+/, '').replace(/\]+$/, '').replace(/^\(+/, '').replace(/\)+$/, '').trim()

    try {
        const parsed = new URL(s)
        const host = parsed.hostname.replace(/^www\./, '')
        // Desembrulha redirects google.com/search?q=URL ou /url?url=URL
        const queryUrl = parsed.searchParams.get('q') ?? parsed.searchParams.get('url')
        if (host === 'google.com' && queryUrl) {
            // Aplica recursão para o caso do q= também estar wrappeado
            return normalizeGeneratedUrl(decodeURIComponent(queryUrl))
        }
    } catch {
        return s
    }

    return s
}

function normalizeYoutubeUrl(value: string): string | null {
    const url = normalizeGeneratedUrl(value)
    try {
        const parsed = new URL(url)
        const host = parsed.hostname.replace(/^www\./, '')
        if (host === 'youtu.be') {
            const id = parsed.pathname.split('/').filter(Boolean)[0]
            return id ? `https://www.youtube.com/watch?v=${id}` : null
        }
        if (host === 'youtube.com' || host === 'm.youtube.com') {
            const id = parsed.searchParams.get('v')
            return id ? `https://www.youtube.com/watch?v=${id}` : null
        }
    } catch {
        return null
    }
    return null
}

const EnrichSchema = z.object({
    nameRomanized: z.string().min(1).optional(),
    nameHangul: z.string().optional().nullable(),
    birthName: z.string().optional().nullable(),
    height: z.union([
        z.string().regex(/^\d{2,3}$/, 'Altura deve ser apenas número (ex: 183)'),
        z.number().int().min(100).max(999).transform(n => String(n)),
    ]).optional().nullable(),
    bloodType: z.enum(BLOOD_TYPES).optional().nullable(),
    placeOfBirth: z.string().optional().nullable(),
    bio: z.string().min(100, 'Bio muito curta (mín. 100 chars)').optional(),
    analiseEditorial: z.string().min(100, 'Análise muito curta (mín. 100 chars)').optional(),
    curiosidades: z.array(z.string().min(20, 'Curiosidade muito curta')).min(3).max(15).optional(),
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
    socialLinks: z.record(z.string(), z.string().url().or(z.literal('')).nullable()).optional().nullable(),
    gender: z.enum(['male', 'female', 'non-binary']).optional().nullable(),
    seoTitle: z.string().max(60).optional().nullable(),
    metaDescription: z.string().min(140).max(158).optional().nullable(),
    tags: z.array(z.string()).min(1).max(15).optional(),
    faq: z.array(z.object({ pergunta: z.string(), resposta: z.string() })).min(1).max(10).optional().nullable(),
    videos: z.array(z.object({
        title: z.string().min(1),
        url: z.string().url().refine(u => u.includes('youtube.com/watch') || u.includes('youtu.be'), 'URL deve ser do YouTube'),
    })).max(6).optional().nullable(),
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
            videos: true,
            faq: true,
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
    const { error } = await requireAdmin()
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

    // Trunca seoTitle/metaDescription se o LLM retornou além do limite
    if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>
        if (typeof b.seoTitle === 'string' && b.seoTitle.length > 60) b.seoTitle = b.seoTitle.slice(0, 60).trimEnd()
        if (typeof b.metaDescription === 'string' && b.metaDescription.length > 158) b.metaDescription = b.metaDescription.slice(0, 158).trimEnd()
    }

    // Limpa URLs markdown [texto](url) → url, e rejeita redirects google.com/search
    // Valida Spotify via oEmbed para descartar IDs inventados pelo LLM.
    if (body && typeof body === 'object' && 'socialLinks' in body && body.socialLinks && typeof body.socialLinks === 'object') {
        const cleaned: Record<string, string | null> = {}
        for (const [k, v] of Object.entries(body.socialLinks as Record<string, unknown>)) {
            if (!v || typeof v !== 'string') { cleaned[k] = null; continue }
            const url = normalizeGeneratedUrl(v)
            if (!url || url.includes('google.com/search')) { cleaned[k] = null; continue }

            // Valida Spotify: verifica via oEmbed se o artista existe
            if (k === 'spotify' && url.includes('open.spotify.com/artist/')) {
                try {
                    const res = await fetch(
                        `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
                        { signal: AbortSignal.timeout(4000) }
                    )
                    cleaned[k] = res.ok ? url.trim() : null
                } catch {
                    cleaned[k] = null
                }
                continue
            }

            cleaned[k] = url.trim() || null
        }
        ;(body as Record<string, unknown>).socialLinks = cleaned
    }

    // Limpa vídeos gerados como markdown ou wrappers do Google antes da validação Zod.
    // Também valida via oEmbed se o vídeo realmente existe — descarta IDs inventados pelo LLM.
    if (body && typeof body === 'object' && 'videos' in body && Array.isArray((body as Record<string, unknown>).videos)) {
        const rawVideos = ((body as Record<string, unknown>).videos as unknown[])
            .map(item => {
                if (!item || typeof item !== 'object') return null
                const video = item as Record<string, unknown>
                if (typeof video.url !== 'string') return null
                const normalizedUrl = normalizeYoutubeUrl(video.url)
                return normalizedUrl ? { ...video, url: normalizedUrl } : null
            })
            .filter(Boolean)

        // Valida existência via oEmbed (fire-and-forget por vídeo, paraleliza)
        const validated = await Promise.all(
            rawVideos.map(async (video) => {
                const v = video as Record<string, unknown>
                try {
                    const res = await fetch(
                        `https://www.youtube.com/oembed?url=${encodeURIComponent(v.url as string)}&format=json`,
                        { signal: AbortSignal.timeout(4000) }
                    )
                    return res.ok ? v : null
                } catch {
                    return null // timeout ou rede — descarta
                }
            })
        )
        ;(body as Record<string, unknown>).videos = validated.filter(Boolean)
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
    const GENERIC_BIO_PATTERNS = [/conhecido\(a\) na ind[uú]stria/, /talentoso\(a\).*ind[uú]stria/, /de destaque na ind[uú]stria/]
    if (data.bio && !GENERIC_BIO_PATTERNS.some(p => p.test(data.bio!))) {
        update.bio = data.bio
        // Apaga tradução automática antiga que pode ser genérica — bio nova tem prioridade
        await prisma.contentTranslation.deleteMany({
            where: { entityType: 'artist', entityId: id, field: 'bio' },
        }).catch(() => null)
    }
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
            Object.entries(data.socialLinks).filter(([, v]) => v && v.trim() !== '')
        )
        if (Object.keys(cleaned).length > 0) update.socialLinks = cleaned
    }
    if (data.gender) {
        const genderMap = { female: 1, male: 2, 'non-binary': 3 } as const
        update.gender = genderMap[data.gender]
    }
    if (data.tags?.length)  update.seoTags = data.tags
    if (data.faq)           update.faq     = data.faq
    if (data.videos)        update.videos  = data.videos

    try {
        const updated = await prisma.artist.update({
            where: { id },
            data: update,
            select: { id: true, nameRomanized: true, slug: true, enrichedAt: true },
        })

        if (data.seoTitle || data.metaDescription) {
            await prisma.seoMeta.upsert({
                where: { entityType_entityId: { entityType: 'artist', entityId: id } },
                create: {
                    entityType: 'artist',
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

        revalidatePath(`/artists/${updated.slug ?? updated.id}`)
        revalidatePath('/artists')
        return NextResponse.json({ ok: true, artist: updated, fieldsUpdated: Object.keys(update).filter(k => k !== 'enrichedAt') })
    } catch (err) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
    }
}
