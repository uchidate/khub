import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { Search, User, Newspaper, Film, ArrowLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'

export const dynamic = 'force-dynamic'

interface SearchPageProps {
    searchParams: {
        q?: string
    }
}

async function SearchResults({ query }: { query: string }) {
    if (!query || query.trim().length < 2) {
        return (
            <div className="text-center py-20">
                <Search className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400 text-lg">Digite pelo menos 2 caracteres para buscar</p>
            </div>
        )
    }

    const searchTerm = query.trim()

    // Buscar em paralelo nos 3 modelos
    const [artists, news, productions] = await Promise.all([
        prisma.artist.findMany({
            where: {
                OR: [
                    { nameRomanized: { contains: searchTerm, mode: 'insensitive' } },
                    { nameHangul: { contains: searchTerm, mode: 'insensitive' } },
                    { stageNames: { has: searchTerm } }
                ]
            },
            select: {
                id: true,
                nameRomanized: true,
                nameHangul: true,
                primaryImageUrl: true,
                roles: true,
                trendingScore: true
            },
            orderBy: { trendingScore: 'desc' }
        }),

        prisma.news.findMany({
            where: {
                OR: [
                    { title: { contains: searchTerm, mode: 'insensitive' } },
                    { contentMd: { contains: searchTerm, mode: 'insensitive' } },
                    { tags: { has: searchTerm } }
                ]
            },
            select: {
                id: true,
                title: true,
                imageUrl: true,
                publishedAt: true,
                tags: true,
                contentMd: true
            },
            orderBy: { publishedAt: 'desc' }
        }),

        prisma.production.findMany({
            where: {
                OR: [
                    { titlePt: { contains: searchTerm, mode: 'insensitive' } },
                    { titleKr: { contains: searchTerm, mode: 'insensitive' } },
                    { synopsis: { contains: searchTerm, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                titlePt: true,
                titleKr: true,
                type: true,
                year: true,
                imageUrl: true,
                voteAverage: true,
                synopsis: true
            },
            orderBy: [
                { voteAverage: 'desc' },
                { year: 'desc' }
            ]
        })
    ])

    const total = artists.length + news.length + productions.length

    if (total === 0) {
        return (
            <div className="text-center py-20">
                <Search className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400 text-lg mb-2">
                    Nenhum resultado encontrado para &quot;{query}&quot;
                </p>
                <p className="text-zinc-600">
                    Tente buscar por artistas, notícias ou produções
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-12">
            {/* Summary */}
            <div className="text-center">
                <p className="text-zinc-400">
                    <span className="text-2xl font-bold text-white">{total}</span> resultado{total > 1 ? 's' : ''} para &quot;<span className="text-purple-400">{query}</span>&quot;
                </p>
            </div>

            {/* Artists */}
            {artists.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-600/20 rounded-lg">
                            <User className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white">Artistas</h2>
                            <p className="text-sm text-zinc-500">{artists.length} encontrado{artists.length > 1 ? 's' : ''}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {artists.map((artist) => (
                            <Link
                                key={artist.id}
                                href={`/artists/${artist.id}`}
                                className="group"
                            >
                                <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 mb-2">
                                    {artist.primaryImageUrl ? (
                                        <Image
                                            src={artist.primaryImageUrl}
                                            alt={artist.nameRomanized}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 text-white text-2xl font-bold">
                                            {artist.nameRomanized[0]}
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                                    {artist.nameRomanized}
                                </h3>
                                {artist.roles.length > 0 && (
                                    <p className="text-xs text-zinc-500 truncate">{artist.roles[0]}</p>
                                )}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* News */}
            {news.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-pink-600/20 rounded-lg">
                            <Newspaper className="w-5 h-5 text-pink-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white">Notícias</h2>
                            <p className="text-sm text-zinc-500">{news.length} encontrada{news.length > 1 ? 's' : ''}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {news.map((newsItem) => (
                            <Link
                                key={newsItem.id}
                                href={`/news/${newsItem.id}`}
                                className="group bg-zinc-900/50 rounded-xl overflow-hidden border border-white/5 hover:border-pink-500/30 transition-all"
                            >
                                {newsItem.imageUrl && (
                                    <div className="relative aspect-video overflow-hidden bg-zinc-900">
                                        <Image
                                            src={newsItem.imageUrl}
                                            alt={newsItem.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    </div>
                                )}
                                <div className="p-5">
                                    {newsItem.tags.length > 0 && (
                                        <div className="flex gap-2 mb-2">
                                            {newsItem.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="px-2 py-0.5 bg-pink-600/20 text-pink-400 text-xs font-bold rounded-full">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <h3 className="font-bold text-white group-hover:text-pink-400 transition-colors line-clamp-2 mb-2">
                                        {newsItem.title}
                                    </h3>
                                    <p className="text-sm text-zinc-500 line-clamp-2">{newsItem.contentMd}</p>
                                    <p className="text-xs text-zinc-600 mt-2">
                                        {new Date(newsItem.publishedAt).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Productions */}
            {productions.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-cyan-600/20 rounded-lg">
                            <Film className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white">Produções</h2>
                            <p className="text-sm text-zinc-500">{productions.length} encontrada{productions.length > 1 ? 's' : ''}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {productions.map((production) => (
                            <Link
                                key={production.id}
                                href={`/productions/${production.id}`}
                                className="group"
                            >
                                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 mb-2">
                                    {production.imageUrl ? (
                                        <Image
                                            src={production.imageUrl}
                                            alt={production.titlePt}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-800 p-4">
                                            <p className="text-white text-center text-xs font-bold line-clamp-3">
                                                {production.titlePt}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2 text-sm">
                                    {production.titlePt}
                                </h3>
                                <p className="text-xs text-zinc-500">
                                    {production.type} {production.year && `• ${production.year}`}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const query = searchParams.q || ''

    return (
        <div className="min-h-screen bg-black pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
                            <Search className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white">Resultados da Busca</h1>
                            {query && (
                                <p className="text-zinc-400 mt-1">Buscando por: &quot;{query}&quot;</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Results */}
                <Suspense fallback={<div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>}>
                    <SearchResults query={query} />
                </Suspense>
            </div>
        </div>
    )
}
