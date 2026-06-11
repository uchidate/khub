import { SITE_URL } from '@/lib/constants/site'
import { ARCHIVE_HUBS } from '@/lib/seo/archive-hubs'
import { BLOG_CATEGORIES } from '@/lib/config/categories'
import { ALL_BLOG_TAGS } from '@/lib/config/tags'
import { getHubItems, hasIndexableHubInventory } from '@/lib/seo/hub-items'
import { HUB_LOCALE_BASE_PATH, type HubLocale } from '@/lib/seo/hub-i18n'
import { escapeXml, xmlResponse } from '@/lib/seo/xml'

export const dynamic = 'force-dynamic'
export const revalidate = 3600
const HUB_SITEMAP_CONCURRENCY = 8

function hubPath(hub: (typeof ARCHIVE_HUBS)[number]) {
    const locale = (hub.locale ?? 'pt') as HubLocale
    return `${HUB_LOCALE_BASE_PATH[locale]}/${hub.slug}`
}

async function getIndexableHubPaths() {
    const results: Array<string | null> = []

    for (let index = 0; index < ARCHIVE_HUBS.length; index += HUB_SITEMAP_CONCURRENCY) {
        const batch = ARCHIVE_HUBS.slice(index, index + HUB_SITEMAP_CONCURRENCY)
        const batchResults = await Promise.all(batch.map(async hub => {
            try {
                const items = await getHubItems(hub)
                return hasIndexableHubInventory(items) ? hubPath(hub) : null
            } catch {
                return null
            }
        }))
        results.push(...batchResults)
    }

    return results.filter(Boolean) as string[]
}

export async function GET() {
    const now = new Date().toISOString()
    const QUIZ_CATEGORIES = ['k-pop', 'k-drama', 'cultura', 'historia']
    const hubPaths = await getIndexableHubPaths()
    const urls = [
        '/hubs',
        '/en/hubs',
        '/es/hubs',
        '/th/hubs',
        '/id/hubs',
        '/quiz',
        ...QUIZ_CATEGORIES.map(c => `/quiz/${c}`),
        ...hubPaths,
        ...BLOG_CATEGORIES.map(category => `/blog/category/${category.slug}`),
        ...ALL_BLOG_TAGS.slice(0, 50).map(tag => `/blog/tag/${encodeURIComponent(tag)}`),
    ].map(path => `
  <url>
    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${path === '/hubs' ? '0.75' : '0.82'}</priority>
  </url>`).join('')

    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`)
}
