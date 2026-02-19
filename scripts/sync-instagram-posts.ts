/**
 * sync-instagram-posts.ts
 *
 * Busca os posts mais recentes de artistas/grupos via RSS.app (JSON feed)
 * e persiste no banco como InstagramPost.
 *
 * Uso:
 *   npx ts-node --project tsconfig.scripts.json scripts/sync-instagram-posts.ts
 *
 * O RSS.app fornece feeds no formato jsonfeed.org/version/1.
 * Configure o feed de cada artista em /admin/artists/social-links.
 */

import prisma from '../lib/prisma'

interface RssFeedItem {
  id: string
  url: string
  title?: string
  image?: string
  content_html?: string
  date_published?: string
}

interface RssFeed {
  items?: RssFeedItem[]
}

function extractPostId(url: string): string | null {
  const match = url.match(/instagram\.com\/p\/([A-Za-z0-9_-]+)/)
  return match ? match[1] : null
}

function extractImageUrl(item: RssFeedItem): string | null {
  if (item.image) return item.image
  if (item.content_html) {
    const match = item.content_html.match(/<img[^>]+src="([^"]+)"/)
    return match ? match[1] : null
  }
  return null
}

async function fetchFeed(feedUrl: string): Promise<RssFeed> {
  const res = await fetch(feedUrl, {
    headers: { 'User-Agent': 'HallyuHub-Sync/1.0' },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${feedUrl}`)
  return res.json() as Promise<RssFeed>
}

async function syncArtist(artistId: string, name: string, feedUrl: string): Promise<number> {
  const feed = await fetchFeed(feedUrl)
  const items = (feed.items ?? []).slice(0, 12)

  let synced = 0
  for (const item of items) {
    const rawUrl = item.id || item.url
    const postId = extractPostId(rawUrl)
    if (!postId) continue

    const imageUrl = extractImageUrl(item)
    const caption = item.title?.slice(0, 500) ?? null
    const postedAt = item.date_published ? new Date(item.date_published) : new Date()
    const permalink = item.url

    await prisma.instagramPost.upsert({
      where: { postId },
      update: { imageUrl, caption },
      create: { postId, artistId, imageUrl, caption, permalink, postedAt },
    })
    synced++
  }

  await prisma.artist.update({
    where: { id: artistId },
    data: { instagramLastSync: new Date() },
  })

  console.log(`  ✅ ${name}: ${synced} posts sincronizados`)
  return synced
}

async function syncGroup(groupId: string, name: string, feedUrl: string): Promise<number> {
  const feed = await fetchFeed(feedUrl)
  const items = (feed.items ?? []).slice(0, 12)

  let synced = 0
  for (const item of items) {
    const rawUrl = item.id || item.url
    const postId = extractPostId(rawUrl)
    if (!postId) continue

    const imageUrl = extractImageUrl(item)
    const caption = item.title?.slice(0, 500) ?? null
    const postedAt = item.date_published ? new Date(item.date_published) : new Date()
    const permalink = item.url

    await prisma.instagramPost.upsert({
      where: { postId },
      update: { imageUrl, caption },
      create: { postId, groupId, imageUrl, caption, permalink, postedAt },
    })
    synced++
  }

  await prisma.musicalGroup.update({
    where: { id: groupId },
    data: { instagramLastSync: new Date() },
  })

  console.log(`  ✅ ${name} (grupo): ${synced} posts sincronizados`)
  return synced
}

async function main() {
  console.log('🔄 Iniciando sync de posts do Instagram via RSS.app...\n')

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

  console.log(`📸 Artistas com feed configurado: ${artists.length}`)
  console.log(`🎵 Grupos com feed configurado: ${groups.length}\n`)

  let totalSynced = 0
  let totalErrors = 0

  for (const artist of artists) {
    try {
      totalSynced += await syncArtist(artist.id, artist.nameRomanized, artist.instagramFeedUrl!)
    } catch (err) {
      console.error(`  ❌ ${artist.nameRomanized}: ${err instanceof Error ? err.message : err}`)
      totalErrors++
    }
  }

  for (const group of groups) {
    try {
      totalSynced += await syncGroup(group.id, group.name, group.instagramFeedUrl!)
    } catch (err) {
      console.error(`  ❌ ${group.name}: ${err instanceof Error ? err.message : err}`)
      totalErrors++
    }
  }

  console.log(`\n✅ Sync concluído: ${totalSynced} posts, ${totalErrors} erros`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
