import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import { SITE_URL } from '@/lib/constants/site'
import type { ArchiveHub } from '@/lib/seo/archive-hubs'
import { HUB_INDEX_UI_STRINGS, HUB_LOCALE_BASE_PATH, HUB_LOCALE_HTML_LANG, type HubLocale } from '@/lib/seo/hub-i18n'

const BASE_URL = SITE_URL

export function HubsIndexContent({ locale, hubs }: { locale: HubLocale; hubs: ArchiveHub[] }) {
    const strings = HUB_INDEX_UI_STRINGS[locale]
    const basePath = HUB_LOCALE_BASE_PATH[locale]
    const indexUrl = `${BASE_URL}${basePath}`

    return (
        <main className="min-h-screen bg-background">
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: strings.collectionName,
                description: strings.collectionDescription,
                url: indexUrl,
                inLanguage: HUB_LOCALE_HTML_LANG[locale],
            }} />
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                name: strings.collectionName,
                url: indexUrl,
                numberOfItems: hubs.length,
                itemListElement: hubs.map((hub, index) => ({
                    '@type': 'ListItem',
                    position: index + 1,
                    url: `${BASE_URL}${basePath}/${hub.slug}`,
                    name: hub.title,
                })),
            }} />
            <section className="page-wrap py-12 sm:py-16">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-accent">{strings.eyebrow}</p>
                <h1 className="mt-2 max-w-3xl text-[38px] font-black leading-[0.98] tracking-[-0.04em] text-foreground sm:text-[56px]">{strings.heading}</h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-muted">{strings.intro}</p>
                <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {hubs.map(hub => (
                        <Link key={hub.slug} href={`${basePath}/${hub.slug}`} className="group border border-border bg-surface p-5 transition-colors hover:border-accent/50">
                            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{hub.kind}</p>
                            <h2 className="mt-2 text-xl font-black text-foreground group-hover:text-accent">{hub.title}</h2>
                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{hub.description}</p>
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    )
}
