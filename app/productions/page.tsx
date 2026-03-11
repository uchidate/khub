import { Suspense } from 'react'
import type { Metadata } from "next"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { PageTransition } from "@/components/features/PageTransition"
import { ProductionsList } from "@/components/features/ProductionsList"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { JsonLd } from "@/components/seo/JsonLd"
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://www.hallyuhub.com.br'

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
        <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <SectionHeader
                title="Produções"
                backHref="/"
            />

            <Suspense>
                <ProductionsList />
            </Suspense>
            <ScrollToTop />
        </PageTransition>
        </>
    )
}
