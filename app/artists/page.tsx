import { Suspense } from 'react'
import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { ArtistCardSkeleton } from "@/components/skeletons/ArtistCardSkeleton"
import { FavoriteButton } from "@/components/ui/FavoriteButton"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Artistas',
    description: 'Explore perfis detalhados de artistas de K-Pop e K-Drama, suas carreiras, obras e novidades.',
}

function SkeletonGrid() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-10">
            {Array.from({ length: 10 }).map((_, i) => (
                <ArtistCardSkeleton key={i} />
            ))}
        </div>
    )
}

async function ArtistsGrid() {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] --- RENDERING ARTISTS PAGE ---`)

    const artists = await prisma.artist.findMany({
        include: { agency: true },
        orderBy: { createdAt: 'desc' }
    })
    console.log(`[${timestamp}] ARTISTS FOUND: ${artists.length}`)

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-10">
            {artists.map((artist: any) => (
                <div key={artist.id} className="group cursor-pointer block relative">
                    <Link href={`/artists/${artist.id}`}>
                        <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-zinc-900 border border-white/5 card-hover shadow-2xl">
                            {artist.primaryImageUrl ? (
                                <Image
                                    src={artist.primaryImageUrl}
                                    alt={artist.nameRomanized}
                                    fill
                                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                                    className="object-cover group-hover:scale-110 transition-transform duration-700 brightness-[0.8] group-hover:brightness-100"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-zinc-700 italic font-black uppercase tracking-tighter text-2xl">No Image</div>
                            )}

                            {/* Overlay with info */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                                <h3 className="text-2xl font-black text-white leading-tight mb-1">{artist.nameRomanized}</h3>
                                <p className="text-sm text-purple-500 font-bold mb-3">{artist.nameHangul}</p>
                                <div className="flex flex-wrap gap-2">
                                    {artist.roles?.map((role: string) => (
                                        <span key={role} className="text-xs uppercase font-black px-2 py-0.5 bg-white text-black rounded-sm">
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 group-hover:opacity-0 transition-opacity">
                            <h4 className="font-bold text-lg">{artist.nameRomanized}</h4>
                            <p className="text-xs text-zinc-500 font-medium">{artist.agency?.name || 'Independente'}</p>
                        </div>
                    </Link>

                    {/* Favorite Button */}
                    <div className="absolute top-2 right-2 z-10">
                        <FavoriteButton
                            id={artist.id}
                            itemName={artist.nameRomanized}
                            itemType="artista"
                            className="bg-black/50 backdrop-blur-sm hover:bg-black/70"
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default async function ArtistsPage() {
    const timestamp = new Date().toISOString();

    return (
        <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <header className="mb-12">
                <h1 className="text-4xl md:text-6xl font-black mb-4 hallyu-gradient-text uppercase tracking-tighter italic">Artistas</h1>
                <p className="text-zinc-500 max-w-xl text-lg font-medium mb-2">Os ícones, as vozes e o talento. Explore perfis detalhados das estrelas que definem a cultura coreana.</p>
                <p className="text-xs text-zinc-400 font-mono">Last updated: {timestamp}</p>
            </header>

            <Suspense fallback={<SkeletonGrid />}>
                <ArtistsGrid />
            </Suspense>
        </div>
    )
}
