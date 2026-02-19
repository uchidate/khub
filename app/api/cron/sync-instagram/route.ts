/**
 * POST /api/cron/sync-instagram
 *
 * Dispara a sincronização de posts do Instagram para artistas e grupos
 * com instagramFeedUrl configurado (via RSS.app).
 *
 * Autenticação: Authorization: Bearer <CRON_SECRET> ou ?token=<CRON_SECRET>
 * Retorno: 202 Accepted — processamento continua em background.
 */
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function checkSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const provided =
    req.headers.get('authorization')?.replace('Bearer ', '') ??
    new URL(req.url).searchParams.get('token') ??
    ''
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(secret))
  } catch {
    return false
  }
}

interface RssFeedItem {
  id: string
  url: string
  title?: string
  image?: string
  content_html?: string
  date_published?: string
}

function extractPostId(url: string): string | null {
  const match = url.match(/instagram\.com\/p\/([A-Za-z0-9_-]+)/)
  return match ? match[1] : null
}

function extractImageUrl(item: RssFeedItem): string | null {
  if (item.image) return item.image
  if (item.content_html) {
    const m = item.content_html.match(/<img[^>]+src="([^"]+)"/)
    return m ? m[1] : null
  }
  return null
}

async function fetchAndSync(
  feedUrl: string,
  artistId?: string,
  groupId?: string
): Promise<number> {
  const res = await fetch(feedUrl, {
    headers: { 'User-Agent': 'HallyuHub-Sync/1.0' },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const feed = (await res.json()) as { items?: RssFeedItem[] }
  const items = (feed.items ?? []).slice(0, 12)

  let count = 0
  for (const item of items) {
    const postId = extractPostId(item.id || item.url)
    if (!postId) continue

    await prisma.instagramPost.upsert({
      where: { postId },
      update: { imageUrl: extractImageUrl(item), caption: item.title?.slice(0, 500) ?? null },
      create: {
        postId,
        artistId: artistId ?? null,
        groupId: groupId ?? null,
        imageUrl: extractImageUrl(item),
        caption: item.title?.slice(0, 500) ?? null,
        permalink: item.url,
        postedAt: item.date_published ? new Date(item.date_published) : new Date(),
      },
    })
    count++
  }
  return count
}

export async function POST(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Retorna 202 imediatamente e processa em background
  const runId = `instagram-${Date.now()}`
  console.log(JSON.stringify({ level: 'info', runId, msg: 'Instagram sync started' }))

  ;(async () => {
    try {
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

      let totalSynced = 0
      let totalErrors = 0

      for (const artist of artists) {
        try {
          const n = await fetchAndSync(artist.instagramFeedUrl!, artist.id, undefined)
          await prisma.artist.update({ where: { id: artist.id }, data: { instagramLastSync: new Date() } })
          totalSynced += n
          console.log(JSON.stringify({ level: 'info', runId, artist: artist.nameRomanized, posts: n }))
        } catch (err) {
          totalErrors++
          console.error(JSON.stringify({ level: 'error', runId, artist: artist.nameRomanized, err: String(err) }))
        }
      }

      for (const group of groups) {
        try {
          const n = await fetchAndSync(group.instagramFeedUrl!, undefined, group.id)
          await prisma.musicalGroup.update({ where: { id: group.id }, data: { instagramLastSync: new Date() } })
          totalSynced += n
          console.log(JSON.stringify({ level: 'info', runId, group: group.name, posts: n }))
        } catch (err) {
          totalErrors++
          console.error(JSON.stringify({ level: 'error', runId, group: group.name, err: String(err) }))
        }
      }

      console.log(JSON.stringify({ level: 'info', runId, msg: 'done', totalSynced, totalErrors }))
    } catch (err) {
      console.error(JSON.stringify({ level: 'error', runId, msg: 'fatal', err: String(err) }))
    }
  })()

  return NextResponse.json({ ok: true, runId }, { status: 202 })
}
