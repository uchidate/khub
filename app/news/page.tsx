import { Suspense } from 'react'
import prisma from "@/lib/prisma"
import type { Metadata } from "next"
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import { SectionHeader } from "@/components/ui/SectionHeader"
import { PageTransition } from "@/components/features/PageTransition"
import { NewsList } from "@/components/features/NewsList"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { JsonLd } from "@/components/seo/JsonLd"

export const revalidate = 3600

const BASE_URL = 'https://www.hallyuhub.com.br'

export async function generateMetadata(): Promise<Metadata> {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
        return { title: 'Notícias', description: 'Notícias sobre K-Pop, K-Drama e cultura coreana. Fique por dentro de tudo.' }
    }
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
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
        return <NewsList initialArtists={[]} initialGroups={[]} />
    }
    // Buscar artistas e grupos com notícias para popular os filtros
    const [artists, groups] = await Promise.all([
        prisma.artist.findMany({
            where: { flaggedAsNonKorean: false, news: { some: {} } },
            select: { id: true, nameRomanized: true },
            orderBy: { nameRomanized: 'asc' },
        }).catch(() => []),
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
        }).catch(() => []),
    ])

    return <NewsList initialArtists={artists} initialGroups={groups} />
}

export default async function NewsPage() {
    return (
        <>
        <JsonLd data={{
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Notícias K-Pop & K-Drama | HallyuHub",
            "description": "Notícias sobre K-Pop, K-Drama e cultura coreana. Fique por dentro de tudo.",
            "url": `${BASE_URL}/news`,
            "inLanguage": "pt-BR",
            "publisher": { "@type": "Organization", "name": "HallyuHub", "url": BASE_URL },
        }} />
        <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <SectionHeader
                title="Notícias"
                backHref="/"
            />

            <p className="text-sm text-zinc-500 leading-relaxed max-w-2xl mb-8">
                As últimas notícias do K-pop, K-drama e entretenimento coreano, traduzidas e contextualizadas para o público brasileiro. Acompanhe comebacks, lançamentos, premiações e muito mais com a perspectiva do HallyuHub.
            </p>

            <Suspense fallback={<LoadingSkeleton />}>
                <NewsContent />
            </Suspense>
            <ScrollToTop />
        </PageTransition>
        </>
    )
}
