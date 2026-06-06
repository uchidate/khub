import prisma from '@/lib/prisma'
import { SITE_URL } from '@/lib/constants/site'
import { escapeXml, xmlResponse } from '@/lib/seo/xml'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

function imageEntry(pageUrl: string, imageUrl: string, title: string) {
    return `
  <url>
    <loc>${escapeXml(pageUrl)}</loc>
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(title)}</image:title>
    </image:image>
  </url>`
}

export async function GET() {
    const [artists, groups, productions] = await Promise.all([
        prisma.artist.findMany({
            where: {
                flaggedAsNonKorean: false,
                isHidden: false,
                slug: { not: null },
                primaryImageUrl: { not: null },
            },
            select: { slug: true, nameRomanized: true, primaryImageUrl: true },
            orderBy: { trendingScore: 'desc' },
            take: 2000,
        }),
        prisma.musicalGroup.findMany({
            where: { isHidden: false, slug: { not: null }, profileImageUrl: { not: null } },
            select: { slug: true, name: true, profileImageUrl: true },
            orderBy: { trendingScore: 'desc' },
            take: 1000,
        }),
        prisma.production.findMany({
            where: {
                flaggedAsNonKorean: false,
                isHidden: false,
                slug: { not: null },
                OR: [{ imageUrl: { not: null } }, { backdropUrl: { not: null } }],
                AND: [
                    { OR: [{ ageRating: null }, { ageRating: { not: '18' } }] },
                    { OR: [{ isAdultContent: null }, { isAdultContent: false }] },
                ],
            },
            select: { slug: true, titlePt: true, imageUrl: true, backdropUrl: true },
            orderBy: { updatedAt: 'desc' },
            take: 2000,
        }),
    ])

    const entries = [
        ...artists
            .filter(item => item.slug && item.primaryImageUrl)
            .map(item => imageEntry(`${SITE_URL}/artists/${item.slug}`, item.primaryImageUrl!, item.nameRomanized)),
        ...groups
            .filter(item => item.slug && item.profileImageUrl)
            .map(item => imageEntry(`${SITE_URL}/groups/${item.slug}`, item.profileImageUrl!, item.name)),
        ...productions
            .filter(item => item.slug && (item.imageUrl || item.backdropUrl))
            .map(item => imageEntry(`${SITE_URL}/productions/${item.slug}`, item.imageUrl ?? item.backdropUrl!, item.titlePt)),
    ].join('')

    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${entries}
</urlset>`)
}
