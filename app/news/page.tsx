import { Suspense } from 'react'
import prisma from "@/lib/prisma"
import type { Metadata } from "next"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { PageTransition } from "@/components/features/PageTransition"
import { NewsList } from "@/components/features/NewsList"
import { ScrollToTop } from "@/components/ui/ScrollToTop"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Notícias',
    description: 'Fique por dentro de tudo o que acontece no vibrante mundo do entretenimento coreano.',
}

function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl overflow-hidden bg-zinc-800/60">
                    <div className="aspect-video" />
                    <div className="p-4 space-y-3">
                        <div className="h-4 bg-zinc-700/60 rounded w-3/4" />
                        <div className="h-3 bg-zinc-700/40 rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    )
}

async function NewsContent() {
    // Buscar artistas com notícias para popular o filtro
    const artists = await prisma.artist.findMany({
        where: {
            news: {
                some: {}
            }
        },
        select: {
            id: true,
            nameRomanized: true,
        },
        orderBy: {
            nameRomanized: 'asc'
        }
    })

    return <NewsList initialArtists={artists} />
}

export default async function NewsPage() {
    return (
        <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <SectionHeader
                title="Notícias"
                subtitle="Fique por dentro de tudo o que acontece no vibrante mundo do entretenimento coreano."
            />

            <Suspense fallback={<LoadingSkeleton />}>
                <NewsContent />
            </Suspense>
            <ScrollToTop />
        </PageTransition>
    )
}
