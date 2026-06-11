import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants/site'
import { ARCHIVE_HUB_BY_SLUG, getTranslatedHub, type ArchiveHub } from '@/lib/seo/archive-hubs'
import { MIN_INDEXABLE_HUB_ITEMS } from '@/lib/seo/hub-items'
import { HUB_LOCALE_BASE_PATH, HUB_LOCALE_HTML_LANG, type HubLocale } from '@/lib/seo/hub-i18n'

const BASE_URL = SITE_URL

function hubUrl(locale: HubLocale, hub: ArchiveHub) {
    return `${BASE_URL}${HUB_LOCALE_BASE_PATH[locale]}/${hub.slug}`
}

export function buildHubMetadata(locale: HubLocale, slug: string, options: { itemCount?: number } = {}): Metadata {
    const hub = ARCHIVE_HUB_BY_SLUG[slug]
    if (!hub || (hub.locale ?? 'pt') !== locale) return {}

    const canonical = hubUrl(locale, hub)

    const languages: Record<string, string> = { 'x-default': canonical, [HUB_LOCALE_HTML_LANG[locale]]: canonical }
    const allLocales: HubLocale[] = ['pt', 'en', 'es', 'th', 'id']
    for (const otherLocale of allLocales) {
        if (otherLocale === locale) continue
        const translated = getTranslatedHub(hub, otherLocale)
        if (translated) languages[HUB_LOCALE_HTML_LANG[otherLocale]] = hubUrl(otherLocale, translated)
    }

    const isThinInventory = typeof options.itemCount === 'number' && options.itemCount < MIN_INDEXABLE_HUB_ITEMS

    return {
        title: hub.title,
        description: hub.description,
        keywords: [...hub.keywords, 'HallyuHub', 'K-Pop', 'K-Drama'].join(', '),
        alternates: { canonical, languages },
        robots: isThinInventory
            ? {
                index: false,
                follow: true,
                googleBot: { index: false, follow: true },
            }
            : undefined,
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
