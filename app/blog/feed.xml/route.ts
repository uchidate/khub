import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const BASE_URL = 'https://www.hallyuhub.com.br'

export async function GET() {
  const posts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: 20,
    include: { author: { select: { name: true } } },
  })

  const items = posts.map(p => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${BASE_URL}/blog/${p.slug}</link>
      <description><![CDATA[${p.excerpt ?? ''}]]></description>
      <pubDate>${new Date(p.publishedAt ?? p.createdAt).toUTCString()}</pubDate>
      <author>${p.author.name ?? 'HallyuHub'}</author>
      <guid>${BASE_URL}/blog/${p.slug}</guid>
    </item>
  `).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Blog – HallyuHub</title>
    <link>${BASE_URL}/blog</link>
    <description>Artigos, análises e reflexões sobre o universo Hallyu.</description>
    <language>pt-BR</language>
    ${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
