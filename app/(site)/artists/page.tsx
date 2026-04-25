import type { Metadata } from "next"
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Mic2, Users, TrendingUp, Star, Search } from 'lucide-react'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import { PageTransition } from "@/components/features/PageTransition"
import { ArtistsList } from "@/components/features/ArtistsList"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { AdBanner } from "@/components/ui/AdBanner"
import { JsonLd } from "@/components/seo/JsonLd"
import prisma from "@/lib/prisma"
import { SITE_URL } from '@/lib/constants/site'
import { nameToGradient } from '@/lib/utils'
import { getRoleLabels } from '@/lib/utils/role-labels'

const BASE_URL = SITE_URL
const DEFAULT_PER_PAGE = 50

export const revalidate = 600

export async function generateMetadata(): Promise<Metadata> {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
        return {
            title: 'Artistas K-Pop & K-Drama',
            description: 'Perfis completos de cantores, atores e artistas coreanos — discografia, filmes, grupos e redes sociais, tudo em português.',
            keywords: 'artistas K-Pop, idol coreano, K-Drama, ator coreano, cantora coreana, K-Pop Brasil, bias, maknae, HallyuHub',
            alternates: { canonical: `${BASE_URL}/artists`, languages: { 'pt-BR': `${BASE_URL}/artists`, 'x-default': `${BASE_URL}/artists` } },
        }
    }
    const total = await prisma.artist.count({ where: { flaggedAsNonKorean: false, isHidden: false } }).catch(() => 0)
    const desc = `${total > 0 ? `${total} ` : ''}perfis de artistas K-Pop e K-Drama com discografia, filmografia, grupos e redes sociais — tudo em português.`
    return {
        title: 'Artistas K-Pop & K-Drama',
        description: desc,
        keywords: 'artistas K-Pop, idol coreano, K-Drama, ator coreano, cantora coreana, K-Pop Brasil, bias, maknae, HallyuHub',
        alternates: { canonical: `${BASE_URL}/artists`, languages: { 'pt-BR': `${BASE_URL}/artists`, 'x-default': `${BASE_URL}/artists` } },
        openGraph: {
            title: 'Artistas K-Pop & K-Drama | HallyuHub',
            description: desc,
            url: `${BASE_URL}/artists`,
        },
    }
}

export default async function ArtistsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
    const sp = await searchParams
    const page = Math.max(1, parseInt(sp.page || '1'))
    const limit = DEFAULT_PER_PAGE
    const skip = (page - 1) * limit
    const search = sp.search || undefined
    const role = sp.role || undefined
    const groupId = sp.groupId || undefined
    const agencyId = sp.agencyId || undefined
    const memberType = sp.memberType || undefined
    const sortBy = sp.sortBy || 'trending'

    const where: Record<string, unknown> = { flaggedAsNonKorean: false, isHidden: false }

    if (search) {
        where.OR = [
            { nameRomanized: { contains: search, mode: 'insensitive' } },
            { nameHangul: { contains: search, mode: 'insensitive' } },
            { stageNames: { has: search } },
        ]
    }

    if (role) {
        const ROLE_VARIANTS: Record<string, string[]> = {
            ATOR:       ['ATOR', 'Ator', 'Ator/Atriz', 'ACTOR'],
            CANTOR:     ['CANTOR', 'Cantor', 'Cantor/Cantora', 'SINGER'],
            MODELO:     ['MODELO', 'Modelo', 'MODEL'],
            RAPPER:     ['RAPPER', 'Rapper'],
            DANÇARINO:  ['DANÇARINO', 'Dançarino', 'DANCER', 'Dancer'],
        }
        where.roles = { hasSome: ROLE_VARIANTS[role] ?? [role] }
    }

    if (groupId) where.memberships = { some: { groupId, isActive: true } }
    if (agencyId) where.agencyId = agencyId
    if (memberType === 'group') where.memberships = { some: { isActive: true } }
    else if (memberType === 'solo') where.memberships = { none: { isActive: true } }

    const orderBy =
        sortBy === 'name' ? { nameRomanized: 'asc' as const } :
        sortBy === 'newest' ? { createdAt: 'desc' as const } :
        { trendingScore: 'desc' as const }

    const isFiltered = !!(search || role || groupId || agencyId || memberType)

    const [artists, total, heroArtists, totalGroups] = await Promise.all([
        prisma.artist.findMany({
            where,
            take: limit,
            skip,
            orderBy,
            select: {
                id: true, slug: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true,
                roles: true, gender: true,
                memberships: { where: { isActive: true }, select: { group: { select: { id: true, name: true } } }, take: 1 },
                agency: { select: { name: true } },
            },
        }),
        prisma.artist.count({ where }),
        // Top 5 trending para o hero — só na página 1 sem filtros
        !isFiltered && page === 1 ? prisma.artist.findMany({
            where: { flaggedAsNonKorean: false, isHidden: false, primaryImageUrl: { not: null } },
            orderBy: { trendingScore: 'desc' },
            take: 5,
            select: {
                id: true, slug: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true,
                roles: true, gender: true,
                memberships: { where: { isActive: true }, select: { group: { select: { name: true } } }, take: 1 },
                viewCount: true,
            },
        }) : Promise.resolve([]),
        prisma.musicalGroup.count({ where: { isHidden: false } }).catch(() => 0),
    ])

    const [spotlight, ...sidePicks] = heroArtists

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
        {heroArtists.length > 0 && (
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": "Artistas K-Pop em Destaque",
                "url": `${BASE_URL}/artists`,
                "numberOfItems": heroArtists.length,
                "itemListElement": heroArtists.map((a, i) => ({
                    "@type": "ListItem",
                    "position": i + 1,
                    "url": `${BASE_URL}/artists/${a.slug ?? a.id}`,
                    "name": a.nameRomanized,
                })),
            }} />
        )}
        <div className="w-full bg-background border-b border-border/40">
            <div className="max-w-[970px] mx-auto px-4 py-1">
                <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTIST!} leaderboard eager />
            </div>
        </div>
        <PageTransition className="pb-16">

            {/* ── Hero ────────────────────────────────────────────── */}
            {spotlight && !isFiltered ? (
                <div className="relative w-full min-h-[360px] md:min-h-[460px] overflow-hidden mb-0 bg-black">
                    {/* Mosaico: top 5 artistas em colunas verticais */}
                    <div className="absolute inset-0 flex">
                        {heroArtists.map((a, i) => (
                            <div key={a.id} className="relative flex-1 h-full">
                                {a.primaryImageUrl ? (
                                    <Image
                                        src={a.primaryImageUrl}
                                        alt=""
                                        fill
                                        priority={i === 0}
                                        sizes="20vw"
                                        className="object-cover object-top"
                                    />
                                ) : (
                                    <div className="w-full h-full" style={{ background: nameToGradient(a.nameRomanized) }} />
                                )}
                            </div>
                        ))}
                    </div>
                    {/* Gradientes sobre o mosaico */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />

                    {/* Conteúdo */}
                    <div className="relative z-10 h-full flex flex-col justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 md:py-10 min-h-[360px] md:min-h-[460px]">
                        {/* Topo */}
                        <div className="flex items-center gap-2">
                            <Mic2 className="w-3.5 h-3.5 text-accent" />
                            <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Artistas</span>
                            <span className="text-white/30 text-xs hidden sm:inline">· {total.toLocaleString('pt-BR')} perfis</span>
                        </div>

                        {/* Bottom: destaque + side picks */}
                        <div className="flex items-end gap-6 mt-auto">
                            {/* Artista em destaque: portrait + texto juntos */}
                            <Link href={`/artists/${spotlight.slug ?? spotlight.id}`} className="group flex items-end gap-4 flex-1 min-w-0 bg-black/40 backdrop-blur-sm rounded-2xl px-4 py-3">
                                {/* Portrait card */}
                                <div className="block shrink-0">
                                    <div className="w-20 md:w-32 lg:w-40 aspect-[3/4] relative rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
                                        <Image
                                            src={spotlight.primaryImageUrl!}
                                            alt={spotlight.nameRomanized}
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
                                        {spotlight.nameRomanized}
                                    </h1>
                                    {spotlight.nameHangul && (
                                        <p className="text-white/50 text-sm mb-3">{spotlight.nameHangul}</p>
                                    )}
                                    <div className="flex items-center gap-3">
                                        {spotlight.roles.length > 0 && (
                                            <span className="text-white/60 text-xs">
                                                {getRoleLabels(spotlight.roles, spotlight.gender)[0] ?? spotlight.roles[0]}
                                            </span>
                                        )}
                                        {spotlight.memberships[0]?.group?.name && (
                                            <>
                                                <span className="text-white/30">·</span>
                                                <span className="text-white/60 text-xs">{spotlight.memberships[0].group.name}</span>
                                            </>
                                        )}
                                        <span className="ml-auto flex items-center gap-1.5 text-[13px] font-bold text-accent group-hover:gap-3 transition-all">
                                            Ver perfil <ArrowRight size={13} />
                                        </span>
                                    </div>
                                </div>
                            </Link>

                            {/* Side picks — top 4 restantes */}
                            {sidePicks.length > 0 && (
                                <div className="hidden sm:flex flex-col gap-2 w-[200px] shrink-0 bg-black/40 backdrop-blur-sm rounded-2xl px-4 py-3">
                                    <p className="text-white text-[9px] font-bold uppercase tracking-widest mb-1">Também em alta</p>
                                    {sidePicks.slice(0, 4).map(a => (
                                        <Link key={a.id} href={`/artists/${a.slug ?? a.id}`}
                                            className="group flex items-center gap-2.5 hover:opacity-90 transition-opacity">
                                            <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-white/15">
                                                {a.primaryImageUrl ? (
                                                    <Image src={a.primaryImageUrl} alt={a.nameRomanized} fill sizes="32px" className="object-cover object-top" />
                                                ) : (
                                                    <div className="w-full h-full" style={{ background: nameToGradient(a.nameRomanized) }} />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-white text-xs font-semibold truncate group-hover:text-accent transition-colors">{a.nameRomanized}</p>
                                                {a.nameHangul && <p className="text-white/40 text-[10px] truncate">{a.nameHangul}</p>}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Header simples quando filtrado ou sem hero */
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-8">
                    <div className="relative mb-6 overflow-hidden rounded-3xl border border-border/80 bg-surface px-5 py-6 sm:px-7 md:py-7">
                        <div className="relative">
                            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">Artistas</h1>
                            <p className="text-muted text-sm">{total.toLocaleString('pt-BR')} perfis · K-Pop & K-Drama</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Stats strip ─────────────────────────────────────── */}
            {!isFiltered && page === 1 && (
                <div className="border-b border-border bg-surface/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-3 flex items-center gap-6 overflow-x-auto scrollbar-hide">
                        <div className="flex items-center gap-2 shrink-0">
                            <Mic2 size={12} className="text-accent" />
                            <span className="text-xs text-muted"><span className="font-bold text-foreground">{total.toLocaleString('pt-BR')}</span> artistas</span>
                        </div>
                        <div className="w-px h-3 bg-border shrink-0" />
                        <div className="flex items-center gap-2 shrink-0">
                            <Users size={12} className="text-accent" />
                            <span className="text-xs text-muted"><span className="font-bold text-foreground">{totalGroups.toLocaleString('pt-BR')}</span> grupos</span>
                        </div>
                        <div className="w-px h-3 bg-border shrink-0" />
                        <div className="flex items-center gap-2 shrink-0">
                            <Star size={12} className="text-accent" />
                            <span className="text-xs text-muted">K-Pop, K-Drama & K-Film</span>
                        </div>
                        <div className="ml-auto shrink-0">
                            <Link href="/groups" className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors">
                                <Users size={11} className="text-accent" />
                                Ver grupos
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Conteúdo principal ──────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-8">
                <ArtistsList
                    artists={artists}
                    pagination={{ page, total, pages: Math.ceil(total / limit) }}
                    initialFilters={{ search, role, groupId, agencyId, memberType, sortBy }}
                />
                <ScrollToTop />
            </div>
        </PageTransition>
        </>
    )
}
