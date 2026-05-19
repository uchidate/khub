import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: 'postgresql://hallyuhub:hallyuhub@127.0.0.1:5433/hallyuhub_production' })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

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

async function searchGroupImage(name: string, token: string): Promise<string | null> {
  const q = encodeURIComponent(name)
  const res = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=artist&limit=5`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json() as any
  const artists: any[] = data.artists?.items || []
  for (const a of artists) {
    const matchName = a.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const targetName = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (matchName === targetName && a.images?.length > 0) {
      const img = a.images.sort((x: any, y: any) => (y.width || 0) - (x.width || 0))[0]
      return img.url
    }
  }
  // fallback: first result with image
  for (const a of artists) {
    if (a.images?.length > 0) {
      const img = a.images.sort((x: any, y: any) => (y.width || 0) - (x.width || 0))[0]
      return img.url
    }
  }
  return null
}

async function main() {
  const groups = await prisma.musicalGroup.findMany({
    where: { isHidden: false },
    select: { id: true, name: true, slug: true },
    orderBy: { trendingScore: 'desc' }
  })

  console.log(`🔍 ${groups.length} grupos sem foto\n`)
  const token = await getSpotifyToken()

  let updated = 0
  let failed = 0

  for (const g of groups) {
    process.stdout.write(`${g.name}... `)
    const url = await searchGroupImage(g.name, token)
    if (url) {
      await prisma.musicalGroup.update({ where: { id: g.id }, data: { profileImageUrl: url } })
      console.log(`✅`)
      updated++
    } else {
      console.log(`❌`)
      failed++
    }
    await new Promise(r => setTimeout(r, 150))
  }

  console.log(`\n✅ Atualizados: ${updated} | ❌ Sem imagem: ${failed}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
