import prisma from '@/lib/prisma'
import { SITE_URL } from '@/lib/constants/site'
import { escapeXml, xmlResponse } from '@/lib/seo/xml'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET() {
    const groups = await prisma.musicalGroup.findMany({
        where: { isHidden: false, slug: { not: null } },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 50000,
    })

    const urls = groups.map(group => `
  <url>
    <loc>${escapeXml(`${SITE_URL}/groups/${group.slug}`)}</loc>
    <lastmod>${group.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.78</priority>
  </url>`).join('')

    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`)
}
