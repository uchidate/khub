import { Suspense } from 'react'
import type { Metadata } from "next"
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import { PageTransition } from "@/components/features/PageTransition"
import { ProductionsList } from "@/components/features/ProductionsList"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { JsonLd } from "@/components/seo/JsonLd"
import prisma from "@/lib/prisma"
import { applyAgeRatingFilter } from "@/lib/utils/age-rating-filter"

export const revalidate = 600

import { SITE_URL } from '@/lib/constants/site'
const BASE_URL = SITE_URL

export async function generateMetadata(): Promise<Metadata> {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
        return { title: 'Doramas & Filmes Coreanos', description: 'Doramas e filmes coreanos para descobrir — de romances épicos a thrillers de tirar o fôlego, tudo em português.' }
    }
    const ageFilter = await applyAgeRatingFilter().catch(() => ({}))
    const total = await prisma.production.count({ where: { flaggedAsNonKorean: false, isHidden: false, ...ageFilter } }).catch(() => 0)
    const desc = `${total > 0 ? `${total} ` : ''}doramas e filmes coreanos para descobrir — de romances épicos a thrillers de tirar o fôlego, tudo em português.`
    return {
        title: 'Doramas & Filmes Coreanos',
        description: desc,
        keywords: 'dorama, dorama coreano, K-Drama, série coreana, filme coreano, K-Pop, Hallyu, assistir dorama, HallyuHub',
        alternates: { canonical: `${BASE_URL}/productions`, languages: { 'pt-BR': `${BASE_URL}/productions`, 'x-default': `${BASE_URL}/productions` } },
        openGraph: { title: 'Dramas & Filmes Coreanos | HallyuHub', description: desc, url: `${BASE_URL}/productions` },
    }
}

export default async function ProductionsPage() {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return <Suspense><ProductionsList /></Suspense>
    const ageFilter = await applyAgeRatingFilter().catch(() => ({}))
    const baseWhere = { flaggedAsNonKorean: false, isHidden: false, ...ageFilter }

    const [total, featuredProductions] = await Promise.all([
        prisma.production.count({ where: baseWhere }).catch(() => 0),
        prisma.production.findMany({
            where: { ...baseWhere, voteAverage: { gte: 7 }, voteCount: { not: null } },
            orderBy: [{ voteCount: 'desc' }, { voteAverage: 'desc' }],
            take: 3,
            select: {
                id: true, slug: true, titlePt: true, titleKr: true, type: true, year: true,
                imageUrl: true, voteAverage: true,
            },
        }).catch(() => []),
    ])

    const TYPE_LABEL: Record<string, string> = {
        MOVIE: 'Filme', Filme: 'Filme', FILME: 'Filme',
        SERIES: 'Série', SERIE: 'Série', 'K-Drama': 'K-Drama',
        SPECIAL: 'Especial', DOCUMENTARY: 'Documentário',
    }

    return (
        <>
        <JsonLd data={{
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Doramas & Filmes Coreanos | HallyuHub",
            "description": "K-Dramas, doramas e filmes coreanos — perfis completos com elenco, sinopse e avaliações em português.",
            "url": `${BASE_URL}/productions`,
            "inLanguage": "pt-BR",
            "publisher": { "@type": "Organization", "name": "HallyuHub", "url": BASE_URL },
        }} />
        <PageTransition className="pb-16">

            {/* ── Editorial header ─────────────────────────────────── */}
            <section className="page-wrap border-b border-foreground py-4 sm:py-5">
                <Breadcrumbs items={[{ label: 'catálogo' }, { label: 'produções' }]} className="mb-1" />
                <h1 className="max-w-[760px] font-display text-[28px] font-black leading-[0.96] tracking-[-0.04em] sm:text-[32px] lg:text-[36px]">
                    {total.toLocaleString('pt-BR')} <span className="text-accent italic">obras</span> para descobrir.
                </h1>
            </section>

            {/* ── Capa do mês — top 3 em destaque ─────────────────── */}
            {featuredProductions.length > 0 && (
                <section className="page-wrap pt-6 pb-6">
                    <div className="flex items-baseline justify-between mb-5">
                        <h2 className="text-[22px] font-black tracking-[-0.03em] text-foreground">
                            Capa do mês <span className="font-normal text-muted text-base ml-2">이달의 작품</span>
                        </h2>
                        <span className="font-mono text-[11px] text-muted">curado pela redação</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-4">
                        {featuredProductions.map((p, i) => (
                            <a key={p.id} href={`/productions/${p.slug ?? p.id}`} className="group block">
                                <div className={`relative overflow-hidden bg-surface ${i === 0 ? 'aspect-[3/2]' : 'aspect-[2/3]'}`}>
                                    {p.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={p.imageUrl} alt={p.titlePt} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-surface flex items-center justify-center">
                                            <span className="font-black text-foreground/10 text-[80px] leading-none">{p.titlePt[0]}</span>
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                        <span className="bg-accent px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.05em] text-white">● #{i + 1} em alta</span>
                                        {p.year && <span className="bg-black/60 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">{p.year}</span>}
                                    </div>
                                    {p.voteAverage && (
                                        <div className="absolute bottom-2 right-2 bg-black/65 px-1.5 py-0.5 font-mono text-[11px] font-bold text-white">
                                            ★ {p.voteAverage.toFixed(1)}
                                        </div>
                                    )}
                                </div>
                                <div className="pt-3 pb-4 border-b border-border/50">
                                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.06em] text-accent">{TYPE_LABEL[p.type ?? ''] ?? p.type}</span>
                                    <h3 className={`font-display font-black tracking-[-0.03em] leading-[1.05] mt-1 group-hover:text-accent transition-colors ${i === 0 ? 'text-[28px]' : 'text-[20px]'}`}>{p.titlePt}</h3>
                                    {p.titleKr && <p className="text-[12px] text-muted mt-0.5">{p.titleKr}</p>}
                                </div>
                            </a>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Grid principal ───────────────────────────────────── */}
            <div className="page-wrap pt-6">
                <Suspense>
                    <ProductionsList />
                </Suspense>
                <ScrollToTop />
            </div>
        </PageTransition>
        </>
    )
}
