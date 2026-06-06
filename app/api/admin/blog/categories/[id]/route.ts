import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function toSlug(name: string) {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}

/** PATCH /api/admin/blog/categories/[id] — renomeia ou atualiza flags da categoria */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const body = await req.json()
    const data: Record<string, unknown> = {}

    if (body.name !== undefined) {
        if (typeof body.name !== 'string' || body.name.trim().length < 2) {
            return NextResponse.json({ error: 'Nome deve ter ao menos 2 caracteres' }, { status: 400 })
        }
        data.name = body.name.trim()
        data.slug = toSlug(body.name.trim())
    }

    if (typeof body.adsDisabled === 'boolean') {
        data.adsDisabled = body.adsDisabled
    }

    const updated = await prisma.blogCategory.update({ where: { id }, data })
    return NextResponse.json(updated)
}

/** DELETE /api/admin/blog/categories/[id] — remove categoria (posts ficam sem categoria) */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params

    // Desassocia posts antes de deletar
    await prisma.blogPost.updateMany({ where: { categoryId: id }, data: { categoryId: null } })
    await prisma.blogCategory.delete({ where: { id } })

    return NextResponse.json({ ok: true })
}
