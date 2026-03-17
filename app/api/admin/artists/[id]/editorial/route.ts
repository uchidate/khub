import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/artists/[id]/editorial
 * Retorna os campos editoriais gerados por IA para curadoria.
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
            nameRomanized:        true,
            nameHangul:           true,
            bio:                  true,
            analiseEditorial:     true,
            curiosidades:         true,
            editorialGeneratedAt: true,
        },
    })

    if (!artist) return NextResponse.json({ error: 'Artista não encontrado' }, { status: 404 })
    return NextResponse.json(artist)
}

/**
 * PATCH /api/admin/artists/[id]/editorial
 * Atualiza campos editoriais após curadoria humana.
 * Body: { bio?: string; analiseEditorial?: string; curiosidades?: string[] }
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const body = await req.json() as {
        bio?:             string
        analiseEditorial?: string
        curiosidades?:    string[]
    }

    const data: Record<string, unknown> = {}
    if (body.bio              !== undefined) data.bio              = body.bio
    if (body.analiseEditorial !== undefined) data.analiseEditorial = body.analiseEditorial
    if (body.curiosidades     !== undefined) data.curiosidades     = body.curiosidades

    if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    // Marcar curadoria como concluída ao salvar manualmente
    data.editorialCuratedAt = new Date()

    await prisma.artist.update({ where: { id }, data })

    // Manter ContentTranslation em sincronia com a bio curada
    if (body.bio !== undefined) {
        await prisma.contentTranslation.upsert({
            where: {
                entityType_entityId_field_locale: {
                    entityType: 'artist', entityId: id, field: 'bio', locale: 'pt-BR',
                },
            },
            update: { value: body.bio, status: 'approved' },
            create: {
                entityType: 'artist', entityId: id, field: 'bio',
                locale: 'pt-BR', value: body.bio, status: 'approved',
            },
        })
    }

    revalidatePath(`/artists/${id}`)
    return NextResponse.json({ ok: true })
}
