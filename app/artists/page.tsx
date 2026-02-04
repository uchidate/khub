import { Suspense } from 'react'
import prisma from "@/lib/prisma"
import type { Metadata } from "next"
import { ArtistCardSkeleton } from "@/components/skeletons/ArtistCardSkeleton"
import { MediaCard } from "@/components/ui/MediaCard"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { PageTransition } from "@/components/features/PageTransition"

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
    const artists = await prisma.artist.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
    })

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-10 perspective-1000">
            {artists.map((artist: any) => (
                <MediaCard
                    key={artist.id}
                    id={artist.id}
                    title={artist.nameRomanized}
                    subtitle={artist.nameHangul || undefined}
                    imageUrl={artist.primaryImageUrl}
                    type="artist"
                    href={`/artists/${artist.id}`}
                    badges={artist.roles || []}
                    aspectRatio="poster"
                />
            ))}
        </div>
    )
}

export default async function ArtistsPage() {
    return (
        <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <SectionHeader
                title="Artistas"
                subtitle="Os ícones, as vozes e o talento. Explore perfis detalhados das estrelas que definem a cultura coreana."
            />

            <Suspense fallback={<SkeletonGrid />}>
                <ArtistsGrid />
            </Suspense>
        </PageTransition>
    )
}
