import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
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
        return { title: 'Artistas', description: 'Explore perfis de artistas de K-Pop e K-Drama, suas carreiras, obras e novidades.' }
    }
    const total = await prisma.artist.count({ where: { flaggedAsNonKorean: false, isHidden: false } }).catch(() => 0)
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
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-baseline gap-3">
                        <h1 className="text-[1.75rem] md:text-[2rem] font-black text-foreground tracking-[-0.04em] leading-none">
                            Artistas
                        </h1>
                        {total !== null && (
                            <span className="text-[11px] font-bold text-muted px-2.5 py-1 bg-surface border border-border rounded-full">
                                {total.toLocaleString('pt-BR')} perfis
                            </span>
                        )}
                    </div>
                    <Link href="/" className="text-[11px] font-semibold text-muted hover:text-[#ff2d78] transition-colors">
                        ← Início
                    </Link>
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
