import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/seo/JsonLd'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import prisma from '@/lib/prisma'
import { SITE_URL } from '@/lib/constants/site'
import { ARCHIVE_HUBS, ARCHIVE_HUB_BY_SLUG, type ArchiveHub } from '@/lib/seo/archive-hubs'
import { applyAgeRatingFilter } from '@/lib/utils/age-rating-filter'

export const revalidate = 3600

type ArtistItem = {
    id: string
    slug: string | null
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    roles: string[]
    updatedAt: Date
    memberships: { group: { name: string; slug: string | null; id: string } }[]
}

type GroupItem = {
    id: string
    slug: string | null
    name: string
    nameHangul: string | null
    profileImageUrl: string | null
    debutDate: Date | null
    updatedAt: Date
    members: { artist: { gender: number | null } }[]
}

type ProductionItem = {
    id: string
    slug: string | null
    titlePt: string
    titleKr: string | null
    imageUrl: string | null
    year: number | null
    type: string
    voteAverage: number | null
    updatedAt: Date
}

const BASE_URL = SITE_URL
const SINGER_ROLES = ['CANTOR', 'CANTORA', 'Cantor', 'Cantora', 'Cantor/Cantora', 'SINGER', 'Singer', 'VOCALIST', 'Vocalist', 'RAPPER', 'Rapper', 'IDOL', 'Idol']
const ACTOR_ROLES = ['ATOR', 'ATRIZ', 'Ator', 'Atriz', 'Ator/Atriz', 'ACTOR', 'ACTRESS', 'Actor', 'Actress']

export async function generateStaticParams() {
    return ARCHIVE_HUBS.filter(hub => !hub.locale || hub.locale === 'pt').map(hub => ({ slug: hub.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const hub = ARCHIVE_HUB_BY_SLUG[slug]
    if (!hub || (hub.locale && hub.locale !== 'pt')) return {}
    const canonical = `${BASE_URL}/hubs/${hub.slug}`
    return {
        title: hub.title,
        description: hub.description,
        keywords: [...hub.keywords, 'HallyuHub', 'K-Pop', 'K-Drama'].join(', '),
        alternates: { canonical, languages: { 'pt-BR': canonical, 'pt-PT': canonical, 'x-default': canonical } },
        openGraph: {
            title: `${hub.title} | HallyuHub`,
            description: hub.description,
            url: canonical,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${hub.title} | HallyuHub`,
            description: hub.description,
        },
    }
}

async function getHubItems(hub: ArchiveHub) {
    if (process.env.SKIP_BUILD_STATIC_GENERATION) return []

    if (hub.kind === 'artists') {
        const commonWhere = {
            flaggedAsNonKorean: false,
            isHidden: false,
            slug: { not: null },
            OR: [{ bio: { not: null } }, { primaryImageUrl: { not: null } }],
        }

        const where = hub.groupSlug
            ? {
                ...commonWhere,
                memberships: { some: { group: { slug: hub.groupSlug } } },
            }
            : hub.agencyName
            ? {
                ...commonWhere,
                agency: { name: hub.agencyName },
            }
            : hub.slug === 'idols-que-atuam-em-doramas'
            ? {
                ...commonWhere,
                AND: [
                    { roles: { hasSome: SINGER_ROLES } },
                    { roles: { hasSome: ACTOR_ROLES } },
                    { productions: { some: { production: { isHidden: false, flaggedAsNonKorean: false } } } },
                ],
            }
            : hub.slug === 'artistas-solo-kpop'
                ? {
                    ...commonWhere,
                    roles: { hasSome: SINGER_ROLES },
                    memberships: { none: { isActive: true } },
                }
                : hub.slug === 'cantores-kpop'
                ? {
                    ...commonWhere,
                    gender: 2,
                    roles: { hasSome: SINGER_ROLES },
                }
                : hub.slug === 'atrizes-coreanas'
                ? {
                    ...commonWhere,
                    gender: 1,
                    roles: { hasSome: ACTOR_ROLES },
                }
                : hub.slug === 'atores-coreanos'
                ? {
                    ...commonWhere,
                    gender: 2,
                    roles: { hasSome: ACTOR_ROLES },
                }
                : hub.slug === 'kpop-idols-famosos'
                ? {
                    ...commonWhere,
                    roles: { hasSome: SINGER_ROLES },
                }
                : {
                    ...commonWhere,
                    gender: 1,
                    roles: { hasSome: SINGER_ROLES },
                }

        return prisma.artist.findMany({
            where,
            select: {
                id: true,
                slug: true,
                nameRomanized: true,
                nameHangul: true,
                primaryImageUrl: true,
                roles: true,
                updatedAt: true,
                memberships: {
                    where: { isActive: true },
                    select: { group: { select: { id: true, slug: true, name: true } } },
                    take: 1,
                },
            },
            orderBy: hub.groupSlug
                ? [{ nameRomanized: 'asc' }]
                : [{ trendingScore: 'desc' }, { nameRomanized: 'asc' }],
            take: 48,
        }) as Promise<ArtistItem[]>
    }

    if (hub.kind === 'groups') {
        const isMaleHub = hub.slug === 'grupos-masculinos-kpop'
        const is4thGen = hub.slug === 'grupos-kpop-4a-geracao'
        const groupWhere = hub.agencyName
            ? { isHidden: false, slug: { not: null }, agency: { name: hub.agencyName } }
            : is4thGen
            ? { isHidden: false, slug: { not: null }, debutDate: { gte: new Date('2018-01-01') } }
            : { isHidden: false, slug: { not: null }, members: { some: { isActive: true, artist: { gender: isMaleHub ? 2 : 1 } } } }
        const groups = await prisma.musicalGroup.findMany({
            where: groupWhere,
            select: {
                id: true,
                slug: true,
                name: true,
                nameHangul: true,
                profileImageUrl: true,
                debutDate: true,
                updatedAt: true,
                members: {
                    where: { isActive: true },
                    select: { artist: { select: { gender: true } } },
                },
            },
            orderBy: [{ trendingScore: 'desc' }, { name: 'asc' }],
            take: 64,
        })

        return groups
            .filter(group => {
                if (hub.agencyName || is4thGen) return true
                const female = group.members.filter(member => member.artist.gender === 1).length
                const male = group.members.filter(member => member.artist.gender === 2).length
                return isMaleHub ? male >= Math.max(1, female) : female >= Math.max(1, male)
            })
            .slice(0, 48) as GroupItem[]
    }

    const ageFilter = await applyAgeRatingFilter().catch(() => ({}))

    const platformFilter =
        hub.slug === 'doramas-amazon-prime'
            ? {
                OR: [
                    { streamingPlatforms: { has: 'Amazon Prime Video' } },
                    { streamingPlatforms: { has: 'Prime Video' } },
                    { network: { contains: 'Amazon', mode: 'insensitive' as const } },
                ],
            }
            : hub.slug === 'doramas-historicos-coreanos'
            ? {
                OR: [
                    { tags: { hasSome: ['sageuk', 'Sageuk', 'histórico', 'Histórico', 'historico', 'period', 'joseon', 'Joseon'] } },
                    { type: { in: ['Sageuk', 'sageuk', 'K-Drama Histórico', 'Historical'] } },
                ],
            }
            : hub.slug === 'doramas-romanticos'
            ? {
                OR: [
                    { tags: { hasSome: ['romance', 'romântico', 'romantico', 'Romance', 'Romantic', 'romantic comedy', 'rom-com'] } },
                    { type: { contains: 'romance', mode: 'insensitive' as const } },
                ],
            }
            : {
                OR: [
                    { streamingPlatforms: { has: 'Netflix' } },
                    { network: { contains: 'Netflix', mode: 'insensitive' as const } },
                    { sourceUrls: { has: 'Netflix' } },
                ],
            }

    const yearFilter = hub.year ? { year: hub.year } : {}

    return prisma.production.findMany({
        where: {
            ...ageFilter,
            ...yearFilter,
            flaggedAsNonKorean: false,
            isHidden: false,
            slug: { not: null },
            OR: [
                { type: 'SERIE' },
                { tmdbType: 'tv' },
            ],
            AND: hub.year
                ? [{ OR: [{ isAdultContent: null }, { isAdultContent: false }] }]
                : [
                    { OR: [{ isAdultContent: null }, { isAdultContent: false }] },
                    platformFilter,
                ],
        },
        select: {
            id: true,
            slug: true,
            titlePt: true,
            titleKr: true,
            imageUrl: true,
            year: true,
            type: true,
            voteAverage: true,
            updatedAt: true,
        },
        orderBy: [{ voteAverage: 'desc' }, { year: 'desc' }],
        take: 48,
    }) as Promise<ProductionItem[]>
}

function itemUrl(kind: ArchiveHub['kind'], item: ArtistItem | GroupItem | ProductionItem) {
    if (kind === 'artists') return `${BASE_URL}/artists/${item.slug ?? item.id}`
    if (kind === 'groups') return `${BASE_URL}/groups/${item.slug ?? item.id}`
    return `${BASE_URL}/productions/${item.slug ?? item.id}`
}

function itemName(kind: ArchiveHub['kind'], item: ArtistItem | GroupItem | ProductionItem) {
    if (kind === 'artists') return (item as ArtistItem).nameRomanized
    if (kind === 'groups') return (item as GroupItem).name
    return (item as ProductionItem).titlePt
}

function imageUrl(kind: ArchiveHub['kind'], item: ArtistItem | GroupItem | ProductionItem) {
    if (kind === 'artists') return (item as ArtistItem).primaryImageUrl
    if (kind === 'groups') return (item as GroupItem).profileImageUrl
    return (item as ProductionItem).imageUrl
}

function subtitle(kind: ArchiveHub['kind'], item: ArtistItem | GroupItem | ProductionItem) {
    if (kind === 'artists') {
        const artist = item as ArtistItem
        return artist.memberships[0]?.group.name ?? artist.roles.slice(0, 2).join(', ') ?? 'Artista'
    }
    if (kind === 'groups') {
        const group = item as GroupItem
        return group.debutDate ? `Debut em ${group.debutDate.getUTCFullYear()}` : group.nameHangul ?? 'Grupo K-Pop'
    }
    const production = item as ProductionItem
    return [production.year, production.voteAverage ? `${production.voteAverage.toFixed(1)}/10` : null].filter(Boolean).join(' · ') || 'Dorama coreano'
}

export default async function HubPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const hub = ARCHIVE_HUB_BY_SLUG[slug]
    if (!hub || (hub.locale && hub.locale !== 'pt')) notFound()

    const items = await getHubItems(hub)
    const canonical = `${BASE_URL}/hubs/${hub.slug}`
    const lastUpdated = items.reduce<Date | null>((latest, item) => {
        if (!('updatedAt' in item) || !item.updatedAt) return latest
        return !latest || item.updatedAt > latest ? item.updatedAt : latest
    }, null)

    return (
        <main className="min-h-screen bg-background">
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: hub.title,
                description: hub.description,
                url: canonical,
                inLanguage: 'pt-BR',
                publisher: { '@type': 'Organization', name: 'HallyuHub', url: BASE_URL },
            }} />
            {items.length > 0 && (
                <JsonLd data={{
                    '@context': 'https://schema.org',
                    '@type': 'ItemList',
                    name: hub.title,
                    url: canonical,
                    numberOfItems: items.length,
                    itemListElement: items.map((item, index) => ({
                        '@type': 'ListItem',
                        position: index + 1,
                        url: itemUrl(hub.kind, item),
                        name: itemName(hub.kind, item),
                    })),
                }} />
            )}
            {hub.faq.length > 0 && (
                <JsonLd data={{
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    mainEntity: hub.faq.map(item => ({
                        '@type': 'Question',
                        name: item.question,
                        acceptedAnswer: { '@type': 'Answer', text: item.answer },
                    })),
                }} />
            )}
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Hubs', item: `${BASE_URL}/hubs` },
                    { '@type': 'ListItem', position: 2, name: hub.shortTitle, item: canonical },
                ],
            }} />

            <section className="border-b border-border/50">
                <div className="page-wrap py-4">
                    <Breadcrumbs items={[{ label: 'Hubs', href: '/hubs' }, { label: hub.shortTitle }]} />
                </div>
            </section>

            <section className="page-wrap py-10 sm:py-14">
                <div className="max-w-3xl">
                    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-accent">Guia HallyuHub</p>
                    <h1 className="mt-2 text-[38px] font-black leading-[0.98] tracking-[-0.04em] text-foreground sm:text-[56px]">{hub.title}</h1>
                    <p className="mt-5 text-base leading-7 text-muted sm:text-lg">{hub.description}</p>
                    {lastUpdated && (
                        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                            Atualizado em {lastUpdated.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })}
                        </p>
                    )}
                </div>
                <div className="mt-7 grid gap-4 border-y border-border/50 py-6 text-sm leading-6 text-muted md:grid-cols-2">
                    {hub.intro.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                </div>
            </section>

            <section className="page-wrap pb-16">
                <div className="mb-5 flex items-end justify-between gap-4">
                    <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">{items.length} resultados selecionados</p>
                        <h2 className="mt-1 text-xl font-black text-foreground">Explore os perfis</h2>
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="border border-border bg-surface p-8 text-sm text-muted">Nenhum item encontrado para este hub no momento.</div>
                ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-6">
                        {items.map(item => {
                            const href = itemUrl(hub.kind, item).replace(BASE_URL, '')
                            const image = imageUrl(hub.kind, item)
                            const name = itemName(hub.kind, item)
                            return (
                                <Link key={item.id} href={href} className="group block">
                                    <div className="relative aspect-[4/5] overflow-hidden bg-surface">
                                        {image ? (
                                            <Image src={image} alt={name} fill sizes="(max-width: 640px) 50vw, 180px" className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center bg-surface text-4xl font-black text-muted/20">{name[0]}</div>
                                        )}
                                    </div>
                                    <div className="border-b border-border/50 py-2">
                                        <h3 className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-accent">{name}</h3>
                                        <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.06em] text-muted">{subtitle(hub.kind, item)}</p>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </section>
            {hub.faq.length > 0 && (
                <section className="page-wrap pb-16" itemScope itemType="https://schema.org/FAQPage">
                    <div className="border-t border-border/50 pt-10">
                        <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Perguntas frequentes</h2>
                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            {hub.faq.map(item => (
                                <div key={item.question} className="border border-border bg-surface p-5" itemScope itemType="https://schema.org/Question" itemProp="mainEntity">
                                    <h3 className="text-sm font-black text-foreground" itemProp="name">{item.question}</h3>
                                    <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
                                        <p className="mt-2 text-sm leading-6 text-muted" itemProp="text">{item.answer}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
            <ScrollToTop />
        </main>
    )
}
