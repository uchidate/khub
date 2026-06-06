import { Suspense } from 'react'
import type { Metadata } from "next"
import Link from 'next/link'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import { PageTransition } from "@/components/features/PageTransition"
import { ArtistsList } from "@/components/features/ArtistsList"
import { ArtistFilters } from "@/components/features/ArtistFilters"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { PageHeader } from "@/components/ui/PageHeader"
import { JsonLd } from "@/components/seo/JsonLd"
import prisma from "@/lib/prisma"
import { SITE_URL } from '@/lib/constants/site'

const BASE_URL = SITE_URL
const DEFAULT_PER_PAGE = 48
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

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
    const letter = sp.letter?.toUpperCase() || undefined

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
    if (letter) where.nameRomanized = { startsWith: letter, mode: 'insensitive' }

    const orderBy =
        sortBy === 'name' ? { nameRomanized: 'asc' as const } :
        sortBy === 'newest' ? { createdAt: 'desc' as const } :
        { trendingScore: 'desc' as const }

    const baseWhere = { flaggedAsNonKorean: false, isHidden: false }

    const [artists, total, letterCountsRaw, _totalCount] = await Promise.all([
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
                trendingScore: true,
            },
        }),
        prisma.artist.count({ where }),
        // Letter counts via raw query for performance
        prisma.$queryRaw<{ letter: string; count: bigint }[]>`
            SELECT UPPER(LEFT("nameRomanized", 1)) as letter, COUNT(*) as count
            FROM "Artist"
            WHERE "flaggedAsNonKorean" = false AND "isHidden" = false
              AND "nameRomanized" ~ '^[A-Za-z]'
            GROUP BY UPPER(LEFT("nameRomanized", 1))
        `.catch(() => [] as { letter: string; count: bigint }[]),
        prisma.artist.count({ where: baseWhere }),
    ])

    const letterCounts: Record<string, number> = {}
    for (const row of letterCountsRaw) {
        letterCounts[row.letter] = Number(row.count)
    }

    // Top trending for badge display
    const trendingIds = new Set(
        artists.filter(a => (a.trendingScore ?? 0) > 50).map(a => a.id)
    )

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
        {artists.length > 0 && (
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": letter ? `Artistas com a letra ${letter}` : "Artistas K-Pop e K-Drama",
                "url": `${BASE_URL}/artists${page > 1 ? `?page=${page}` : ''}`,
                "numberOfItems": artists.length,
                "itemListOrder": "https://schema.org/ItemListOrderDescending",
                "itemListElement": artists.map((artist, index) => ({
                    "@type": "ListItem",
                    "position": skip + index + 1,
                    "url": `${BASE_URL}/artists/${artist.slug ?? artist.id}`,
                    "name": artist.nameRomanized,
                    "item": {
                        "@type": "Person",
                        "name": artist.nameRomanized,
                        "url": `${BASE_URL}/artists/${artist.slug ?? artist.id}`,
                        ...(artist.primaryImageUrl ? { "image": artist.primaryImageUrl } : {}),
                    },
                })),
            }} />
        )}
        <PageTransition className="pb-16">

            <Suspense>
                <ArtistFilters initialFilters={{ search, role, groupId, agencyId, memberType, sortBy }} />
            </Suspense>
            {/* ── Contexto + alfabeto sticky ───────────────────────── */}
            <section className="sticky z-10 bg-background" style={{ top: 'calc(var(--site-sticky-top, 92px) + var(--section-bar-h, 38px))' }}>
                <PageHeader
                    breadcrumbs={[{ label: 'Artistas' }]}
                    subtitle="Catálogo de artistas K-Pop e K-Drama"
                    className="py-2 lg:py-2"
                />
                <div className="page-wrap border-b border-foreground py-3">
                    <div className="relative">
                    <div className="pointer-events-none absolute right-0 top-0 h-full w-10 z-10 bg-gradient-to-r from-transparent to-background" />
                    <div className="flex gap-0.5 overflow-x-auto scrollbar-none pr-10">
                        {ALPHA.map((L) => {
                            const count = letterCounts[L] ?? 0
                            const active = letter === L
                            const disabled = count === 0
                            const href = active
                                ? '/artists'
                                : `/artists?letter=${L}`
                            return (
                                <Link
                                    key={L}
                                    href={disabled ? '#' : href}
                                    aria-disabled={disabled}
                                    className={`flex flex-col items-center shrink-0 w-[32px] sm:w-[36px] py-2 font-mono rounded-sm transition-colors ${
                                        active
                                            ? 'bg-accent text-white'
                                            : disabled
                                            ? 'text-muted/40 cursor-default'
                                            : 'text-foreground hover:bg-surface'
                                    }`}
                                >
                                    <span className="text-[13px] sm:text-[15px] font-bold leading-none">{L}</span>
                                    <span className="text-[8px] sm:text-[9px] opacity-70 mt-0.5">{count}</span>
                                </Link>
                            )
                        })}
                    </div>
                    </div>
                </div>
            </section>

            {/* ── Letter section header (when filtered by letter) ───── */}
            {letter && (
                <section className="page-wrap pt-9 pb-5">
                    <div className="flex items-baseline gap-6">
                        <span className="font-display text-[96px] font-black italic leading-[0.8] tracking-[-0.06em] text-accent">{letter}</span>
                        <div>
                            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                                {letterCounts[letter] ?? 0} artistas começando com {letter}
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* ── Grid ─────────────────────────────────────────────── */}
            <div className="page-wrap pt-6">
                <ArtistsList
                    artists={artists}
                    pagination={{ page, total, pages: Math.ceil(total / limit), perPage: limit }}
                    initialFilters={{ search, role, groupId, agencyId, memberType, sortBy }}
                    trendingIds={[...trendingIds]}
                />
                <ScrollToTop />
            </div>
        </PageTransition>
        </>
    )
}
