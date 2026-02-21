import { Suspense } from 'react'
import prisma from "@/lib/prisma"
import type { Metadata } from "next"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { PageTransition } from "@/components/features/PageTransition"
import { NewsList } from "@/components/features/NewsList"
import { ScrollToTop } from "@/components/ui/ScrollToTop"

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://www.hallyuhub.com.br'

export async function generateMetadata(): Promise<Metadata> {
    const total = await prisma.news.count().catch(() => 0)
    const desc = `${total > 0 ? `${total} ` : ''}notícias sobre K-Pop, K-Drama e cultura coreana. Fique por dentro de tudo.`
    return {
        title: 'Notícias',
        description: desc,
        alternates: { canonical: `${BASE_URL}/news` },
        openGraph: {
            title: 'Notícias K-Pop & K-Drama | HallyuHub',
            description: desc,
            url: `${BASE_URL}/news`,
        },
    }
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
    // Buscar artistas e grupos com notícias para popular os filtros
    const [artists, groups] = await Promise.all([
        prisma.artist.findMany({
            where: { flaggedAsNonKorean: false, news: { some: {} } },
            select: { id: true, nameRomanized: true },
            orderBy: { nameRomanized: 'asc' },
        }),
        prisma.musicalGroup.findMany({
            where: {
                members: {
                    some: {
                        artist: { news: { some: {} } },
                    },
                },
            },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        }),
    ])

    return <NewsList initialArtists={artists} initialGroups={groups} />
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
