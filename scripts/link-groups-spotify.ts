import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: 'postgresql://hallyuhub:hallyuhub@127.0.0.1:5433/hallyuhub_production' })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const SPOTIFY_PLATFORM_ID = 'cmpa4aib0000201pbcn3ep1j1'

async function getSpotifyToken(): Promise<string> {
  const creds = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  })
  const data = await res.json() as any
  return data.access_token
}

async function searchSpotifyArtist(name: string, token: string): Promise<{ id: string; url: string } | null> {
  const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=5`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json() as any
  const artists: any[] = data.artists?.items || []

  // exact match first
  for (const a of artists) {
    const match = a.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const target = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (match === target) return { id: a.id, url: `https://open.spotify.com/artist/${a.id}` }
  }
  // fallback: first result
  if (artists[0]) return { id: artists[0].id, url: `https://open.spotify.com/artist/${artists[0].id}` }
  return null
}

async function main() {
  // Groups without MusicCatalogArtist
  const groups = await prisma.$queryRaw<{ id: string; name: string; slug: string }[]>`
    SELECT g.id, g.name, g.slug
    FROM "MusicalGroup" g
    LEFT JOIN "MusicCatalogArtist" mc ON mc."groupId" = g.id
    WHERE g."isHidden" = false AND mc.id IS NULL
    ORDER BY g."trendingScore" DESC
  `

  console.log(`🔍 ${groups.length} grupos sem MusicCatalogArtist\n`)
  const token = await getSpotifyToken()

  let created = 0
  let failed = 0

  for (const g of groups) {
    process.stdout.write(`${g.name}... `)
    const spotify = await searchSpotifyArtist(g.name, token)

    if (!spotify) {
      console.log(`❌ não encontrado no Spotify`)
      failed++
      await new Promise(r => setTimeout(r, 150))
      continue
    }

    // Check if ExternalMusicEntity with this spotifyId already exists (avoid dupes)
    const existing = await prisma.externalMusicEntity.findFirst({
      where: { externalId: spotify.id, platformId: SPOTIFY_PLATFORM_ID }
    })

    if (existing) {
      console.log(`⚠️  Spotify ID já existe em outro catalog`)
      failed++
      await new Promise(r => setTimeout(r, 150))
      continue
    }

    // Create MusicCatalogArtist
    const catalog = await prisma.musicCatalogArtist.create({
      data: {
        kind: 'GROUP',
        canonicalName: g.name,
        groupId: g.id,
      }
    })

    // Create ExternalMusicEntity (Spotify profile)
    await prisma.externalMusicEntity.create({
      data: {
        platformId: SPOTIFY_PLATFORM_ID,
        entityType: 'ARTIST',
        externalId: spotify.id,
        url: spotify.url,
        musicCatalogArtistId: catalog.id,
        matchStatus: 'MANUAL_VERIFIED',
        source: 'manual_script',
        confidence: 0.9,
      }
    })

    console.log(`✅ ${spotify.url}`)
    created++
    await new Promise(r => setTimeout(r, 150))
  }

  console.log(`\n✅ Criados: ${created} | ❌ Falhou: ${failed}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
