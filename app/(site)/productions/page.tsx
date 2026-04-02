import { Suspense } from 'react'
import type { Metadata } from "next"
import Link from 'next/link'
import { ArrowRight, Clapperboard } from 'lucide-react'
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
    const total = await prisma.production.count({ where: { flaggedAsNonKorean: false, isHidden: false, ...ageFilter } }).catch(() => null)

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
                <div className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-surface px-6 py-8 md:py-10">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-cyan-500/10" />
                  <div className="pointer-events-none absolute -bottom-10 -right-10 w-60 h-60 rounded-full bg-rose-500/10 blur-3xl" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className="flex items-center justify-center p-1.5 rounded-lg bg-rose-500/15">
                        <Clapperboard size={15} className="text-rose-500" />
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                        Catálogo de produções coreanas
                      </span>
                      {total !== null && (
                        <span className="text-[11px] font-bold text-muted px-2.5 py-1 bg-background border border-border rounded-full">
                          {total.toLocaleString('pt-BR')} títulos
                        </span>
                      )}
                    </div>

                    <h1 className="text-[2rem] md:text-[2.5rem] font-black text-foreground tracking-[-0.04em] leading-none mb-3">
                      Dramas & Filmes
                    </h1>

                    <p className="text-sm text-muted max-w-2xl leading-relaxed">
                      Explore títulos em português com filtros por tipo, classificação etária, avaliação e ano.
                    </p>

                    <div className="mt-5 flex items-center gap-2 flex-wrap">
                      <Link href="#productions-list" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-accent text-white hover:opacity-90 transition-opacity">
                        Explorar catálogo
                        <ArrowRight size={13} />
                      </Link>
                      <Link href="/productions?sortBy=rating" className="text-xs font-semibold px-3 py-1.5 rounded-full bg-background border border-border text-muted hover:text-foreground hover:border-foreground/20 transition-colors">
                        Top avaliadas
                      </Link>
                      <Link href="/productions?type=MOVIE" className="text-xs font-semibold px-3 py-1.5 rounded-full bg-background border border-border text-muted hover:text-foreground hover:border-foreground/20 transition-colors">
                        Filmes
                      </Link>
                      <Link href="/productions?type=SERIES" className="text-xs font-semibold px-3 py-1.5 rounded-full bg-background border border-border text-muted hover:text-foreground hover:border-foreground/20 transition-colors">
                        Séries
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
