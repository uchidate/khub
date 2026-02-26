import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, Search, Heart, Eye, Newspaper, Music2, Users, BarChart3, RefreshCw } from 'lucide-react'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
    const session = await auth()
    if (!session) redirect('/auth/login?callbackUrl=/admin/analytics')
    if (session.user.role?.toLowerCase() !== 'admin') redirect('/dashboard')

    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [
        topArtists,
        topGroups,
        topNews,
        popularSearches,
        activityByType30d,
        totalViews,
        totalNewsViews,
        recentSearches,
    ] = await Promise.all([
        // Top artistas por trendingScore
        prisma.artist.findMany({
            orderBy: { trendingScore: 'desc' },
            take: 10,
            select: { id: true, nameRomanized: true, viewCount: true, trendingScore: true, primaryImageUrl: true },
        }),

        // Top grupos por trendingScore
        prisma.musicalGroup.findMany({
            orderBy: { trendingScore: 'desc' },
            take: 10,
            select: { id: true, name: true, viewCount: true, trendingScore: true, profileImageUrl: true },
        }),

        // Top notícias por viewCount (7 dias)
        prisma.news.findMany({
            where: { publishedAt: { gte: since7d } },
            orderBy: { viewCount: 'desc' },
            take: 10,
            select: { id: true, title: true, viewCount: true, trendingScore: true, source: true, publishedAt: true },
        }),

        // Buscas mais populares (top 20 queries)
        prisma.activity.groupBy({
            by: ['metadata'],
            where: {
                type: 'SEARCH',
                createdAt: { gte: since30d },
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 50, // pegar mais para agrupar por query
        }),

        // Engajamento: Activity por tipo nos últimos 30 dias
        prisma.activity.groupBy({
            by: ['type'],
            where: { createdAt: { gte: since30d } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
        }),

        // Total de views de artistas
        prisma.artist.aggregate({ _sum: { viewCount: true } }),

        // Total de views de notícias
        prisma.news.aggregate({ _sum: { viewCount: true } }),

        // Buscas recentes (últimas 20)
        prisma.activity.findMany({
            where: { type: 'SEARCH', createdAt: { gte: since7d } },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: { metadata: true, createdAt: true },
        }),
    ])

    // Agregar buscas por query
    const searchMap = new Map<string, number>()
    for (const act of popularSearches) {
        const meta = act.metadata as any
        const query = typeof meta?.query === 'string' ? meta.query.toLowerCase() : null
        if (!query) continue
        searchMap.set(query, (searchMap.get(query) ?? 0) + act._count.id)
    }
    const topSearchTerms = Array.from(searchMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)

    const totalArtistViews = totalViews._sum.viewCount ?? 0
    const totalNewsViewCount = totalNewsViews._sum.viewCount ?? 0

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-2 block">
                            ← Admin
                        </Link>
                        <h1 className="text-4xl font-black tracking-tighter">Analytics</h1>
                        <p className="text-zinc-500 text-sm mt-1">Métricas de uso e performance do conteúdo</p>
                    </div>
                    <form action="/api/cron/update-trending" method="POST">
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg text-sm text-purple-400 hover:bg-purple-600/30 transition-all"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Atualizar Trending
                        </button>
                    </form>
                </div>

                {/* Cards de resumo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <div className="p-5 bg-zinc-900/50 border border-white/5 rounded-xl">
                        <Eye className="w-5 h-5 text-blue-400 mb-3" />
                        <p className="text-2xl font-black">{totalArtistViews.toLocaleString('pt-BR')}</p>
                        <p className="text-xs text-zinc-500 mt-1">Views de artistas</p>
                    </div>
                    <div className="p-5 bg-zinc-900/50 border border-white/5 rounded-xl">
                        <Newspaper className="w-5 h-5 text-green-400 mb-3" />
                        <p className="text-2xl font-black">{totalNewsViewCount.toLocaleString('pt-BR')}</p>
                        <p className="text-xs text-zinc-500 mt-1">Views de notícias</p>
                    </div>
                    <div className="p-5 bg-zinc-900/50 border border-white/5 rounded-xl">
                        <Search className="w-5 h-5 text-yellow-400 mb-3" />
                        <p className="text-2xl font-black">{topSearchTerms.length}</p>
                        <p className="text-xs text-zinc-500 mt-1">Termos buscados (30d)</p>
                    </div>
                    <div className="p-5 bg-zinc-900/50 border border-white/5 rounded-xl">
                        <BarChart3 className="w-5 h-5 text-purple-400 mb-3" />
                        <p className="text-2xl font-black">
                            {activityByType30d.reduce((s, a) => s + a._count.id, 0).toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">Eventos (30d)</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Artistas Trending */}
                    <section className="p-6 bg-zinc-900/30 border border-white/5 rounded-xl">
                        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-400 mb-5">
                            <Music2 className="w-4 h-4" />
                            Top Artistas Trending
                        </h2>
                        <div className="space-y-3">
                            {topArtists.map((artist, i) => (
                                <div key={artist.id} className="flex items-center gap-3">
                                    <span className="text-xs font-black text-zinc-600 w-5 text-right">{i + 1}</span>
                                    <Link
                                        href={`/artists/${artist.id}`}
                                        className="flex-1 text-sm font-medium text-white hover:text-purple-400 transition-colors truncate"
                                    >
                                        {artist.nameRomanized}
                                    </Link>
                                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            {artist.viewCount.toLocaleString('pt-BR')}
                                        </span>
                                        <span className="flex items-center gap-1 text-purple-400">
                                            <TrendingUp className="w-3 h-3" />
                                            {artist.trendingScore.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {topArtists.length === 0 && (
                                <p className="text-zinc-600 text-sm">Nenhum dado ainda. Execute o cron de trending.</p>
                            )}
                        </div>
                    </section>

                    {/* Top Grupos Trending */}
                    <section className="p-6 bg-zinc-900/30 border border-white/5 rounded-xl">
                        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-400 mb-5">
                            <Users className="w-4 h-4" />
                            Top Grupos Trending
                        </h2>
                        <div className="space-y-3">
                            {topGroups.map((group, i) => (
                                <div key={group.id} className="flex items-center gap-3">
                                    <span className="text-xs font-black text-zinc-600 w-5 text-right">{i + 1}</span>
                                    <Link
                                        href={`/groups/${group.id}`}
                                        className="flex-1 text-sm font-medium text-white hover:text-purple-400 transition-colors truncate"
                                    >
                                        {group.name}
                                    </Link>
                                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            {group.viewCount.toLocaleString('pt-BR')}
                                        </span>
                                        <span className="flex items-center gap-1 text-purple-400">
                                            <TrendingUp className="w-3 h-3" />
                                            {group.trendingScore.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {topGroups.length === 0 && (
                                <p className="text-zinc-600 text-sm">Nenhum dado ainda.</p>
                            )}
                        </div>
                    </section>

                    {/* Top Notícias (7d) */}
                    <section className="p-6 bg-zinc-900/30 border border-white/5 rounded-xl">
                        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-400 mb-5">
                            <Newspaper className="w-4 h-4" />
                            Top Notícias — Últimos 7 dias
                        </h2>
                        <div className="space-y-3">
                            {topNews.map((item, i) => (
                                <div key={item.id} className="flex items-start gap-3">
                                    <span className="text-xs font-black text-zinc-600 w-5 text-right mt-0.5">{i + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/news/${item.id}`}
                                            className="text-sm font-medium text-white hover:text-purple-400 transition-colors line-clamp-1"
                                        >
                                            {item.title}
                                        </Link>
                                        <p className="text-[10px] text-zinc-600 mt-0.5">
                                            {item.source} · {new Date(item.publishedAt).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <span className="flex items-center gap-1 text-xs text-zinc-500 shrink-0">
                                        <Eye className="w-3 h-3" />
                                        {item.viewCount.toLocaleString('pt-BR')}
                                    </span>
                                </div>
                            ))}
                            {topNews.length === 0 && (
                                <p className="text-zinc-600 text-sm">Nenhuma notícia visualizada ainda.</p>
                            )}
                        </div>
                    </section>

                    {/* Buscas Populares */}
                    <section className="p-6 bg-zinc-900/30 border border-white/5 rounded-xl">
                        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-400 mb-5">
                            <Search className="w-4 h-4" />
                            Buscas Populares — 30 dias
                        </h2>
                        {topSearchTerms.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {topSearchTerms.map(([term, count]) => (
                                    <span
                                        key={term}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 border border-white/5 rounded-full text-xs text-zinc-300"
                                    >
                                        {term}
                                        <span className="text-[10px] font-black text-purple-400">{count}x</span>
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-zinc-600 text-sm">
                                Nenhuma busca registrada ainda (apenas usuários autenticados).
                            </p>
                        )}

                        {/* Buscas recentes */}
                        {recentSearches.length > 0 && (
                            <div className="mt-6">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">Recentes (7d)</p>
                                <div className="space-y-1.5">
                                    {recentSearches.slice(0, 8).map((act, i) => {
                                        const meta = act.metadata as any
                                        return (
                                            <div key={i} className="flex items-center justify-between text-xs">
                                                <span className="text-zinc-400">{meta?.query ?? '—'}</span>
                                                <span className="text-zinc-600">
                                                    {new Date(act.createdAt).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Engajamento por tipo (30d) */}
                    <section className="p-6 bg-zinc-900/30 border border-white/5 rounded-xl lg:col-span-2">
                        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-400 mb-5">
                            <Heart className="w-4 h-4" />
                            Engajamento por Tipo — Últimos 30 dias
                        </h2>
                        {activityByType30d.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {activityByType30d.map((act) => (
                                    <div key={act.type} className="p-4 bg-zinc-900 border border-white/5 rounded-lg text-center">
                                        <p className="text-2xl font-black text-white">{act._count.id.toLocaleString('pt-BR')}</p>
                                        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mt-1">{act.type}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-zinc-600 text-sm">Nenhum evento registrado nos últimos 30 dias.</p>
                        )}
                    </section>
                </div>
            </div>
        </div>
    )
}
