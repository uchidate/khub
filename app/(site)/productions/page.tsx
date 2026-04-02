import { Suspense } from 'react'
import type { Metadata } from "next"
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PageTransition } from "@/components/features/PageTransition"
import { ProductionsList } from "@/components/features/ProductionsList"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { JsonLd } from "@/components/seo/JsonLd"
import prisma from "@/lib/prisma"
import { applyAgeRatingFilter } from "@/lib/utils/age-rating-filter"

export const dynamic = 'force-dynamic'

import { SITE_URL } from '@/lib/constants/site'
const BASE_URL = SITE_URL

export async function generateMetadata(): Promise<Metadata> {
    const ageFilter = await applyAgeRatingFilter().catch(() => ({}))
    const total = await prisma.production.count({ where: { flaggedAsNonKorean: false, isHidden: false, ...ageFilter } }).catch(() => 0)
    const desc = `${total > 0 ? `${total} ` : ''}dramas e filmes coreanos para descobrir — de romances épicos a thrillers de tirar o fôlego, todos em português.`
    return {
        title: 'Dramas & Filmes Coreanos',
        description: desc,
        alternates: { canonical: `${BASE_URL}/productions` },
        openGraph: {
            title: 'Dramas & Filmes Coreanos | HallyuHub',
            description: desc,
            url: `${BASE_URL}/productions`,
        },
    }
}

export default async function ProductionsPage() {
    const ageFilter = await applyAgeRatingFilter().catch(() => ({}))
  await prisma.production.count({ where: { flaggedAsNonKorean: false, isHidden: false, ...ageFilter } }).catch(() => null)

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

                {/* Hero header */}
                <div className="relative mb-6 overflow-hidden rounded-3xl border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(248,250,252,0.55)_100%)] dark:bg-[linear-gradient(180deg,rgba(23,23,23,0.62)_0%,rgba(14,14,14,0.46)_100%)] px-5 py-6 sm:px-7 md:py-7 shadow-[0_14px_34px_rgba(0,0,0,0.08)]">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.14),transparent_46%),radial-gradient(circle_at_88%_88%,rgba(148,163,184,0.08),transparent_42%)]" />
                  <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background:linear-gradient(120deg,transparent_0%,#fff_35%,transparent_70%)]" />
                  <div className="relative">
                    <h1 className="text-[1.9rem] sm:text-[2.1rem] md:text-[2.45rem] font-black text-foreground tracking-[-0.04em] leading-[0.96] mb-2 animate-[fadeIn_450ms_ease-out]">
                      Dramas & Filmes
                    </h1>

                    <div className="mt-3 flex items-center gap-2 flex-wrap animate-[fadeIn_750ms_ease-out]">
                      <Link href="#productions-list" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity">
                        Explorar catálogo
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>

            <Suspense>
                <ProductionsList />
            </Suspense>
            <ScrollToTop />
            </div>
        </PageTransition>
        </>
    )
}
