import type { Metadata } from "next"
import { Suspense } from "react"
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import { SectionHeader } from "@/components/ui/SectionHeader"
import { PageTransition } from "@/components/features/PageTransition"
import { ArtistsList } from "@/components/features/ArtistsList"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { JsonLd } from "@/components/seo/JsonLd"
import prisma from "@/lib/prisma"

export const revalidate = 3600

const BASE_URL = 'https://www.hallyuhub.com.br'

export async function generateMetadata(): Promise<Metadata> {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
        return { title: 'Artistas', description: 'Explore perfis de artistas de K-Pop e K-Drama, suas carreiras, obras e novidades.' }
    }
    const total = await prisma.artist.count({ where: { flaggedAsNonKorean: false } }).catch(() => 0)
    const desc = `Explore ${total > 0 ? `${total} ` : ''}perfis de artistas de K-Pop e K-Drama, suas carreiras, obras e novidades.`
    return {
        title: 'Artistas',
        description: desc,
        alternates: { canonical: `${BASE_URL}/artists` },
        openGraph: {
            title: 'Artistas K-Pop & K-Drama | HallyuHub',
            description: desc,
            url: `${BASE_URL}/artists`,
        },
    }
}

export default async function ArtistsPage() {
    return (
        <>
        <JsonLd data={{
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Artistas K-Pop & K-Drama | HallyuHub",
            "description": "Explore perfis de artistas de K-Pop e K-Drama, suas carreiras, obras e novidades.",
            "url": `${BASE_URL}/artists`,
            "inLanguage": "pt-BR",
            "publisher": { "@type": "Organization", "name": "HallyuHub", "url": BASE_URL },
        }} />
        <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <SectionHeader
                title="Artistas"
            />

            <Suspense>
                <ArtistsList />
            </Suspense>
            <ScrollToTop />
        </PageTransition>
        </>
    )
}
