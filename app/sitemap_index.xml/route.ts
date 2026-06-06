import { SITE_URL } from '@/lib/constants/site'
import { escapeXml, xmlResponse } from '@/lib/seo/xml'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const SITEMAPS = [
    '/sitemap.xml',
    '/sitemaps/artists.xml',
    '/sitemaps/groups.xml',
    '/sitemaps/productions.xml',
    '/sitemaps/blog.xml',
    '/sitemaps/archives.xml',
    '/sitemaps/images.xml',
    '/sitemaps/videos.xml',
]

export async function GET() {
    const now = new Date().toISOString()
    const entries = SITEMAPS.map(path => `
  <sitemap>
    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`).join('')

    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}
</sitemapindex>`)
}
