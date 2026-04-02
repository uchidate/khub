import { Suspense } from "react"
import type { Metadata } from "next"
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import { Music2 } from 'lucide-react'
import { PageTransition } from "@/components/features/PageTransition"
import { GroupsList } from "@/components/features/GroupsList"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { JsonLd } from "@/components/seo/JsonLd"
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const revalidate = 3600

import { SITE_URL } from '@/lib/constants/site'
const BASE_URL = SITE_URL

export async function generateMetadata(): Promise<Metadata> {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
        return { title: 'Grupos K-Pop', description: 'BTS, BLACKPINK, TWICE e muito mais — perfis completos de grupos K-Pop com formação, discografia e trajetória na indústria coreana.' }
    }
    const total = await prisma.musicalGroup.count({ where: { isHidden: false } }).catch(() => 0)
    const desc = `${total > 0 ? `${total} ` : ''}grupos K-Pop com perfis completos — formação, discografia, fandom e trajetória na indústria coreana, em português.`
    return {
        title: 'Grupos K-Pop',
        description: desc,
        alternates: { canonical: `${BASE_URL}/groups` },
        openGraph: {
            title: 'Grupos K-Pop | HallyuHub',
            description: desc,
            url: `${BASE_URL}/groups`,
        },
    }
}

export default async function GroupsPage() {
    const total = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD
        ? null
        : await prisma.musicalGroup.count({ where: { isHidden: false } }).catch(() => null)

    return (
        <>
        <JsonLd data={{
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Grupos K-Pop | HallyuHub",
            "description": "Explore grupos de K-Pop, suas gerações, formações e trajetórias na indústria coreana.",
            "url": `${BASE_URL}/groups`,
            "inLanguage": "pt-BR",
            "publisher": { "@type": "Organization", "name": "HallyuHub", "url": BASE_URL },
        }} />
        <PageTransition className="py-8 md:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">

                {/* Hero header */}
                <div className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-surface px-6 py-8 md:py-10">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent" />
                  <div className="pointer-events-none absolute -bottom-10 -right-10 w-60 h-60 rounded-full bg-accent/5 blur-3xl" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="flex items-center justify-center p-1.5 rounded-lg bg-accent/10">
                        <Music2 size={15} className="text-accent" />
                      </span>
                      {total !== null && (
                        <span className="text-[11px] font-bold text-muted px-2.5 py-1 bg-background border border-border rounded-full">
                          {total.toLocaleString('pt-BR')} grupos
                        </span>
                      )}
                    </div>
                    <h1 className="text-[2rem] md:text-[2.5rem] font-black text-foreground tracking-[-0.04em] leading-none mb-2">
                      Grupos
                    </h1>
                    <p className="text-sm text-muted max-w-lg leading-relaxed">
                      BTS, BLACKPINK, TWICE e muito mais — perfis completos com formação, discografia e trajetória na indústria coreana.
                    </p>
                  </div>
                </div>

                <Suspense>
                <GroupsList />
            </Suspense>
            <ScrollToTop />
            </div>
        </PageTransition>
        </>
    )
}
