import { Suspense } from 'react'
import prisma from "@/lib/prisma"
import type { Metadata } from "next"
import { MediaCard } from "@/components/ui/MediaCard"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { PageTransition } from "@/components/features/PageTransition"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Filmes & Séries',
    description: 'De romances épicos a thrillers de tirar o fôlego. O melhor do entretenimento coreano.',
}

function SkeletonGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-video bg-zinc-900 rounded-xl animate-pulse border border-white/5" />
            ))}
        </div>
    )
}

async function ProductionsGrid() {
    const productions = await prisma.production.findMany({
        orderBy: { year: 'desc' },
        take: 50,
        select: {
            id: true,
            titlePt: true,
            type: true,
            year: true,
            imageUrl: true,
            backdropUrl: true,
            voteAverage: true,
            streamingPlatforms: true,
        }
    })

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 perspective-1000">
            {productions.map((prod) => (
                <MediaCard
                    key={prod.id}
                    id={prod.id}
                    title={prod.titlePt}
                    subtitle={`${prod.year} • ${prod.type?.toUpperCase()}`}
                    imageUrl={prod.backdropUrl || prod.imageUrl}
                    type="production"
                    href={`/productions/${prod.id}`}
                    badges={prod.streamingPlatforms as string[] || []}
                    aspectRatio="video"
                />
            ))}
        </div>
    )
}

export default async function ProductionsPage() {
    return (
        <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <SectionHeader
                title="Filmes & Séries"
                subtitle="De romances épicos a thrillers de tirar o fôlego. O melhor do entretenimento coreano selecionado para você."
            />

            <Suspense fallback={<SkeletonGrid />}>
                <ProductionsGrid />
            </Suspense>
        </PageTransition>
    )
}
