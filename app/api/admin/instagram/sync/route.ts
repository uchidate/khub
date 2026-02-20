/**
 * POST /api/admin/instagram/sync
 *
 * Rota para admin disparar sync manual do Instagram.
 * Autentica via session (requireAdmin), não expõe CRON_SECRET ao browser.
 */
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface RssFeedItem {
  id: string
  url: string
  external_url?: string
  title?: string
  image?: string
  content_html?: string
  date_published?: string
}

function extractPostId(item: RssFeedItem): string | null {
  // Verifica id, url e external_url — RSS.app pode colocar a URL do Instagram em qualquer um deles
  for (const candidate of [item.external_url, item.url, item.id]) {
    if (!candidate) continue
    const match = candidate.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/)
    if (match) return match[1]
  }
  return null
}

function extractImageUrl(item: RssFeedItem): string | null {
  if (item.image) return item.image
  if (item.content_html) {
    const m = item.content_html.match(/<img[^>]+src="([^"]+)"/)
    return m ? m[1] : null
  }
  return null
}

interface SyncResult {
  count: number
  debugSample?: { id: string; url: string; external_url?: string }[]
}

async function fetchAndSync(feedUrl: string, artistId?: string, groupId?: string): Promise<SyncResult> {
  const res = await fetch(feedUrl, {
    headers: { 'User-Agent': 'HallyuHub-Sync/1.0' },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const text = await res.text()
  if (text.trimStart().startsWith('<')) {
    throw new Error('Feed retorna XML — use a URL JSON do RSS.app (ex: https://rss.app/feeds/v1.1/XXXX.json)')
  }
  const feed = JSON.parse(text) as { items?: RssFeedItem[] }
  const items = (feed.items ?? []).slice(0, 12)

  // Amostra para debug — primeiros 3 items com campos de URL
  const debugSample = items.slice(0, 3).map(i => ({
    id: i.id ?? '',
    url: i.url ?? '',
    external_url: i.external_url,
  }))

  let count = 0
  for (const item of items) {
    const postId = extractPostId(item)
    if (!postId) continue

    const permalink = item.url || item.external_url || ''
    await prisma.instagramPost.upsert({
      where: { postId },
      update: { imageUrl: extractImageUrl(item), caption: item.title?.slice(0, 500) ?? null },
      create: {
        postId,
        artistId: artistId ?? null,
        groupId: groupId ?? null,
        imageUrl: extractImageUrl(item),
        caption: item.title?.slice(0, 500) ?? null,
        permalink,
        postedAt: item.date_published ? new Date(item.date_published) : new Date(),
      },
    })
    count++
  }
  return { count, debugSample: count === 0 ? debugSample : undefined }
}

export async function POST() {
  const { error } = await requireAdmin()
  if (error) return error

  const [artists, groups] = await Promise.all([
    prisma.artist.findMany({
      where: { instagramFeedUrl: { not: null } },
      select: { id: true, nameRomanized: true, instagramFeedUrl: true },
    }),
    prisma.musicalGroup.findMany({
      where: { instagramFeedUrl: { not: null } },
      select: { id: true, name: true, instagramFeedUrl: true },
    }),
  ])

  const results: { name: string; posts: number; error?: string; debug?: unknown }[] = []

  for (const artist of artists) {
    try {
      const { count, debugSample } = await fetchAndSync(artist.instagramFeedUrl!, artist.id, undefined)
      await prisma.artist.update({ where: { id: artist.id }, data: { instagramLastSync: new Date() } })
      results.push({ name: artist.nameRomanized, posts: count, debug: debugSample })
    } catch (err) {
      results.push({ name: artist.nameRomanized, posts: 0, error: String(err) })
    }
  }

  for (const group of groups) {
    try {
      const { count, debugSample } = await fetchAndSync(group.instagramFeedUrl!, undefined, group.id)
      await prisma.musicalGroup.update({ where: { id: group.id }, data: { instagramLastSync: new Date() } })
      results.push({ name: group.name, posts: count, debug: debugSample })
    } catch (err) {
      results.push({ name: group.name, posts: 0, error: String(err) })
    }
  }

  const totalPosts = results.reduce((s, r) => s + r.posts, 0)
  const totalErrors = results.filter(r => r.error).length

  return NextResponse.json({ ok: true, totalPosts, totalErrors, results })
}
