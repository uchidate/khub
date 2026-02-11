import { Suspense } from 'react'
import prisma from "@/lib/prisma"
import type { Metadata } from "next"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { PageTransition } from "@/components/features/PageTransition"
import { NewsList } from "@/components/features/NewsList"
import { Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Notícias',
    description: 'Fique por dentro de tudo o que acontece no vibrante mundo do entretenimento coreano.',
}

function LoadingSkeleton() {
    return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
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
        </PageTransition>
    )
}
