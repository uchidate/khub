import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/analytics?days=30
 * GET /api/admin/analytics?days=0  → modo "hoje" com slots de 15min
 *
 * Retorna dados agregados para o painel de analytics:
 * - Série temporal de views (ViewEvent) pelos últimos N dias
 * - Se days=0: série intra-dia com slots de 15min (ViewEventHourly)
 * - Top blog posts, artistas, notícias, grupos por viewCount
 * - Totais gerais e stats de usuários
 */
export async function GET(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const daysParam = req.nextUrl.searchParams.get('days') ?? '30'
    const isToday   = daysParam === '0'
    const days      = isToday ? 1 : Math.min(parseInt(daysParam), 90)

    const sinceTs  = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    sinceTs.setUTCHours(0, 0, 0, 0)
    const since7d  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000)
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // "hoje" começa à meia-noite UTC
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    const [
        timeseries,
        todaySlots,

        topBlog,
        topArtists,
        topNews,
        topGroups,

        topBlogToday,
        topArtistsToday,
        topNewsToday,
        topGroupsToday,

        totalBlogViews,
        totalArtistViews,
        totalNewsViews,
        totalGroupViews,

        totalUsers,
        newUsers7d,
        newUsers30d,

        postsPublished7d,
        newsPublished7d,

        activityByType30d,

        popularSearches,
    ] = await Promise.all([
        // Série diária
        prisma.viewEvent.groupBy({
            by: ['date', 'entityType'],
            where: { date: { gte: sinceTs } },
            _sum: { count: true },
            orderBy: { date: 'asc' },
        }),

        // Série intra-dia (slots de 15min) — só consultada quando days=0
        isToday
            ? prisma.viewEventHourly.groupBy({
                by: ['slot', 'entityType'],
                where: { date: { gte: todayStart } },
                _sum: { count: true },
                orderBy: { slot: 'asc' },
              })
            : Promise.resolve([]),

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

        // Top hoje (via ViewEvent diário — mesma fonte do gráfico, mais confiável que ViewEventHourly)
        isToday
            ? prisma.viewEvent.groupBy({
                by: ['entityId', 'entityType'],
                where: { date: { gte: todayStart }, entityType: 'blog' },
                _sum: { count: true },
                orderBy: { _sum: { count: 'desc' } },
                take: 10,
              })
            : Promise.resolve([]),

        isToday
            ? prisma.viewEvent.groupBy({
                by: ['entityId', 'entityType'],
                where: { date: { gte: todayStart }, entityType: 'artist' },
                _sum: { count: true },
                orderBy: { _sum: { count: 'desc' } },
                take: 10,
              })
            : Promise.resolve([]),

        isToday
            ? prisma.viewEvent.groupBy({
                by: ['entityId', 'entityType'],
                where: { date: { gte: todayStart }, entityType: 'news' },
                _sum: { count: true },
                orderBy: { _sum: { count: 'desc' } },
                take: 10,
              })
            : Promise.resolve([]),

        isToday
            ? prisma.viewEvent.groupBy({
                by: ['entityId', 'entityType'],
                where: { date: { gte: todayStart }, entityType: 'group' },
                _sum: { count: true },
                orderBy: { _sum: { count: 'desc' } },
                take: 10,
              })
            : Promise.resolve([]),

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

    // ── Série diária ─────────────────────────────────────────────────────────
    const dateMap = new Map<string, Record<string, number>>()
    for (const row of timeseries) {
        const key = row.date.toISOString().slice(0, 10)
        if (!dateMap.has(key)) dateMap.set(key, { blog: 0, artist: 0, news: 0, group: 0 })
        dateMap.get(key)![row.entityType] = row._sum.count ?? 0
    }
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

    // ── Série intra-dia (96 slots de 15min) ──────────────────────────────────
    const slotMap = new Map<number, Record<string, number>>()
    for (const row of todaySlots as Array<{ slot: number; entityType: string; _sum: { count: number | null } }>) {
        if (!slotMap.has(row.slot)) slotMap.set(row.slot, { blog: 0, artist: 0, news: 0, group: 0 })
        slotMap.get(row.slot)![row.entityType] = row._sum.count ?? 0
    }
    const currentSlot = Math.floor(new Date().getUTCHours() * 4 + new Date().getUTCMinutes() / 15)
    const intraday: Array<{ slot: number; label: string; blog: number; artist: number; news: number; group: number; total: number }> = []
    for (let s = 0; s <= currentSlot; s++) {
        const h   = Math.floor(s / 4)
        const m   = (s % 4) * 15
        const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        const row   = slotMap.get(s) ?? {}
        intraday.push({
            slot:   s,
            label,
            blog:   row.blog   ?? 0,
            artist: row.artist ?? 0,
            news:   row.news   ?? 0,
            group:  row.group  ?? 0,
            total:  (row.blog ?? 0) + (row.artist ?? 0) + (row.news ?? 0) + (row.group ?? 0),
        })
    }

    // ── Top hoje: enriquecer IDs com dados das entidades ─────────────────────
    type TodayRankRow = { entityId: string; _sum: { count: number | null } }

    const enrichTopToday = async <T extends { id: string }>(
        rows: TodayRankRow[],
        fetcher: (ids: string[]) => Promise<T[]>,
        viewsKey: (item: T) => number,
    ) => {
        if (!rows.length) return []
        const ids     = rows.map(r => r.entityId)
        const items   = await fetcher(ids)
        const idMap   = new Map(items.map(i => [i.id, i]))
        const countMap = new Map(rows.map(r => [r.entityId, r._sum.count ?? 0]))
        return ids
            .map(id => ({ item: idMap.get(id), todayViews: countMap.get(id) ?? 0 }))
            .filter(x => x.item !== undefined)
            .map(({ item, todayViews }) => ({ ...item!, viewCount: viewsKey(item!), todayViews }))
    }

    const [topBlogToday_, topArtistsToday_, topNewsToday_, topGroupsToday_] = await Promise.all([
        enrichTopToday(
            topBlogToday as TodayRankRow[],
            ids => prisma.blogPost.findMany({ where: { id: { in: ids } }, select: { id: true, slug: true, title: true, viewCount: true, coverImageUrl: true, publishedAt: true, category: { select: { name: true } } } }),
            i => i.viewCount,
        ),
        enrichTopToday(
            topArtistsToday as TodayRankRow[],
            ids => prisma.artist.findMany({ where: { id: { in: ids } }, select: { id: true, nameRomanized: true, viewCount: true, trendingScore: true, primaryImageUrl: true } }),
            i => i.viewCount,
        ),
        enrichTopToday(
            topNewsToday as TodayRankRow[],
            ids => prisma.news.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, viewCount: true, source: true, publishedAt: true } }),
            i => i.viewCount,
        ),
        enrichTopToday(
            topGroupsToday as TodayRankRow[],
            ids => prisma.musicalGroup.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, viewCount: true, trendingScore: true, profileImageUrl: true } }),
            i => i.viewCount,
        ),
    ])

    // ── Buscas populares ─────────────────────────────────────────────────────
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
        intraday,
        topBlog,
        topArtists,
        topNews,
        topGroups,
        topBlogToday:    topBlogToday_,
        topArtistsToday: topArtistsToday_,
        topNewsToday:    topNewsToday_,
        topGroupsToday:  topGroupsToday_,
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
