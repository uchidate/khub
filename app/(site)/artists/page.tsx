import type { Metadata } from "next"
import { Suspense } from "react"
import { Users } from 'lucide-react'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import { PageTransition } from "@/components/features/PageTransition"
import { ArtistsList } from "@/components/features/ArtistsList"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { JsonLd } from "@/components/seo/JsonLd"
import prisma from "@/lib/prisma"

export const revalidate = 3600

import { SITE_URL } from '@/lib/constants/site'
const BASE_URL = SITE_URL

export async function generateMetadata(): Promise<Metadata> {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
        return { title: 'Artistas K-Pop & K-Drama', description: 'Perfis completos de cantores, atores e artistas coreanos — discografia, filmes, grupos e redes sociais, tudo em português.' }
    }
    const total = await prisma.artist.count({ where: { flaggedAsNonKorean: false, isHidden: false } }).catch(() => 0)
    const desc = `${total > 0 ? `${total} ` : ''}perfis de artistas K-Pop e K-Drama com discografia, filmografia, grupos e redes sociais — tudo em português.`
    return {
        title: 'Artistas K-Pop & K-Drama',
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
    const total = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD
        ? null
        : await prisma.artist.count({ where: { flaggedAsNonKorean: false, isHidden: false } }).catch(() => null)

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
        <PageTransition className="py-8 md:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">

                {/* Header */}
                <div className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-surface px-6 py-8 md:py-10">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#ff2d78]/5 via-transparent to-transparent" />
                  <div className="pointer-events-none absolute -bottom-10 -right-10 w-60 h-60 rounded-full bg-[#ff2d78]/5 blur-3xl" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="flex items-center justify-center p-1.5 rounded-lg bg-[#ff2d78]/10">
                        <Users size={15} className="text-[#ff2d78]" />
                      </span>
                      {total !== null && (
                        <span className="text-[11px] font-bold text-muted px-2.5 py-1 bg-background border border-border rounded-full">
                          {total.toLocaleString('pt-BR')} perfis
                        </span>
                      )}
                    </div>
                    <h1 className="text-[2rem] md:text-[2.5rem] font-black text-foreground tracking-[-0.04em] leading-none mb-2">
                      Artistas
                    </h1>
                    <p className="text-sm text-muted max-w-lg leading-relaxed">
                      Cantores, atores, modelos e grupos do universo K-Pop e K-Drama — perfis completos em português.
                    </p>
                  </div>
                </div>

                <Suspense>
                    <ArtistsList />
                </Suspense>
                <ScrollToTop />
            </div>
        </PageTransition>
        </>
    )
}
