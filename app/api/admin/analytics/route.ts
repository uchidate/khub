import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/analytics?days=30
 *
 * Retorna dados agregados para o painel de analytics:
 * - Série temporal de views (ViewEvent) pelos últimos N dias
 * - Top blog posts, artistas, notícias, grupos por viewCount
 * - Totais gerais e stats de usuários
 */
export async function GET(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const days    = Math.min(parseInt(req.nextUrl.searchParams.get('days') ?? '30'), 90)
    const sinceTs = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    sinceTs.setHours(0, 0, 0, 0)
    const since7d  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000)
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [
        // Série temporal agrupada por (date, entityType)
        timeseries,

        // Top conteúdo por views (all-time)
        topBlog,
        topArtists,
        topNews,
        topGroups,

        // Totais
        totalBlogViews,
        totalArtistViews,
        totalNewsViews,
        totalGroupViews,

        // Usuários
        totalUsers,
        newUsers7d,
        newUsers30d,

        // Conteúdo publicado recentemente
        postsPublished7d,
        newsPublished7d,

        // Engajamento
        activityByType30d,

        // Buscas populares
        popularSearches,
    ] = await Promise.all([
        // Série temporal: sum de views por dia × entityType nos últimos N dias
        prisma.viewEvent.groupBy({
            by: ['date', 'entityType'],
            where: { date: { gte: sinceTs } },
            _sum: { count: true },
            orderBy: { date: 'asc' },
        }),

        prisma.blogPost.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: { viewCount: 'desc' },
            take: 10,
            select: { id: true, slug: true, title: true, viewCount: true, coverImageUrl: true, publishedAt: true, category: { select: { name: true } } },
        }),

        prisma.artist.findMany({
            where: { isHidden: false },
            orderBy: { viewCount: 'desc' },
            take: 10,
            select: { id: true, nameRomanized: true, viewCount: true, trendingScore: true, primaryImageUrl: true },
        }),

        prisma.news.findMany({
            where: { status: 'published' },
            orderBy: { viewCount: 'desc' },
            take: 10,
            select: { id: true, title: true, viewCount: true, source: true, publishedAt: true },
        }),

        prisma.musicalGroup.findMany({
            orderBy: { viewCount: 'desc' },
            take: 10,
            select: { id: true, name: true, viewCount: true, trendingScore: true, profileImageUrl: true },
        }),

        prisma.blogPost.aggregate({ _sum: { viewCount: true } }),
        prisma.artist.aggregate({ _sum: { viewCount: true } }),
        prisma.news.aggregate({ _sum: { viewCount: true } }),
        prisma.musicalGroup.aggregate({ _sum: { viewCount: true } }),

        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: since7d } } }),
        prisma.user.count({ where: { createdAt: { gte: since30d } } }),

        prisma.blogPost.count({ where: { status: 'PUBLISHED', publishedAt: { gte: since7d } } }),
        prisma.news.count({ where: { status: 'published', publishedAt: { gte: since7d } } }),

        prisma.activity.groupBy({
            by: ['type'],
            where: { createdAt: { gte: since30d } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
        }),

        prisma.activity.groupBy({
            by: ['metadata'],
            where: { type: 'SEARCH', createdAt: { gte: since30d } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 50,
        }),
    ])

    // Normalizar série temporal em { date: string, blog, artist, news, group, total }[]
    const dateMap = new Map<string, Record<string, number>>()
    for (const row of timeseries) {
        const key = row.date.toISOString().slice(0, 10)
        if (!dateMap.has(key)) dateMap.set(key, { blog: 0, artist: 0, news: 0, group: 0 })
        dateMap.get(key)![row.entityType] = row._sum.count ?? 0
    }
    // Preencher dias sem dados
    const timeseriesNormalized: Array<{ date: string; blog: number; artist: number; news: number; group: number; total: number }> = []
    for (let i = days - 1; i >= 0; i--) {
        const d   = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const key = d.toISOString().slice(0, 10)
        const row = dateMap.get(key) ?? {}
        timeseriesNormalized.push({
            date:   key,
            blog:   row.blog   ?? 0,
            artist: row.artist ?? 0,
            news:   row.news   ?? 0,
            group:  row.group  ?? 0,
            total:  (row.blog ?? 0) + (row.artist ?? 0) + (row.news ?? 0) + (row.group ?? 0),
        })
    }

    // Agregar buscas por query
    const searchMap = new Map<string, number>()
    for (const act of popularSearches) {
        const meta  = act.metadata as Record<string, unknown> | null
        const query = typeof meta?.query === 'string' ? meta.query.toLowerCase().trim() : null
        if (!query || query.length < 2) continue
        searchMap.set(query, (searchMap.get(query) ?? 0) + act._count.id)
    }
    const topSearchTerms = Array.from(searchMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([term, count]) => ({ term, count }))

    return NextResponse.json({
        timeseries: timeseriesNormalized,
        topBlog,
        topArtists,
        topNews,
        topGroups,
        totals: {
            blog:   totalBlogViews._sum.viewCount   ?? 0,
            artist: totalArtistViews._sum.viewCount ?? 0,
            news:   totalNewsViews._sum.viewCount   ?? 0,
            group:  totalGroupViews._sum.viewCount  ?? 0,
        },
        users: { total: totalUsers, new7d: newUsers7d, new30d: newUsers30d },
        published7d: { posts: postsPublished7d, news: newsPublished7d },
        activityByType30d,
        topSearchTerms,
    })
}
