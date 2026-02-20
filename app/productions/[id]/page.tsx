import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { FavoriteButton } from "@/components/ui/FavoriteButton"
import { TrailerModal } from "@/components/features/TrailerModal"
import { JsonLd } from "@/components/seo/JsonLd"
import { Film } from "lucide-react"
import type { Metadata } from "next"

const BASE_URL = 'https://www.hallyuhub.com.br'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const production = await prisma.production.findUnique({
        where: { id: params.id },
        include: {
            artists: {
                include: { artist: true }
            }
        }
    })

    if (!production) {
        return {
            title: 'Produção não encontrada - HallyuHub',
            description: 'Esta produção não foi encontrada em nossa base de dados.'
        }
    }

    const description = production.synopsis || `${production.titlePt} (${production.titleKr}) - ${production.type} ${production.year ? `de ${production.year}` : ''}`
    const castNames = production.artists.slice(0, 3).map(a => a.artist.nameRomanized).join(', ')
    const fullDescription = production.synopsis
        ? `${production.synopsis.slice(0, 120)}...${castNames ? ` Elenco: ${castNames}` : ''}`
        : description

    return {
        title: `${production.titlePt} (${production.titleKr}) - HallyuHub`,
        description: fullDescription.slice(0, 160),
        alternates: {
            canonical: `${BASE_URL}/productions/${params.id}`,
        },
        openGraph: {
            title: `${production.titlePt} - HallyuHub`,
            description: fullDescription.slice(0, 160),
            images: production.imageUrl ? [{
                url: production.imageUrl,
                width: 1200,
                height: 630,
                alt: production.titlePt
            }] : [],
            type: 'video.movie',
            url: `${BASE_URL}/productions/${params.id}`,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${production.titlePt} - HallyuHub`,
            description: fullDescription.slice(0, 160),
            images: production.imageUrl ? [production.imageUrl] : []
        }
    }
}

export default async function ProductionDetailPage({ params }: { params: { id: string } }) {
    const production = await prisma.production.findUnique({
        where: { id: params.id },
        include: {
            artists: {
                include: { artist: true },
                orderBy: { role: 'asc' }
            }
        }
    })

    if (!production) {
        notFound()
    }

    // Related productions: same tags overlap OR same type, ordered by rating
    const tags = (production.tags || []) as string[]
    const relatedProductions = await prisma.production.findMany({
        where: {
            id: { not: production.id },
            OR: [
                ...(tags.length > 0 ? [{ tags: { hasSome: tags } }] : []),
                { type: production.type },
            ],
        },
        orderBy: [{ voteAverage: 'desc' }, { year: 'desc' }],
        take: 6,
        select: {
            id: true, titlePt: true, titleKr: true, type: true,
            year: true, imageUrl: true, backdropUrl: true, voteAverage: true,
        },
    })

    const galleryUrls = (production.galleryUrls as string[] | null) || []

    const heroImageUrl = production.backdropUrl || production.imageUrl

    function formatRuntime(minutes: number | null): string | null {
        if (!minutes) return null
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        if (h === 0) return `${m}min`
        return m === 0 ? `${h}h` : `${h}h ${m}min`
    }

    const isMovie = production.type === 'MOVIE' || production.type === 'FILM'
    const schemaType = isMovie ? 'Movie' : 'TVSeries'
    const castActors = production.artists.slice(0, 10).map(a => ({
        "@type": "Person",
        "name": a.artist.nameRomanized,
        "url": `${BASE_URL}/artists/${a.artist.id}`,
    }))

    return (
        <div className="min-h-screen">
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": schemaType,
                "name": production.titlePt,
                "alternateName": production.titleKr ?? undefined,
                "description": production.synopsis?.slice(0, 300) ?? undefined,
                "image": production.imageUrl ?? undefined,
                "url": `${BASE_URL}/productions/${production.id}`,
                "inLanguage": "ko",
                "countryOfOrigin": { "@type": "Country", "name": "Korea, Republic of" },
                ...(production.year ? { "datePublished": String(production.year) } : {}),
                ...(castActors.length ? { "actor": castActors } : {}),
                ...(production.tags?.length ? { "genre": production.tags } : {}),
            }} />
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Produções", "item": `${BASE_URL}/productions` },
                    { "@type": "ListItem", "position": 2, "name": production.titlePt, "item": `${BASE_URL}/productions/${production.id}` },
                ],
            }} />
            {/* Cinematic Hero */}
            <div className="relative h-[50vh] md:h-[60vh] bg-black overflow-hidden">
                {heroImageUrl ? (
                    <Image src={heroImageUrl} alt={production.titlePt} fill priority sizes="100vw" className="object-cover brightness-[0.45]" />
                ) : (
                    <>
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl" />
                    </>
                )}
                <div className="absolute inset-0 hero-gradient" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

                {/* Breadcrumbs */}
                <div className="absolute top-4 md:top-6 left-0 right-0 px-4 sm:px-12 md:px-20 flex justify-between items-start">
                    <Breadcrumbs items={[
                        { label: 'Filmes & Séries', href: '/productions' },
                        { label: production.titlePt }
                    ]} />
                    <FavoriteButton
                        id={production.id}
                        itemName={production.titlePt}
                        itemType="produção"
                        className="bg-black/50 backdrop-blur-sm hover:bg-black/70"
                    />
                </div>

                {/* Hero content */}
                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-12 md:px-20 pb-10 md:pb-16">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        {production.year && <span className="text-purple-500 font-bold text-sm">{production.year}</span>}
                        <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                        <span className="uppercase tracking-widest text-xs font-black px-2 py-0.5 border border-zinc-700 rounded-sm text-zinc-400">{production.type}</span>
                        {production.runtime && (
                            <span className="text-xs font-bold text-zinc-400">{formatRuntime(production.runtime)}</span>
                        )}
                        {production.ageRating && (
                            <span className={`text-xs font-black px-2 py-0.5 rounded-sm ${
                                production.ageRating === 'L'  ? 'bg-green-700/60 text-green-300 border border-green-600/40' :
                                production.ageRating === '10' ? 'bg-blue-700/60 text-blue-300 border border-blue-600/40' :
                                production.ageRating === '12' ? 'bg-yellow-700/60 text-yellow-300 border border-yellow-600/40' :
                                production.ageRating === '14' ? 'bg-orange-700/60 text-orange-300 border border-orange-600/40' :
                                production.ageRating === '16' ? 'bg-red-700/60 text-red-300 border border-red-600/40' :
                                'bg-red-950/80 text-red-400 border border-red-800/60'
                            }`}>
                                {production.ageRating === 'L' ? 'Livre' : `${production.ageRating}+`}
                            </span>
                        )}
                        {production.voteAverage && production.voteAverage > 0 && (
                            <span className={`text-xs font-black px-2 py-0.5 rounded-sm ${
                                production.voteAverage >= 7 ? 'text-green-400 bg-green-950/50 border border-green-800/40' :
                                production.voteAverage >= 5 ? 'text-yellow-400 bg-yellow-950/50 border border-yellow-800/40' :
                                'text-red-400 bg-red-950/50 border border-red-800/40'
                            }`}>
                                ★ {production.voteAverage.toFixed(1)}
                            </span>
                        )}
                        {production.streamingPlatforms && production.streamingPlatforms.map(p => (
                            <span key={p} className="text-xs font-bold text-white bg-zinc-800 px-3 py-0.5 rounded-sm border border-white/5">{p}</span>
                        ))}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tighter">{production.titlePt}</h1>
                    {production.titleKr && <p className="text-xl text-purple-500 font-bold mt-1 mb-8">{production.titleKr}</p>}

                    {production.trailerUrl && (
                        <div className="mt-8">
                            <TrailerModal trailerUrl={production.trailerUrl} title={production.titlePt} />
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-12 md:px-20 py-16">
                <div className="grid md:grid-cols-3 gap-16">
                    {/* Main column */}
                    <div className="md:col-span-2 space-y-10">
                        {production.synopsis && (
                            <div>
                                <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-3">Sinopse</h3>
                                <p className="text-zinc-400 leading-relaxed font-medium text-lg">{production.synopsis}</p>
                            </div>
                        )}

                        {tags.length > 0 && (
                            <div>
                                <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-3">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <span key={tag} className="text-xs font-bold text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-sm border border-white/5">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cast */}
                        {production.artists.length > 0 && (
                            <div>
                                <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-6">Elenco</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {production.artists.map(({ artist, role }) => (
                                        <Link key={artist.id} href={`/artists/${artist.id}`} className="group">
                                            <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-zinc-900 border border-white/5 hover:border-purple-500/30 transition-colors">
                                                {artist.primaryImageUrl ? (
                                                    <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500 brightness-[0.7] group-hover:brightness-90" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-zinc-700 font-black text-sm">{artist.nameRomanized}</div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                                    <p className="text-sm font-black text-white">{artist.nameRomanized}</p>
                                                    {role && <p className="text-xs text-purple-500 font-bold">{role}</p>}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Gallery */}
                        {galleryUrls.length > 0 && (
                            <div>
                                <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-6">Galeria</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {galleryUrls.map((url, i) => (
                                        <div key={i} className="aspect-video relative rounded-lg overflow-hidden border border-white/5">
                                            <Image
                                                src={url}
                                                alt={`${production.titlePt} - imagem ${i + 1}`}
                                                fill
                                                sizes="(max-width: 640px) 50vw, 33vw"
                                                className="object-cover hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Related productions */}
                        {relatedProductions.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                        <Film className="w-4 h-4" />
                                        Você também pode gostar
                                    </h3>
                                    <Link href="/productions" className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors">
                                        Ver tudo →
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {relatedProductions.map((rel) => (
                                        <Link key={rel.id} href={`/productions/${rel.id}`} className="group block">
                                            <div className="aspect-[2/3] relative rounded-xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-purple-500/30 transition-all mb-2">
                                                {rel.backdropUrl || rel.imageUrl ? (
                                                    <Image
                                                        src={rel.backdropUrl || rel.imageUrl!}
                                                        alt={rel.titlePt}
                                                        fill
                                                        sizes="(max-width: 640px) 50vw, 33vw"
                                                        className="object-cover brightness-75 group-hover:brightness-90 group-hover:scale-105 transition-all duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Film className="w-8 h-8 text-zinc-700" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                                {rel.voteAverage && rel.voteAverage > 0 && (
                                                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[10px] font-black text-yellow-400">
                                                        ★ {rel.voteAverage.toFixed(1)}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white line-clamp-1 group-hover:text-purple-300 transition-colors">{rel.titlePt}</p>
                                                <p className="text-[10px] text-zinc-600 font-bold mt-0.5">
                                                    {rel.year}{rel.year && rel.type ? ' · ' : ''}{rel.type}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div>
                        <div className="bg-zinc-900 rounded-lg border border-white/5 p-6 sticky top-24">
                            {production.voteAverage && production.voteAverage > 0 && (
                                <div className="flex justify-between py-3 border-b border-white/5 items-center">
                                    <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Nota TMDB</span>
                                    <span className={`text-sm font-black ${
                                        production.voteAverage >= 7 ? 'text-green-400' :
                                        production.voteAverage >= 5 ? 'text-yellow-400' :
                                        'text-red-400'
                                    }`}>★ {production.voteAverage.toFixed(1)}<span className="text-zinc-600 font-normal text-xs">/10</span></span>
                                </div>
                            )}
                            {production.releaseDate && (
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Estreia</span>
                                    <span className="text-sm font-bold text-zinc-300">
                                        {new Date(production.releaseDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            )}
                            {!production.releaseDate && production.year && (
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Ano</span>
                                    <span className="text-sm font-bold text-zinc-300">{production.year}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-3 border-b border-white/5">
                                <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Tipo</span>
                                <span className="text-sm font-bold text-zinc-300 uppercase">{production.type}</span>
                            </div>
                            {production.runtime && production.runtime > 0 && (
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Duração</span>
                                    <span className="text-sm font-bold text-zinc-300">{formatRuntime(production.runtime)}</span>
                                </div>
                            )}
                            {production.ageRating && (
                                <div className="flex justify-between py-3 border-b border-white/5 items-center">
                                    <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Classificação</span>
                                    <span className={`text-xs font-black px-2.5 py-1 rounded ${
                                        production.ageRating === 'L'  ? 'bg-green-600 text-white' :
                                        production.ageRating === '10' ? 'bg-blue-600 text-white' :
                                        production.ageRating === '12' ? 'bg-yellow-500 text-black' :
                                        production.ageRating === '14' ? 'bg-orange-500 text-white' :
                                        production.ageRating === '16' ? 'bg-red-600 text-white' :
                                        'bg-red-900 text-red-100'
                                    }`}>
                                        {production.ageRating === 'L' ? 'Livre' : `${production.ageRating} anos`}
                                    </span>
                                </div>
                            )}
                            {production.streamingPlatforms && production.streamingPlatforms.length > 0 && (
                                <div className="flex justify-between py-3 border-b border-white/5 items-center">
                                    <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Streaming</span>
                                    <div className="flex flex-wrap gap-1.5 justify-end">
                                        {production.streamingPlatforms.map(p => (
                                            <span key={p} className="text-xs font-black text-white bg-zinc-800 px-2 py-0.5 rounded-sm border border-white/5">{p}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between py-3">
                                <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Elenco</span>
                                <span className="text-sm font-bold text-zinc-300">{production.artists.length} artistas</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
