import prisma from '@/lib/prisma'
import { SITE_URL } from '@/lib/constants/site'
import { escapeXml, xmlResponse } from '@/lib/seo/xml'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET() {
    const artists = await prisma.artist.findMany({
        where: {
            flaggedAsNonKorean: false,
            isHidden: false,
            slug: { not: null },
            OR: [
                { bio: { not: null } },
                { primaryImageUrl: { not: null } },
            ],
        },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 50000,
    })

    const urls = artists.map(artist => `
  <url>
    <loc>${escapeXml(`${SITE_URL}/artists/${artist.slug}`)}</loc>
    <lastmod>${artist.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')

    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`)
}
