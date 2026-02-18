import { Suspense } from 'react'
import type { Metadata } from "next"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { PageTransition } from "@/components/features/PageTransition"
import { ProductionsList } from "@/components/features/ProductionsList"
import { ScrollToTop } from "@/components/ui/ScrollToTop"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Filmes & Séries',
    description: 'De romances épicos a thrillers de tirar o fôlego. O melhor do entretenimento coreano.',
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
