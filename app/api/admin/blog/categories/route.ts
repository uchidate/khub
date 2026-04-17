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

/** GET /api/admin/blog/categories — lista com contagem total de posts (não só publicados) */
export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    const categories = await prisma.blogCategory.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { posts: true } } },
    })
    return NextResponse.json(categories)
}

/** POST /api/admin/blog/categories — cria nova categoria */
export async function POST(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const { name } = await req.json()
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json({ error: 'Nome deve ter ao menos 2 caracteres' }, { status: 400 })
    }

    const slug = toSlug(name.trim())
    const existing = await prisma.blogCategory.findFirst({ where: { OR: [{ name: name.trim() }, { slug }] } })
    if (existing) return NextResponse.json({ error: 'Categoria já existe' }, { status: 409 })

    const category = await prisma.blogCategory.create({ data: { name: name.trim(), slug } })
    return NextResponse.json(category, { status: 201 })
}
