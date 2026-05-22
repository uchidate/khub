import { Suspense } from 'react'
import type { Metadata } from "next"
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import { PageTransition } from "@/components/features/PageTransition"
import { ProductionsList } from "@/components/features/ProductionsList"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { JsonLd } from "@/components/seo/JsonLd"
import prisma from "@/lib/prisma"
import { applyAgeRatingFilter } from "@/lib/utils/age-rating-filter"

export const revalidate = 600

import { SITE_URL } from '@/lib/constants/site'
const BASE_URL = SITE_URL

export async function generateMetadata(): Promise<Metadata> {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
        return { title: 'Doramas & Filmes Coreanos', description: 'Doramas e filmes coreanos para descobrir — de romances épicos a thrillers de tirar o fôlego, tudo em português.' }
    }
    const ageFilter = await applyAgeRatingFilter().catch(() => ({}))
    const total = await prisma.production.count({ where: { flaggedAsNonKorean: false, isHidden: false, ...ageFilter } }).catch(() => 0)
    const desc = `${total > 0 ? `${total} ` : ''}doramas e filmes coreanos para descobrir — de romances épicos a thrillers de tirar o fôlego, tudo em português.`
    return {
        title: 'Doramas & Filmes Coreanos',
        description: desc,
        keywords: 'dorama, dorama coreano, K-Drama, série coreana, filme coreano, K-Pop, Hallyu, assistir dorama, HallyuHub',
        alternates: { canonical: `${BASE_URL}/productions`, languages: { 'pt-BR': `${BASE_URL}/productions`, 'x-default': `${BASE_URL}/productions` } },
        openGraph: { title: 'Dramas & Filmes Coreanos | HallyuHub', description: desc, url: `${BASE_URL}/productions` },
    }
}

export default async function ProductionsPage() {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return <Suspense><ProductionsList /></Suspense>
    const ageFilter = await applyAgeRatingFilter().catch(() => ({}))
    const baseWhere = { flaggedAsNonKorean: false, isHidden: false, ...ageFilter }

    const [featuredProductions] = await Promise.all([
        prisma.production.findMany({
            where: { ...baseWhere, voteAverage: { gte: 7 }, voteCount: { not: null } },
            orderBy: [{ voteCount: 'desc' }, { voteAverage: 'desc' }],
            take: 3,
            select: {
                id: true, slug: true, titlePt: true, titleKr: true, type: true, year: true,
                imageUrl: true, voteAverage: true,
            },
        }).catch(() => []),
    ])

    return (
        <>
        <JsonLd data={{
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Doramas & Filmes Coreanos | HallyuHub",
            "description": "K-Dramas, doramas e filmes coreanos — perfis completos com elenco, sinopse e avaliações em português.",
            "url": `${BASE_URL}/productions`,
            "inLanguage": "pt-BR",
            "publisher": { "@type": "Organization", "name": "HallyuHub", "url": BASE_URL },
        }} />
        <PageTransition className="pb-16">
            <Suspense>
                <ProductionsList featuredProductions={featuredProductions} />
            </Suspense>
            <ScrollToTop />
        </PageTransition>
        </>
    )
}
