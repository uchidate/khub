import { Suspense } from 'react'
import type { Metadata } from "next"
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Film, Star, TrendingUp, Tv } from 'lucide-react'
import { PageTransition } from "@/components/features/PageTransition"
import { ProductionsList } from "@/components/features/ProductionsList"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { AdBanner } from "@/components/ui/AdBanner"
import { JsonLd } from "@/components/seo/JsonLd"
import prisma from "@/lib/prisma"
import { applyAgeRatingFilter } from "@/lib/utils/age-rating-filter"
import { nameToGradient } from '@/lib/utils'

export const revalidate = 600

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
    const baseWhere = { flaggedAsNonKorean: false, isHidden: false, ...ageFilter }

    const [total, heroProductions] = await Promise.all([
        prisma.production.count({ where: baseWhere }).catch(() => 0),
        prisma.production.findMany({
            where: { ...baseWhere, OR: [{ backdropUrl: { not: null } }, { imageUrl: { not: null } }] },
            orderBy: [{ voteCount: 'desc' }, { voteAverage: 'desc' }],
            take: 5,
            select: {
                id: true, titlePt: true, titleKr: true, type: true, year: true,
                imageUrl: true, backdropUrl: true, voteAverage: true, synopsis: true,
            },
        }).catch(() => []),
    ])

    const [spotlight, ...sidePicks] = heroProductions

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
            "name": "Produções Coreanas | HallyuHub",
            "description": "Produções coreanas: K-Dramas, filmes e séries. De romances épicos a thrillers de tirar o fôlego.",
            "url": `${BASE_URL}/productions`,
            "inLanguage": "pt-BR",
            "publisher": { "@type": "Organization", "name": "HallyuHub", "url": BASE_URL },
        }} />
        <PageTransition className="pb-16">

            {/* ── Hero ────────────────────────────────────────────── */}
            {spotlight ? (
                <div className="relative w-full min-h-[360px] md:min-h-[440px] overflow-hidden">
                    {/* Backdrop de fundo */}
                    <Image
                        src={spotlight.backdropUrl ?? spotlight.imageUrl ?? ''}
                        alt={spotlight.titlePt}
                        fill priority sizes="100vw"
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/15" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />

                    <div className="relative z-10 h-full flex flex-col justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 md:py-10 min-h-[360px] md:min-h-[440px]">
                        {/* Topo */}
                        <div className="flex items-center gap-2">
                            <Film className="w-3.5 h-3.5 text-accent" />
                            <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Dramas & Filmes</span>
                            <span className="text-white/30 text-xs hidden sm:inline">· {total.toLocaleString('pt-BR')} produções</span>
                        </div>

                        {/* Bottom: destaque + side picks */}
                        <div className="flex items-end gap-6 mt-auto">
                            <Link href={`/productions/${spotlight.id}`} className="group flex-1 min-w-0">
                                <p className="text-white/45 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <TrendingUp size={10} /> Em destaque
                                </p>
                                <h1 className="text-2xl sm:text-3xl md:text-[2.4rem] font-black text-white leading-tight line-clamp-1 group-hover:text-accent transition-colors mb-1">
                                    {spotlight.titlePt}
                                </h1>
                                {spotlight.titleKr && (
                                    <p className="text-white/50 text-sm mb-3">{spotlight.titleKr}</p>
                                )}
                                <div className="flex items-center gap-3 flex-wrap">
                                    {spotlight.type && <span className="text-white/60 text-xs">{TYPE_LABEL[spotlight.type] ?? spotlight.type}</span>}
                                    {spotlight.year && (
                                        <>
                                            <span className="text-white/30">·</span>
                                            <span className="text-white/60 text-xs">{spotlight.year}</span>
                                        </>
                                    )}
                                    {spotlight.voteAverage && (
                                        <>
                                            <span className="text-white/30">·</span>
                                            <span className="text-amber-400 text-xs font-bold flex items-center gap-1">
                                                <Star size={10} fill="currentColor" />{spotlight.voteAverage.toFixed(1)}
                                            </span>
                                        </>
                                    )}
                                    <span className="ml-auto flex items-center gap-1.5 text-[13px] font-bold text-accent group-hover:gap-3 transition-all">
                                        Ver produção <ArrowRight size={13} />
                                    </span>
                                </div>
                            </Link>

                            {sidePicks.length > 0 && (
                                <div className="hidden sm:flex flex-col gap-2 w-[200px] shrink-0">
                                    <p className="text-white/35 text-[9px] font-bold uppercase tracking-widest mb-1">Também populares</p>
                                    {sidePicks.slice(0, 4).map(p => (
                                        <Link key={p.id} href={`/productions/${p.id}`}
                                            className="group flex items-center gap-2.5 hover:opacity-90 transition-opacity">
                                            <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/15">
                                                {p.imageUrl ? (
                                                    <Image src={p.imageUrl} alt={p.titlePt} fill sizes="32px" className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full" style={{ background: nameToGradient(p.titlePt) }} />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-white text-xs font-semibold truncate group-hover:text-accent transition-colors">{p.titlePt}</p>
                                                <p className="text-white/40 text-[10px]">{p.year ?? ''}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-8">
                    <div className="relative mb-6 overflow-hidden rounded-3xl border border-border/80 bg-surface px-5 py-6 sm:px-7 md:py-7">
                        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">Dramas & Filmes</h1>
                        <p className="text-muted text-sm">{total.toLocaleString('pt-BR')} produções · K-Drama, K-Film</p>
                    </div>
                </div>
            )}

            {/* ── Stats strip ─────────────────────────────────────── */}
            <div className="border-b border-border bg-surface/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-3 flex items-center gap-6 overflow-x-auto scrollbar-hide">
                    <div className="flex items-center gap-2 shrink-0">
                        <Film size={12} className="text-accent" />
                        <span className="text-xs text-muted"><span className="font-bold text-foreground">{total.toLocaleString('pt-BR')}</span> produções</span>
                    </div>
                    <div className="w-px h-3 bg-border shrink-0" />
                    <div className="flex items-center gap-2 shrink-0">
                        <Tv size={12} className="text-accent" />
                        <span className="text-xs text-muted">K-Drama · K-Film · Especiais</span>
                    </div>
                    <div className="w-px h-3 bg-border shrink-0" />
                    <div className="flex items-center gap-2 shrink-0">
                        <Star size={12} className="text-accent" />
                        <span className="text-xs text-muted">Avaliações e streaming</span>
                    </div>
                </div>
            </div>

            {/* ── Conteúdo principal ──────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-8">
                <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_PRODUCTION!} format="horizontal" className="mb-6" />
                <Suspense>
                    <ProductionsList />
                </Suspense>
                <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_PRODUCTION!} format="horizontal" className="mt-8 mb-4" />
                <ScrollToTop />
            </div>
        </PageTransition>
        </>
    )
}
