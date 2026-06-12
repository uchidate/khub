import Image from 'next/image'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { SITE_URL } from '@/lib/constants/site'
import { getArchiveHubsByLocale, type ArchiveHub } from '@/lib/seo/archive-hubs'
import { HUB_LOCALE_BASE_PATH, HUB_LOCALE_HTML_LANG, HUB_UI_STRINGS, formatHubDate, type HubLocale } from '@/lib/seo/hub-i18n'
import type { HubBlogPost } from '@/lib/seo/hub-items'

const BASE_URL = SITE_URL

export type HubArtistItem = {
    id: string
    slug: string | null
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    roles: string[]
    updatedAt: Date
    memberships: { group: { name: string; slug: string | null; id: string } }[]
}

export type HubGroupItem = {
    id: string
    slug: string | null
    name: string
    nameHangul: string | null
    profileImageUrl: string | null
    debutDate: Date | null
    updatedAt: Date
    members: { artist: { gender: number | null } }[]
}

export type HubProductionItem = {
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

export type HubItem = HubArtistItem | HubGroupItem | HubProductionItem

function itemUrl(kind: ArchiveHub['kind'], item: HubItem) {
    if (kind === 'artists') return `${BASE_URL}/artists/${item.slug ?? item.id}`
    if (kind === 'groups') return `${BASE_URL}/groups/${item.slug ?? item.id}`
    return `${BASE_URL}/productions/${item.slug ?? item.id}`
}

function itemName(kind: ArchiveHub['kind'], item: HubItem) {
    if (kind === 'artists') return (item as HubArtistItem).nameRomanized
    if (kind === 'groups') return (item as HubGroupItem).name
    return (item as HubProductionItem).titlePt
}

function imageUrl(kind: ArchiveHub['kind'], item: HubItem) {
    if (kind === 'artists') return (item as HubArtistItem).primaryImageUrl
    if (kind === 'groups') return (item as HubGroupItem).profileImageUrl
    return (item as HubProductionItem).imageUrl
}

function subtitle(kind: ArchiveHub['kind'], item: HubItem, locale: HubLocale) {
    const strings = HUB_UI_STRINGS[locale]
    if (kind === 'artists') {
        const artist = item as HubArtistItem
        return artist.memberships[0]?.group.name ?? artist.roles.slice(0, 2).join(', ') ?? strings.defaultArtistSubtitle
    }
    if (kind === 'groups') {
        const group = item as HubGroupItem
        return group.debutDate ? strings.debutYear(group.debutDate.getUTCFullYear()) : group.nameHangul ?? strings.defaultGroupSubtitle
    }
    const production = item as HubProductionItem
    return [production.year, production.voteAverage ? `${production.voteAverage.toFixed(1)}/10` : null].filter(Boolean).join(' · ') || strings.defaultProductionSubtitle
}

function relatedHubScore(source: ArchiveHub, candidate: ArchiveHub) {
    let score = 0
    if (source.kind === candidate.kind) score += 4
    if (source.groupSlug && source.groupSlug === candidate.groupSlug) score += 5
    if (source.agencyName && source.agencyName === candidate.agencyName) score += 5
    if (source.year && source.year === candidate.year) score += 3

    const sourceKeywords = new Set(source.keywords.map(keyword => keyword.toLowerCase()))
    for (const keyword of candidate.keywords) {
        if (sourceKeywords.has(keyword.toLowerCase())) score += 1
    }

    return score
}

function getRelatedHubs(hub: ArchiveHub, locale: HubLocale) {
    return getArchiveHubsByLocale(locale)
        .filter(candidate => candidate.slug !== hub.slug)
        .map(candidate => ({ hub: candidate, score: relatedHubScore(hub, candidate) }))
        .filter(candidate => candidate.score > 0)
        .sort((a, b) => b.score - a.score || a.hub.shortTitle.localeCompare(b.hub.shortTitle))
        .slice(0, 6)
        .map(candidate => candidate.hub)
}

export function HubPageContent({ hub, locale, items, blogPosts = [] }: { hub: ArchiveHub; locale: HubLocale; items: HubItem[]; blogPosts?: HubBlogPost[] }) {
    const strings = HUB_UI_STRINGS[locale]
    const basePath = HUB_LOCALE_BASE_PATH[locale]
    const canonical = `${BASE_URL}${basePath}/${hub.slug}`
    const relatedHubs = getRelatedHubs(hub, locale)
    const lastUpdated = items.reduce<Date | null>((latest, item) => {
        if (!item.updatedAt) return latest
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
                inLanguage: HUB_LOCALE_HTML_LANG[locale],
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
                    { '@type': 'ListItem', position: 1, name: strings.breadcrumbHubs, item: `${BASE_URL}${basePath}` },
                    { '@type': 'ListItem', position: 2, name: hub.shortTitle, item: canonical },
                ],
            }} />

            <section className="border-b border-border/50">
                <div className="page-wrap py-4">
                    <Breadcrumbs items={[{ label: strings.breadcrumbHubs, href: basePath }, { label: hub.shortTitle }]} />
                </div>
            </section>

            <section className="page-wrap py-10 sm:py-14">
                <div className="max-w-3xl">
                    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-accent">{strings.eyebrow}</p>
                    <h1 className="mt-2 text-[38px] font-black leading-[0.98] tracking-[-0.04em] text-foreground sm:text-[56px]">{hub.title}</h1>
                    <p className="mt-5 text-base leading-7 text-muted sm:text-lg">{hub.description}</p>
                    {lastUpdated && (
                        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                            {strings.updatedOn(formatHubDate(locale, lastUpdated))}
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
                        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">{strings.resultsSelected(items.length)}</p>
                        <h2 className="mt-1 text-xl font-black text-foreground">{strings.exploreProfiles}</h2>
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="border border-border bg-surface p-8 text-sm text-muted">{strings.emptyState}</div>
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
                                        <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.06em] text-muted">{subtitle(hub.kind, item, locale)}</p>
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
                        <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{strings.faqTitle}</h2>
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
            {blogPosts.length > 0 && (
                <section className="page-wrap pb-16">
                    <div className="border-t border-border/50 pt-10">
                        <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{strings.blogArticlesTitle}</h2>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {blogPosts.map(post => (
                                <Link key={post.id} href={`/blog/${post.slug ?? post.id}`} className="group border border-border bg-surface transition-colors hover:border-accent/60 hover:bg-accent/5">
                                    {post.coverImageUrl && (
                                        <div className="relative aspect-[16/9] overflow-hidden">
                                            <Image src={post.coverImageUrl} alt={post.title} fill sizes="(max-width: 640px) 100vw, 360px" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                                        </div>
                                    )}
                                    <div className="p-4">
                                        {post.category && <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent">{post.category.name}</p>}
                                        <h3 className="mt-1 text-sm font-black leading-5 text-foreground line-clamp-2 group-hover:text-accent transition-colors">{post.title}</h3>
                                        {post.excerpt && <p className="mt-2 text-xs leading-5 text-muted line-clamp-2">{post.excerpt}</p>}
                                        {post.readingTimeMin && <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">{post.readingTimeMin} min</p>}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
            {relatedHubs.length > 0 && (
                <section className="page-wrap pb-16">
                    <div className="border-t border-border/50 pt-10">
                        <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{strings.relatedTitle}</h2>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {relatedHubs.map(related => (
                                <Link key={related.slug} href={`${basePath}/${related.slug}`} className="border border-border bg-surface p-4 transition-colors hover:border-accent/60 hover:bg-accent/5">
                                    <h3 className="text-sm font-black text-foreground">{related.shortTitle}</h3>
                                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{related.description}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
            <ScrollToTop />
        </main>
    )
}
