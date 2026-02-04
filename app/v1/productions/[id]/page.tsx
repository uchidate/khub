import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import type { Metadata } from "next"

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
        openGraph: {
            title: `${production.titlePt} - HallyuHub`,
            description: fullDescription.slice(0, 160),
            images: production.imageUrl ? [{
                url: production.imageUrl,
                width: 1200,
                height: 630,
                alt: production.titlePt
            }] : [],
            type: 'video.movie'
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
                include: { artist: true }
            }
        }
    })

    if (!production) {
        return (
            <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
                <Breadcrumbs items={[{ label: 'Filmes & Séries', href: '/v1/productions' }, { label: 'Não Encontrado' }]} />
                <h1 className="text-4xl md:text-6xl font-black hallyu-gradient-text uppercase tracking-tighter italic mt-8">Produção não encontrada</h1>
            </div>
        )
    }

    const tags = production.tags || []

    return (
        <div className="min-h-screen">
            {/* Cinematic Hero */}
            <div className="relative h-[50vh] md:h-[60vh] bg-black overflow-hidden">
                {production.imageUrl ? (
                    <Image src={production.imageUrl} alt={production.titlePt} fill priority sizes="100vw" className="object-cover brightness-[0.45]" />
                ) : (
                    <>
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl" />
                    </>
                )}
                <div className="absolute inset-0 hero-gradient" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

                {/* Breadcrumbs */}
                <div className="absolute top-4 md:top-6 left-0 right-0 px-4 sm:px-12 md:px-20">
                    <Breadcrumbs items={[
                        { label: 'Filmes & Séries', href: '/v1/productions' },
                        { label: production.titlePt }
                    ]} />
                </div>

                {/* Hero content */}
                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-12 md:px-20 pb-10 md:pb-16">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        {production.year && <span className="text-purple-500 font-bold text-sm">{production.year}</span>}
                        <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                        <span className="uppercase tracking-widest text-[10px] font-black px-2 py-0.5 border border-zinc-700 rounded-sm text-zinc-400">{production.type}</span>
                        {production.streamingPlatforms && production.streamingPlatforms.map(p => (
                            <span key={p} className="text-xs font-bold text-white bg-zinc-800 px-3 py-0.5 rounded-sm border border-white/5">{p}</span>
                        ))}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tighter">{production.titlePt}</h1>
                    {production.titleKr && <p className="text-xl text-purple-500 font-bold mt-1">{production.titleKr}</p>}
                </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-12 md:px-20 py-16">
                <div className="grid md:grid-cols-3 gap-16">
                    {/* Main column */}
                    <div className="md:col-span-2 space-y-10">
                        {production.synopsis && (
                            <div>
                                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Sinopse</h3>
                                <p className="text-zinc-400 leading-relaxed font-medium text-lg">{production.synopsis}</p>
                            </div>
                        )}

                        {tags.length > 0 && (
                            <div>
                                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Tags</h3>
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
                                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-6">Elenco</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {production.artists.map(({ artist, role }) => (
                                        <Link key={artist.id} href={`/v1/artists/${artist.id}`} className="group">
                                            <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-zinc-900 border border-white/5 hover:border-purple-500/30 transition-colors">
                                                {artist.primaryImageUrl ? (
                                                    <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500 brightness-[0.7] group-hover:brightness-90" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-zinc-700 font-black text-sm">{artist.nameRomanized}</div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                                    <p className="text-sm font-black text-white">{artist.nameRomanized}</p>
                                                    {role && <p className="text-[10px] text-purple-500 font-bold">{role}</p>}
                                                </div>
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
                            {production.year && (
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Ano</span>
                                    <span className="text-sm font-bold text-zinc-300">{production.year}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-3 border-b border-white/5">
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Tipo</span>
                                <span className="text-sm font-bold text-zinc-300 uppercase">{production.type}</span>
                            </div>
                            {production.streamingPlatforms && (
                                <div className="flex justify-between py-3 border-b border-white/5 items-center">
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Streaming</span>
                                    <div className="flex flex-wrap gap-1.5 justify-end">
                                        {production.streamingPlatforms.map(p => (
                                            <span key={p} className="text-[10px] font-black text-white bg-zinc-800 px-2 py-0.5 rounded-sm border border-white/5">{p}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between py-3">
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Elenco</span>
                                <span className="text-sm font-bold text-zinc-300">{production.artists.length} artistas</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
