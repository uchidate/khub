import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const SITE = 'https://www.hallyuhub.com.br'
const FEED_TITLE = 'HallyuHub — Blog K-Pop e K-Drama'
const FEED_DESC = 'Artigos, reviews e novidades sobre K-Pop, K-Drama e cultura coreana.'

function escapeXml(str: string) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

export async function GET() {
    const posts = await prisma.blogPost.findMany({
        where: { status: 'PUBLISHED', isPrivate: false },
        select: {
            slug: true,
            title: true,
            excerpt: true,
            publishedAt: true,
            coverImageUrl: true,
            category: { select: { name: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 50,
    })

    const items = posts.map((p: typeof posts[number]) => {
        const url = `${SITE}/blog/${p.slug}`
        const pubDate = (p.publishedAt ?? new Date()).toUTCString()
        const title = escapeXml(p.title)
        const desc = escapeXml(p.excerpt ?? '')
        const category = p.category ? `<category>${escapeXml(p.category.name)}</category>` : ''
        const image = p.coverImageUrl
            ? `<enclosure url="${escapeXml(p.coverImageUrl)}" type="image/jpeg" length="0"/>`
            : ''
        return `
    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${desc}</description>
      ${category}
      ${image}
    </item>`
    }).join('')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE}/blog</link>
    <description>${escapeXml(FEED_DESC)}</description>
    <language>pt-BR</language>
    <atom:link href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
        },
    })
}
