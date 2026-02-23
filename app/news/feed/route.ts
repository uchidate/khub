/**
 * RSS 2.0 Feed — /news/feed
 *
 * Static route segment that takes priority over app/news/[id]/page.tsx.
 * Returns the latest 50 news items as RSS XML.
 */

import prisma from '@/lib/prisma'

const BASE_URL = 'https://www.hallyuhub.com.br'

export const dynamic = 'force-dynamic'

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

export async function GET() {
    const news = await prisma.news.findMany({
        take: 50,
        orderBy: { publishedAt: 'desc' },
        select: {
            id: true,
            title: true,
            contentMd: true,
            originalContent: true,
            imageUrl: true,
            publishedAt: true,
            tags: true,
            sourceUrl: true,
        },
    })

    const items = news.map(item => {
        const content = item.originalContent || item.contentMd || ''
        const description = content
            .replace(/#{1,6}\s+/g, '')
            .replace(/\*\*?([^*]+)\*\*?/g, '$1')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/\n+/g, ' ')
            .trim()
            .slice(0, 300)

        const imageTag = item.imageUrl
            ? `<enclosure url="${escapeXml(item.imageUrl)}" type="image/jpeg" length="0"/>`
            : ''

        const categories = (item.tags ?? [])
            .map(tag => `<category>${escapeXml(tag)}</category>`)
            .join('')

        return `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${BASE_URL}/news/${item.id}</link>
      <guid isPermaLink="true">${BASE_URL}/news/${item.id}</guid>
      <pubDate>${item.publishedAt.toUTCString()}</pubDate>
      <description>${escapeXml(description)}</description>
      ${imageTag}
      ${categories}
    </item>`
    }).join('')

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>HallyuHub — Notícias K-Pop &amp; K-Drama</title>
    <link>${BASE_URL}/news</link>
    <description>As últimas notícias sobre K-Pop, K-Drama e cultura coreana.</description>
    <language>pt-BR</language>
    <atom:link href="${BASE_URL}/news/feed" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`

    return new Response(rss, {
        headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
        },
    })
}
