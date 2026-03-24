import { Suspense } from 'react'
import prisma from "@/lib/prisma"
import type { Metadata } from "next"
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import { SectionHeader } from "@/components/ui/SectionHeader"
import { PageTransition } from "@/components/features/PageTransition"
import { NewsList } from "@/components/features/NewsList"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { JsonLd } from "@/components/seo/JsonLd"

export const dynamic = 'force-dynamic'

import { SITE_URL } from '@/lib/constants/site'
const BASE_URL = SITE_URL

export async function generateMetadata(): Promise<Metadata> {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
        return { title: 'Notícias', description: 'Notícias sobre K-Pop, K-Drama e cultura coreana. Fique por dentro de tudo.' }
    }
    const total = await prisma.news.count({ where: { status: 'published', isHidden: false } }).catch(() => 0)
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
                <div key={i} className="animate-pulse rounded-xl overflow-hidden bg-[#1a1a1a]/60">
                    <div className="aspect-video" />
                    <div className="p-4 space-y-3">
                        <div className="h-4 bg-[#2a2a2a]/60 rounded w-3/4" />
                        <div className="h-3 bg-[#2a2a2a]/40 rounded w-1/2" />
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
    const total = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD
        ? null
        : await prisma.news.count({ where: { status: 'published', isHidden: false } }).catch(() => null)

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
        <PageTransition className="py-8 md:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <SectionHeader
                title="Notícias"
                count={total}
                countLabel="notícias"
                backHref="/"
            />


            <Suspense fallback={<LoadingSkeleton />}>
                <NewsContent />
            </Suspense>
            <ScrollToTop />
            </div>
        </PageTransition>
        </>
    )
}
