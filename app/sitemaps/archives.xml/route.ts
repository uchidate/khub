import { SITE_URL } from '@/lib/constants/site'
import { ARCHIVE_HUBS } from '@/lib/seo/archive-hubs'
import { BLOG_CATEGORIES } from '@/lib/config/categories'
import { ALL_BLOG_TAGS } from '@/lib/config/tags'
import { escapeXml, xmlResponse } from '@/lib/seo/xml'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET() {
    const now = new Date().toISOString()
    const QUIZ_CATEGORIES = ['k-pop', 'k-drama', 'cultura', 'historia']
    const urls = [
        '/hubs',
        '/quiz',
        ...QUIZ_CATEGORIES.map(c => `/quiz/${c}`),
        ...ARCHIVE_HUBS.map(hub => `/hubs/${hub.slug}`),
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
