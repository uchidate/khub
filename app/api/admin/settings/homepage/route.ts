import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/settings/homepage
 * Retorna os slots editoriais da homepage
 */
export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    const settings = await prisma.systemSettings.findUnique({
        where: { id: 'singleton' },
        select: {
            homeFeaturedPostId: true,
            homeSecondaryPostIds: true,
            homeSidebarPostIds: true,
        },
    })

    const config = settings ?? {
        homeFeaturedPostId: null,
        homeSecondaryPostIds: [],
        homeSidebarPostIds: [],
    }

    // Busca os posts dos slots para exibir no admin
    const allIds = [
        ...(config.homeFeaturedPostId ? [config.homeFeaturedPostId] : []),
        ...config.homeSecondaryPostIds,
        ...config.homeSidebarPostIds,
    ]

    const posts = allIds.length > 0
        ? await prisma.blogPost.findMany({
            where: { id: { in: allIds } },
            select: {
                id: true, title: true, slug: true,
                coverImageUrl: true, publishedAt: true,
                category: { select: { name: true, slug: true } },
            },
        })
        : []

    const postsById = Object.fromEntries(posts.map(p => [p.id, p]))

    return NextResponse.json({ config, postsById })
}

/**
 * PUT /api/admin/settings/homepage
 * Salva os slots editoriais da homepage
 */
export async function PUT(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const body = await req.json() as {
            homeFeaturedPostId?: string | null
            homeSecondaryPostIds?: string[]
            homeSidebarPostIds?: string[]
        }

        const data: {
            homeFeaturedPostId?: string | null
            homeSecondaryPostIds?: string[]
            homeSidebarPostIds?: string[]
        } = {}

        if ('homeFeaturedPostId' in body) data.homeFeaturedPostId = body.homeFeaturedPostId ?? null
        if (Array.isArray(body.homeSecondaryPostIds)) data.homeSecondaryPostIds = body.homeSecondaryPostIds.slice(0, 4)
        if (Array.isArray(body.homeSidebarPostIds)) data.homeSidebarPostIds = body.homeSidebarPostIds.slice(0, 4)

        await prisma.systemSettings.upsert({
            where: { id: 'singleton' },
            update: data,
            create: {
                id: 'singleton',
                allowAdultContent: false,
                allowUnclassifiedContent: false,
                maintenanceMode: false,
                homeFeaturedPostId: null,
                homeSecondaryPostIds: [],
                homeSidebarPostIds: [],
                ...data,
            },
        })

        revalidatePath('/')
        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Error updating homepage config:', err)
        return NextResponse.json({ error: 'Falha ao salvar configuração' }, { status: 500 })
    }
}
