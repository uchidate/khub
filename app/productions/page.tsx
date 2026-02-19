import { Suspense } from 'react'
import type { Metadata } from "next"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { PageTransition } from "@/components/features/PageTransition"
import { ProductionsList } from "@/components/features/ProductionsList"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://www.hallyuhub.com.br'

export async function generateMetadata(): Promise<Metadata> {
    const total = await prisma.production.count().catch(() => 0)
    const desc = `${total > 0 ? `${total} ` : ''}filmes e séries coreanas. De romances épicos a thrillers de tirar o fôlego.`
    return {
        title: 'Filmes & Séries',
        description: desc,
        alternates: { canonical: `${BASE_URL}/productions` },
        openGraph: {
            title: 'Filmes & Séries Coreanas | HallyuHub',
            description: desc,
            url: `${BASE_URL}/productions`,
        },
    }
}

export default async function ProductionsPage() {
    return (
        <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <SectionHeader
                title="Filmes & Séries"
                subtitle="De romances épicos a thrillers de tirar o fôlego. O melhor do entretenimento coreano selecionado para você."
            />

            <Suspense>
                <ProductionsList />
            </Suspense>
            <ScrollToTop />
        </PageTransition>
    )
}
