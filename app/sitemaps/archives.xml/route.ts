import { SITE_URL } from '@/lib/constants/site'
import { ARCHIVE_HUBS } from '@/lib/seo/archive-hubs'
import { escapeXml, xmlResponse } from '@/lib/seo/xml'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET() {
    const now = new Date().toISOString()
    const urls = [
        '/hubs',
        ...ARCHIVE_HUBS.map(hub => `/hubs/${hub.slug}`),
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
