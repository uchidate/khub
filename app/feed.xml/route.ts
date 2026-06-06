import prisma from '@/lib/prisma'
import { SITE_NAME, SITE_URL } from '@/lib/constants/site'
import { escapeXml, xmlResponse } from '@/lib/seo/xml'

export const dynamic = 'force-dynamic'
export const revalidate = 1800

export async function GET() {
    const posts = await prisma.blogPost.findMany({
        where: { status: 'PUBLISHED', isPrivate: false, publishedAt: { not: null } },
        select: {
            slug: true,
            title: true,
            excerpt: true,
            updatedAt: true,
            publishedAt: true,
            category: { select: { name: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 50,
    })

    const latest = posts[0]?.publishedAt ?? new Date()
    const items = posts.map(post => {
        const url = `${SITE_URL}/blog/${post.slug}`
        const date = post.publishedAt ?? post.updatedAt
        return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${date.toUTCString()}</pubDate>
      ${post.category?.name ? `<category>${escapeXml(post.category.name)}</category>` : ''}
      <description>${escapeXml(post.excerpt ?? post.title)}</description>
    </item>`
    }).join('')

    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(`${SITE_NAME} - Blog`)}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>${escapeXml('Artigos, guias e notícias sobre K-Pop, K-Drama e cultura coreana em português.')}</description>
    <language>pt-BR</language>
    <lastBuildDate>${latest.toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`, 'application/rss+xml; charset=utf-8')
}
