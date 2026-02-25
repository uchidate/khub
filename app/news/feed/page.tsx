import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { PageTransition } from '@/components/features/PageTransition'
import { Heart, Calendar, User, Rss, Newspaper, ArrowLeft, Sparkles } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

export const metadata = {
    title: 'Feed Personalizado | HallyuHub',
    description: 'Notícias dos seus artistas favoritos em um único lugar.',
}

export default async function NewsFeedPage() {
    const session = await auth()

    let personalizedNews: any[] = []
    let favoritesCount = 0
    let isAuthenticated = !!session

    if (session?.user?.id) {
        const favoriteArtists = await prisma.favorite.findMany({
            where: { userId: session.user.id, artistId: { not: null } },
            select: {
                artist: { select: { id: true, nameRomanized: true, primaryImageUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
        })

        favoritesCount = favoriteArtists.length
        const artistIds = favoriteArtists.map(f => f.artist!.id).filter(Boolean)

        if (artistIds.length > 0) {
            personalizedNews = await prisma.news.findMany({
                where: {
                    artists: { some: { artistId: { in: artistIds } } },
                    translationStatus: 'completed',
                },
                orderBy: { publishedAt: 'desc' },
                take: 30,
                select: {
                    id: true,
                    title: true,
                    imageUrl: true,
                    publishedAt: true,
                    tags: true,
                    source: true,
                    artists: {
                        select: { artist: { select: { nameRomanized: true } } },
                        take: 3,
                    },
                },
            })
        }
    }

    // Fallback: últimas notícias traduzidas
    const fallbackNews = personalizedNews.length === 0
        ? await prisma.news.findMany({
            where: { translationStatus: 'completed' },
            orderBy: { publishedAt: 'desc' },
            take: 30,
            select: {
                id: true,
                title: true,
                imageUrl: true,
                publishedAt: true,
                tags: true,
                source: true,
                artists: {
                    select: { artist: { select: { nameRomanized: true } } },
                    take: 3,
                },
            },
        })
        : []

    const newsToShow = personalizedNews.length > 0 ? personalizedNews : fallbackNews
    const isPersonalized = personalizedNews.length > 0

    return (
        <PageTransition className="pt-24 md:pt-28 pb-20 px-4 sm:px-8 md:px-12">
            <div className="max-w-5xl mx-auto">

                {/* Breadcrumb */}
                <div className="mb-8">
                    <Breadcrumbs items={[
                        { label: 'Notícias', href: '/news' },
                        { label: 'Feed' },
                    ]} />
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-xl ${isPersonalized ? 'bg-gradient-to-br from-pink-500 to-rose-500' : 'bg-zinc-800'}`}>
                                {isPersonalized ? (
                                    <Heart className="w-5 h-5 text-white fill-white" />
                                ) : (
                                    <Newspaper className="w-5 h-5 text-zinc-400" />
                                )}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-display font-black text-white uppercase italic tracking-tight">
                                {isPersonalized ? 'Para Você' : 'Últimas Notícias'}
                            </h1>
                            {isPersonalized && (
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-neon-pink/20 text-neon-pink border border-neon-pink/30">
                                    <Sparkles size={9} />
                                    Personalizado
                                </span>
                            )}
                        </div>
                        <p className="text-zinc-500 text-sm">
                            {isPersonalized
                                ? `Baseado nos seus ${favoritesCount} artista${favoritesCount !== 1 ? 's' : ''} favorito${favoritesCount !== 1 ? 's' : ''} — ${newsToShow.length} notícias`
                                : `${newsToShow.length} notícias mais recentes`
                            }
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {!isAuthenticated && (
                            <Link href="/auth/login?callbackUrl=/news/feed"
                                className="text-xs font-black uppercase tracking-widest px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-500 transition-colors">
                                Entrar para personalizar
                            </Link>
                        )}
                        {isAuthenticated && !isPersonalized && (
                            <Link href="/artists"
                                className="text-xs font-black uppercase tracking-widest px-4 py-2 bg-pink-600/20 text-pink-400 border border-pink-500/30 rounded-full hover:bg-pink-600/30 transition-colors">
                                Favoritar artistas →
                            </Link>
                        )}
                        <Link href="/news/rss"
                            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-orange-400 transition-colors"
                            title="Feed RSS">
                            <Rss size={14} />
                            RSS
                        </Link>
                    </div>
                </div>

                {/* Aviso para não logados */}
                {!isAuthenticated && (
                    <div className="glass-card p-6 border-purple-500/20 bg-purple-500/5 mb-8 flex items-start gap-4">
                        <Heart className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-white font-bold mb-1">Ative o feed personalizado</p>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Faça login e favorite seus artistas para ver apenas as notícias que te interessam.
                            </p>
                        </div>
                    </div>
                )}

                {/* Grid de Notícias */}
                {newsToShow.length === 0 ? (
                    <div className="text-center py-20 text-zinc-600">
                        <Newspaper size={40} className="mx-auto mb-4 opacity-40" />
                        <p className="font-bold">Nenhuma notícia encontrada</p>
                        <Link href="/news" className="text-xs text-purple-400 mt-2 inline-block">
                            Ver todas as notícias →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {newsToShow.map((item: any) => {
                            const mentionedArtists = item.artists?.map((a: any) => a.artist.nameRomanized) ?? []
                            return (
                                <Link
                                    key={item.id}
                                    href={`/news/${item.id}`}
                                    className="group flex gap-4 p-4 glass-card border-white/5 hover:border-pink-500/20 hover:bg-white/[0.02] transition-all rounded-2xl"
                                >
                                    {/* Thumbnail */}
                                    {item.imageUrl ? (
                                        <div className="relative w-28 h-20 md:w-40 md:h-28 shrink-0 rounded-xl overflow-hidden bg-zinc-900">
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                sizes="160px"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-28 h-20 md:w-40 md:h-28 shrink-0 rounded-xl bg-zinc-900 flex items-center justify-center">
                                            <Newspaper size={20} className="text-zinc-700" />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex flex-col justify-between min-w-0 flex-grow py-1">
                                        <div>
                                            {/* Tags */}
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                {item.tags?.slice(0, 2).map((tag: string) => (
                                                    <span key={tag} className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 text-zinc-500">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {isPersonalized && item.artists?.length > 0 && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-neon-pink/10 text-neon-pink">
                                                        Para você
                                                    </span>
                                                )}
                                            </div>

                                            {/* Título */}
                                            <h3 className="text-white font-bold text-base md:text-lg leading-snug line-clamp-2 group-hover:text-pink-400 transition-colors">
                                                {item.title}
                                            </h3>
                                        </div>

                                        {/* Meta */}
                                        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={11} />
                                                {new Date(item.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                            </span>
                                            {item.source && <span>{item.source}</span>}
                                            {mentionedArtists.length > 0 && (
                                                <span className="flex items-center gap-1 text-neon-pink/60 truncate">
                                                    <User size={11} />
                                                    {mentionedArtists.slice(0, 2).join(' · ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}

                {/* Footer links */}
                <div className="flex items-center justify-between mt-12 pt-6 border-t border-white/5">
                    <Link href="/news" className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors font-black uppercase tracking-widest">
                        <ArrowLeft size={14} />
                        Todas as notícias
                    </Link>
                    <Link href="/news/rss" className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-orange-400 transition-colors">
                        <Rss size={12} />
                        Assinar RSS
                    </Link>
                </div>
            </div>
        </PageTransition>
    )
}
