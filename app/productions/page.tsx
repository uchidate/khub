import { Suspense } from 'react'
import type { Metadata } from "next"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { PageTransition } from "@/components/features/PageTransition"
import { ProductionsList } from "@/components/features/ProductionsList"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { JsonLd } from "@/components/seo/JsonLd"
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic'

import { SITE_URL } from '@/lib/constants/site'
const BASE_URL = SITE_URL

export async function generateMetadata(): Promise<Metadata> {
    const total = await prisma.production.count({ where: { flaggedAsNonKorean: false } }).catch(() => 0)
    const desc = `${total > 0 ? `${total} ` : ''}produções coreanas. De romances épicos a thrillers de tirar o fôlego.`
    return {
        title: 'Produções',
        description: desc,
        alternates: { canonical: `${BASE_URL}/productions` },
        openGraph: {
            title: 'Produções Coreanas | HallyuHub',
            description: desc,
            url: `${BASE_URL}/productions`,
        },
    }
}

export default async function ProductionsPage() {
    const total = await prisma.production.count({ where: { flaggedAsNonKorean: false } }).catch(() => null)

    return (
        <>
        <JsonLd data={{
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Produções Coreanas | HallyuHub",
            "description": "Produções coreanas: K-Dramas, filmes e séries. De romances épicos a thrillers de tirar o fôlego.",
            "url": `${BASE_URL}/productions`,
            "inLanguage": "pt-BR",
            "publisher": { "@type": "Organization", "name": "HallyuHub", "url": BASE_URL },
        }} />
        <PageTransition className="py-8 md:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <SectionHeader
                title="Produções"
                count={total}
                countLabel="produções"
                backHref="/"
            />


            <Suspense>
                <ProductionsList />
            </Suspense>
            <ScrollToTop />
            </div>
        </PageTransition>
        </>
    )
}
