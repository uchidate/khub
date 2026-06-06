import prisma from '@/lib/prisma'
import { SITE_URL } from '@/lib/constants/site'
import { escapeXml, xmlResponse } from '@/lib/seo/xml'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET() {
    const posts = await prisma.blogPost.findMany({
        where: { status: 'PUBLISHED', isPrivate: false, publishedAt: { not: null } },
        select: { slug: true, updatedAt: true, publishedAt: true },
        orderBy: { publishedAt: 'desc' },
        take: 50000,
    })

    const urls = posts.map(post => `
  <url>
    <loc>${escapeXml(`${SITE_URL}/blog/${post.slug}`)}</loc>
    <lastmod>${(post.updatedAt ?? post.publishedAt ?? new Date()).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.72</priority>
  </url>`).join('')

    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`)
}
