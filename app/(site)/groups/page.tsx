import { Suspense } from "react"
import type { Metadata } from "next"
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Users, Mic2, TrendingUp, Star } from 'lucide-react'
import { PageTransition } from "@/components/features/PageTransition"
import { GroupsList } from "@/components/features/GroupsList"
import { AdBanner } from "@/components/ui/AdBanner"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { JsonLd } from "@/components/seo/JsonLd"
import prisma from "@/lib/prisma"
import { nameToGradient } from '@/lib/utils'

export const revalidate = 600

import { SITE_URL } from '@/lib/constants/site'
const BASE_URL = SITE_URL

export async function generateMetadata(): Promise<Metadata> {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
        return {
            title: 'Grupos K-Pop',
            description: 'BTS, BLACKPINK, TWICE e muito mais — perfis completos de grupos K-Pop com formação, discografia e trajetória na indústria coreana.',
            keywords: 'grupos K-Pop, K-Pop, BTS, BLACKPINK, TWICE, idol coreano, fanclub, fandom, bias, comeback, HallyuHub',
            alternates: { canonical: `${BASE_URL}/groups`, languages: { 'pt-BR': `${BASE_URL}/groups`, 'x-default': `${BASE_URL}/groups` } },
        }
    }
    const total = await prisma.musicalGroup.count({ where: { isHidden: false } }).catch(() => 0)
    const desc = `${total > 0 ? `${total} ` : ''}grupos K-Pop com perfis completos — formação, integrantes, fanclub, discografia e trajetória na indústria coreana, em português.`
    return {
        title: 'Grupos K-Pop',
        description: desc,
        keywords: 'grupos K-Pop, K-Pop, BTS, BLACKPINK, TWICE, idol coreano, fanclub, fandom, bias, comeback, HallyuHub',
        alternates: { canonical: `${BASE_URL}/groups`, languages: { 'pt-BR': `${BASE_URL}/groups`, 'x-default': `${BASE_URL}/groups` } },
        openGraph: {
            title: 'Grupos K-Pop | HallyuHub',
            description: desc,
            url: `${BASE_URL}/groups`,
        },
    }
}

export default async function GroupsPage() {
    const [total, heroGroups, totalArtists] = await Promise.all([
        prisma.musicalGroup.count({ where: { isHidden: false } }).catch(() => 0),
        prisma.musicalGroup.findMany({
            where: { isHidden: false, profileImageUrl: { not: null } },
            orderBy: { trendingScore: 'desc' },
            take: 5,
            select: {
                id: true, slug: true, name: true, nameHangul: true, profileImageUrl: true,
                debutDate: true, fanClubName: true, trendingScore: true,
                _count: { select: { members: { where: { isActive: true } } } },
            },
        }).catch(() => []),
        prisma.artist.count({ where: { isHidden: false, flaggedAsNonKorean: false } }).catch(() => 0),
    ])

    const [spotlight, ...sidePicks] = heroGroups

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
        {heroGroups.length > 0 && (
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": "Grupos K-Pop em Destaque",
                "url": `${BASE_URL}/groups`,
                "numberOfItems": heroGroups.length,
                "itemListElement": heroGroups.map((g, i) => ({
                    "@type": "ListItem",
                    "position": i + 1,
                    "url": `${BASE_URL}/groups/${g.slug ?? g.id}`,
                    "name": g.name,
                })),
            }} />
        )}
        <PageTransition className="pb-16">

            {/* ── Hero ────────────────────────────────────────────── */}
            {spotlight ? (
                <div className="relative w-full min-h-[360px] md:min-h-[440px] overflow-hidden bg-black">
                    {/* Mosaico: top 5 grupos em colunas verticais */}
                    <div className="absolute inset-0 flex">
                        {heroGroups.map((g, i) => (
                            <div key={g.id} className="relative flex-1 h-full">
                                {g.profileImageUrl ? (
                                    <Image src={g.profileImageUrl} alt="" fill priority={i === 0} sizes="20vw"
                                        className="object-cover object-top" />
                                ) : (
                                    <div className="w-full h-full" style={{ background: nameToGradient(g.name) }} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />

                    <div className="relative z-10 h-full flex flex-col justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 md:py-10 min-h-[360px] md:min-h-[440px]">
                        {/* Topo */}
                        <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-accent" />
                            <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Grupos K-Pop</span>
                            <span className="text-white/30 text-xs hidden sm:inline">· {total.toLocaleString('pt-BR')} grupos</span>
                        </div>

                        {/* Bottom: destaque + side picks */}
                        <div className="flex items-end gap-6 mt-auto">
                            {/* Grupo em destaque: portrait + texto juntos */}
                            <Link href={`/groups/${spotlight.slug ?? spotlight.id}`} className="group flex items-end gap-4 flex-1 min-w-0 bg-black/40 backdrop-blur-sm rounded-2xl px-4 py-3">
                                {/* Portrait card */}
                                <div className="block shrink-0">
                                    <div className="w-20 md:w-32 lg:w-40 aspect-square relative rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
                                        <Image
                                            src={spotlight.profileImageUrl!}
                                            alt={spotlight.name}
                                            fill priority
                                            sizes="(max-width: 768px) 80px, (max-width: 1024px) 128px, 160px"
                                            className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                </div>
                                {/* Texto */}
                                <div className="min-w-0 flex-1">
                                    <p className="text-white text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <TrendingUp size={10} /> Em alta
                                    </p>
                                    <h1 className="text-2xl sm:text-3xl md:text-[2.4rem] font-black text-white leading-tight line-clamp-1 group-hover:text-accent transition-colors mb-1">
                                        {spotlight.name}
                                    </h1>
                                    {spotlight.nameHangul && (
                                        <p className="text-white/50 text-sm mb-3">{spotlight.nameHangul}</p>
                                    )}
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {spotlight._count.members > 0 && (
                                            <span className="text-white/60 text-xs">{spotlight._count.members} membros</span>
                                        )}
                                        {spotlight.debutDate && (
                                            <>
                                                <span className="text-white/30">·</span>
                                                <span className="text-white/60 text-xs">Debut {new Date(spotlight.debutDate).getFullYear()}</span>
                                            </>
                                        )}
                                        {spotlight.fanClubName && (
                                            <>
                                                <span className="text-white/30">·</span>
                                                <span className="text-white/60 text-xs">{spotlight.fanClubName}</span>
                                            </>
                                        )}
                                        <span className="ml-auto flex items-center gap-1.5 text-[13px] font-bold text-accent group-hover:gap-3 transition-all">
                                            Ver perfil <ArrowRight size={13} />
                                        </span>
                                    </div>
                                </div>
                            </Link>

                            {sidePicks.length > 0 && (
                                <div className="hidden sm:flex flex-col gap-2 w-[200px] shrink-0 bg-black/40 backdrop-blur-sm rounded-2xl px-4 py-3">
                                    <p className="text-white text-[9px] font-bold uppercase tracking-widest mb-1">Também em alta</p>
                                    {sidePicks.slice(0, 4).map(g => (
                                        <Link key={g.id} href={`/groups/${g.slug ?? g.id}`}
                                            className="group flex items-center gap-2.5 hover:opacity-90 transition-opacity">
                                            <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-white/15">
                                                {g.profileImageUrl ? (
                                                    <Image src={g.profileImageUrl} alt={g.name} fill sizes="32px" className="object-cover object-top" />
                                                ) : (
                                                    <div className="w-full h-full" style={{ background: nameToGradient(g.name) }} />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-white text-xs font-semibold truncate group-hover:text-accent transition-colors">{g.name}</p>
                                                {g.nameHangul && <p className="text-white/40 text-[10px] truncate">{g.nameHangul}</p>}
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
                        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">Grupos</h1>
                        <p className="text-muted text-sm">{total.toLocaleString('pt-BR')} grupos · K-Pop</p>
                    </div>
                </div>
            )}

            {/* ── Stats strip ─────────────────────────────────────── */}
            <div className="border-b border-border bg-surface/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-3 flex items-center gap-6 overflow-x-auto scrollbar-hide">
                    <div className="flex items-center gap-2 shrink-0">
                        <Users size={12} className="text-accent" />
                        <span className="text-xs text-muted"><span className="font-bold text-foreground">{total.toLocaleString('pt-BR')}</span> grupos</span>
                    </div>
                    <div className="w-px h-3 bg-border shrink-0" />
                    <div className="flex items-center gap-2 shrink-0">
                        <Mic2 size={12} className="text-accent" />
                        <span className="text-xs text-muted"><span className="font-bold text-foreground">{totalArtists.toLocaleString('pt-BR')}</span> artistas</span>
                    </div>
                    <div className="w-px h-3 bg-border shrink-0" />
                    <div className="flex items-center gap-2 shrink-0">
                        <Star size={12} className="text-accent" />
                        <span className="text-xs text-muted">1ª a 5ª geração K-Pop</span>
                    </div>
                    <div className="ml-auto shrink-0">
                        <Link href="/artists" className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors">
                            <Mic2 size={11} className="text-accent" />
                            Ver artistas
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Conteúdo principal ──────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-8">
                <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GROUP!} format="horizontal" className="mb-6" />
                <Suspense>
                    <GroupsList />
                </Suspense>
                <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GROUP!} format="horizontal" className="mt-8 mb-4" />
                <ScrollToTop />
            </div>
        </PageTransition>
        </>
    )
}
