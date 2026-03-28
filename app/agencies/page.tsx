import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import { PageTransition } from "@/components/features/PageTransition"
import { AgenciesList } from "@/components/features/AgenciesList"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { JsonLd } from "@/components/seo/JsonLd"
import prisma from "@/lib/prisma"
import { SITE_URL } from "@/lib/constants/site"

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
        return {
            title: 'Agências K-pop',
            description: 'Conheça as principais empresas de entretenimento coreano: HYBE, SM Entertainment, JYP, YG e mais.',
        }
    }
    const total = await prisma.agency.count().catch(() => 0)
    return {
        title: 'Agências K-pop',
        description: `${total > 0 ? `${total} ` : ''}empresas de entretenimento coreano — HYBE, SM, JYP, YG e muito mais.`,
        keywords: 'agências k-pop, HYBE, SM Entertainment, JYP Entertainment, YG Entertainment, empresas k-pop, entretenimento coreano',
        alternates: { canonical: `${SITE_URL}/agencies` },
        openGraph: {
            title: 'Agências K-pop | HallyuHub',
            description: 'Conheça as principais empresas de entretenimento coreano: HYBE, SM Entertainment, JYP, YG e mais.',
            url: `${SITE_URL}/agencies`,
            type: 'website',
        },
    }
}

export default async function AgenciesPage() {
    const total = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD
        ? null
        : await prisma.agency.count().catch(() => null)

    return (
        <>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: 'Agências K-pop | HallyuHub',
                description: 'Explore as principais empresas de entretenimento coreano.',
                url: `${SITE_URL}/agencies`,
                inLanguage: 'pt-BR',
                publisher: { '@type': 'Organization', name: 'HallyuHub', url: SITE_URL },
            }} />

            <PageTransition className="py-8 md:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-baseline gap-3">
                            <h1 className="text-[1.75rem] md:text-[2rem] font-black text-foreground tracking-[-0.04em] leading-none">
                                Agências
                            </h1>
                            {total !== null && (
                                <span className="text-[11px] font-bold text-muted px-2.5 py-1 bg-surface border border-border rounded-full">
                                    {total.toLocaleString('pt-BR')} cadastradas
                                </span>
                            )}
                        </div>
                        <Link href="/" className="text-[11px] font-semibold text-muted hover:text-foreground transition-colors">
                            ← Início
                        </Link>
                    </div>

                    <Suspense>
                        <AgenciesList />
                    </Suspense>
                    <ScrollToTop />
                </div>
            </PageTransition>
        </>
    )
}
