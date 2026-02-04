import { Suspense } from 'react'
import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { FavoriteButton } from "@/components/ui/FavoriteButton"

export const dynamic = 'force-dynamic'

function SkeletonProduction() {
    return (
        <div className="animate-pulse bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 flex flex-col md:flex-row h-auto md:h-64 lg:h-80">
            <div className="w-full md:w-1/3 aspect-video md:aspect-auto bg-zinc-800" />
            <div className="flex-1 p-8 md:p-10 flex flex-col">
                <div className="h-8 bg-zinc-800 rounded w-3/4 mb-4" />
                <div className="h-4 bg-zinc-800 rounded w-1/4 mb-6" />
                <div className="space-y-2 mb-6 flex-grow">
                    <div className="h-3 bg-zinc-800 rounded" />
                    <div className="h-3 bg-zinc-800 rounded" />
                    <div className="h-3 bg-zinc-800 rounded w-5/6" />
                </div>
                <div className="flex gap-2 mt-auto">
                    <div className="h-6 bg-zinc-800 rounded w-20" />
                    <div className="h-6 bg-zinc-800 rounded w-20" />
                </div>
            </div>
        </div>
    )
}

function SkeletonGrid() {
    return (
        <div className="space-y-12">
            {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonProduction key={i} />
            ))}
        </div>
    )
}

async function ProductionsGrid() {
    console.log('--- RENDERING PRODUCTIONS PAGE ---')
    const productions = await prisma.production.findMany({
        include: {
            artists: {
                include: { artist: true }
            }
        }
    })

    return (
        <div className="space-y-12">
            {productions.map((prod: any) => (
                <div key={prod.id} className="group relative">
                    <Link href={`/v1/productions/${prod.id}`} className="relative bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 flex flex-col md:flex-row h-auto md:h-64 lg:h-80 card-hover shadow-2xl block">
                        {/* Poster / Backdrop */}
                        <div className="w-full md:w-1/3 aspect-video md:aspect-auto bg-zinc-900 relative overflow-hidden">
                            {prod.imageUrl ? (
                                <Image
                                    src={prod.imageUrl}
                                    alt={prod.titlePt}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    className="object-cover brightness-[0.6] group-hover:brightness-[0.8] transition-all duration-500"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            <div className="absolute inset-0 flex items-end p-6">
                                <h2 className="text-2xl font-black uppercase tracking-tighter leading-tight text-white group-hover:text-purple-400 transition-colors">
                                    {prod.titlePt}
                                </h2>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black hidden md:block" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-8 md:p-10 flex flex-col relative z-20">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-3xl font-black text-white mb-1 group-hover:text-purple-500 transition-colors">{prod.titlePt}</h3>
                                    <div className="flex gap-4 items-center text-zinc-500 text-sm font-bold">
                                        <span className="text-purple-500">{prod.year}</span>
                                        <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                                        <span className="uppercase tracking-widest text-xs px-2 py-0.5 border border-zinc-700 rounded-sm">{prod.type}</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-zinc-400 leading-relaxed mb-6 line-clamp-3 font-medium flex-grow">
                                {prod.synopsis}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-8 mt-auto">
                                <div>
                                    <h4 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-3">Disponível em</h4>
                                    <div className="flex gap-3">
                                        {prod.streamingPlatforms?.map((p: string) => (
                                            <span key={p} className="text-xs font-bold text-white bg-zinc-800 px-3 py-1 rounded-sm border border-white/5">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {prod.artists.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-3">Com a participação de</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {prod.artists.slice(0, 4).map((conn: any) => (
                                                <Link
                                                    key={conn.artistId}
                                                    href={`/v1/artists/${conn.artistId}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-xs font-bold text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                                                >
                                                    {conn.artist.nameRomanized}
                                                </Link>
                                            ))}
                                            {prod.artists.length > 4 && (
                                                <span className="text-xs font-bold text-zinc-500">
                                                    +{prod.artists.length - 4}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>

                    {/* Favorite Button */}
                    <div className="absolute top-4 right-4 z-30">
                        <FavoriteButton
                            id={prod.id}
                            itemName={prod.titlePt}
                            itemType="produção"
                            className="bg-black/50 backdrop-blur-sm hover:bg-black/70"
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default async function ProductionsPage() {
    return (
        <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <header className="mb-12">
                <h1 className="text-4xl md:text-6xl font-black mb-4 hallyu-gradient-text uppercase tracking-tighter italic">Filmes & Séries</h1>
                <p className="text-zinc-500 max-w-xl text-lg font-medium">De romances épicos a thrillers de tirar o fôlego. O melhor do entretenimento coreano selecionado para você.</p>
            </header>

            <Suspense fallback={<SkeletonGrid />}>
                <ProductionsGrid />
            </Suspense>
        </div>
    )
}
