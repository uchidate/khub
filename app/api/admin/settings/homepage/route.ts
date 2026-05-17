import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { revalidatePath, revalidateTag } from 'next/cache'

export const dynamic = 'force-dynamic'
const HOME_CACHE_TAG = 'home-public-data'

function normalizeIds(value: unknown, max: number): string[] {
    if (!Array.isArray(value)) return []
    const ids = value
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        .map(id => id.trim())
    return Array.from(new Set(ids)).slice(0, max)
}

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
            homeCarouselPostIds: true,
            homeSpotlightArtistId: true,
            homeAffinityArtistWeight: true,
            homeAffinityGroupWeight: true,
            homeAffinityProductionWeight: true,
        },
    })

    const config = settings ?? {
        homeFeaturedPostId: null,
        homeSecondaryPostIds: [],
        homeSidebarPostIds: [],
        homeCarouselPostIds: [],
        homeSpotlightArtistId: null,
        homeAffinityArtistWeight: 3,
        homeAffinityGroupWeight: 3,
        homeAffinityProductionWeight: 2,
    }

    // Busca os posts dos slots para exibir no admin
    const allIds = [
        ...(config.homeFeaturedPostId ? [config.homeFeaturedPostId] : []),
        ...config.homeSecondaryPostIds,
        ...config.homeSidebarPostIds,
        ...config.homeCarouselPostIds,
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

    const artists = config.homeSpotlightArtistId
        ? await prisma.artist.findMany({
            where: { id: config.homeSpotlightArtistId },
            select: {
                id: true,
                nameRomanized: true,
                nameHangul: true,
                primaryImageUrl: true,
                agency: { select: { name: true } },
            },
        })
        : []

    const artistsById = Object.fromEntries(artists.map(a => [a.id, a]))

    return NextResponse.json({ config, postsById, artistsById })
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
            homeCarouselPostIds?: string[]
            homeSpotlightArtistId?: string | null
            homeAffinityArtistWeight?: number
            homeAffinityGroupWeight?: number
            homeAffinityProductionWeight?: number
        }

        const current = await prisma.systemSettings.findUnique({
            where: { id: 'singleton' },
            select: {
                homeFeaturedPostId: true,
                homeSecondaryPostIds: true,
                homeSidebarPostIds: true,
                homeCarouselPostIds: true,
                homeSpotlightArtistId: true,
                homeAffinityArtistWeight: true,
                homeAffinityGroupWeight: true,
                homeAffinityProductionWeight: true,
            },
        })

        const nextConfig = {
            homeFeaturedPostId: current?.homeFeaturedPostId ?? null,
            homeSecondaryPostIds: current?.homeSecondaryPostIds ?? [],
            homeSidebarPostIds: current?.homeSidebarPostIds ?? [],
            homeCarouselPostIds: current?.homeCarouselPostIds ?? [],
            homeSpotlightArtistId: current?.homeSpotlightArtistId ?? null,
            homeAffinityArtistWeight: current?.homeAffinityArtistWeight ?? 3,
            homeAffinityGroupWeight: current?.homeAffinityGroupWeight ?? 3,
            homeAffinityProductionWeight: current?.homeAffinityProductionWeight ?? 2,
        }

        if ('homeFeaturedPostId' in body) {
            nextConfig.homeFeaturedPostId = typeof body.homeFeaturedPostId === 'string' && body.homeFeaturedPostId.trim().length > 0
                ? body.homeFeaturedPostId.trim()
                : null
        }
        if ('homeSecondaryPostIds' in body) nextConfig.homeSecondaryPostIds = normalizeIds(body.homeSecondaryPostIds, 4)
        if ('homeSidebarPostIds' in body) nextConfig.homeSidebarPostIds = normalizeIds(body.homeSidebarPostIds, 8)
        if ('homeCarouselPostIds' in body) nextConfig.homeCarouselPostIds = normalizeIds(body.homeCarouselPostIds, 5)
        if ('homeSpotlightArtistId' in body) {
            nextConfig.homeSpotlightArtistId = typeof body.homeSpotlightArtistId === 'string' && body.homeSpotlightArtistId.trim().length > 0
                ? body.homeSpotlightArtistId.trim()
                : null
        }
        if ('homeAffinityArtistWeight' in body && Number.isFinite(body.homeAffinityArtistWeight)) {
            nextConfig.homeAffinityArtistWeight = Math.max(0, Math.min(10, Math.round(body.homeAffinityArtistWeight!)))
        }
        if ('homeAffinityGroupWeight' in body && Number.isFinite(body.homeAffinityGroupWeight)) {
            nextConfig.homeAffinityGroupWeight = Math.max(0, Math.min(10, Math.round(body.homeAffinityGroupWeight!)))
        }
        if ('homeAffinityProductionWeight' in body && Number.isFinite(body.homeAffinityProductionWeight)) {
            nextConfig.homeAffinityProductionWeight = Math.max(0, Math.min(10, Math.round(body.homeAffinityProductionWeight!)))
        }

        const allIds = [
            ...(nextConfig.homeFeaturedPostId ? [nextConfig.homeFeaturedPostId] : []),
            ...nextConfig.homeSecondaryPostIds,
            ...nextConfig.homeSidebarPostIds,
            ...nextConfig.homeCarouselPostIds,
        ]

        if (new Set(allIds).size !== allIds.length) {
            return NextResponse.json(
                { error: 'Um mesmo post nao pode aparecer em mais de um slot editorial.' },
                { status: 400 }
            )
        }

        const data: {
            homeFeaturedPostId?: string | null
            homeSecondaryPostIds?: string[]
            homeSidebarPostIds?: string[]
            homeCarouselPostIds?: string[]
            homeSpotlightArtistId?: string | null
            homeAffinityArtistWeight?: number
            homeAffinityGroupWeight?: number
            homeAffinityProductionWeight?: number
        } = {}

        data.homeFeaturedPostId = nextConfig.homeFeaturedPostId
        data.homeSecondaryPostIds = nextConfig.homeSecondaryPostIds
        data.homeSidebarPostIds = nextConfig.homeSidebarPostIds
        data.homeCarouselPostIds = nextConfig.homeCarouselPostIds
        data.homeSpotlightArtistId = nextConfig.homeSpotlightArtistId
        data.homeAffinityArtistWeight = nextConfig.homeAffinityArtistWeight
        data.homeAffinityGroupWeight = nextConfig.homeAffinityGroupWeight
        data.homeAffinityProductionWeight = nextConfig.homeAffinityProductionWeight

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
                homeCarouselPostIds: [],
                homeSpotlightArtistId: null,
                homeAffinityArtistWeight: 3,
                homeAffinityGroupWeight: 3,
                homeAffinityProductionWeight: 2,
                ...data,
            },
        })

        revalidatePath('/')
        revalidateTag(HOME_CACHE_TAG, { expire: 0 })
        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Error updating homepage config:', err)
        return NextResponse.json({ error: 'Falha ao salvar configuração' }, { status: 500 })
    }
}
