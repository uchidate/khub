/**
 * Sync Vote Counts from TMDB
 *
 * Atualiza voteCount e voteAverage para produções que têm tmdbId
 * mas voteCount IS NULL. Respeita rate limit do TMDB (40 req/10s).
 *
 * Uso:
 *   npx tsx scripts/sync-vote-counts.ts
 *   DRY_RUN=true npx tsx scripts/sync-vote-counts.ts
 *   BATCH_SIZE=500 npx tsx scripts/sync-vote-counts.ts
 */

import 'dotenv/config'
import prisma from '../lib/prisma'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const DRY_RUN = process.env.DRY_RUN === 'true'
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE ?? '200')
const DELAY_MS = 260 // ~3.8 req/s → bem abaixo do limite de 40/10s

if (!TMDB_API_KEY) {
  console.error('❌ TMDB_API_KEY não definido')
  process.exit(1)
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function fetchVotes(tmdbId: string, tmdbType: string): Promise<{ voteAverage: number | null, voteCount: number | null }> {
  const type = tmdbType === 'movie' ? 'movie' : 'tv'
  const url = `${TMDB_BASE_URL}/${type}/${tmdbId}?api_key=${TMDB_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) return { voteAverage: null, voteCount: null }
  const data = await res.json() as { vote_average?: number, vote_count?: number }
  return {
    voteAverage: data.vote_average ?? null,
    voteCount: data.vote_count ?? null,
  }
}

async function main() {
  console.log(`🔄 Buscando produções sem voteCount... (DRY_RUN=${DRY_RUN})`)

  const productions = await prisma.production.findMany({
    where: { tmdbId: { not: null }, voteCount: null },
    select: { id: true, tmdbId: true, tmdbType: true, titlePt: true },
    take: BATCH_SIZE,
    orderBy: { createdAt: 'desc' },
  })

  console.log(`📋 ${productions.length} produções para atualizar`)

  let updated = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < productions.length; i++) {
    const prod = productions[i]
    process.stdout.write(`[${i + 1}/${productions.length}] ${prod.titlePt} ... `)

    try {
      const { voteAverage, voteCount } = await fetchVotes(prod.tmdbId!, prod.tmdbType ?? 'tv')

      if (voteCount === null) {
        console.log('sem dados')
        skipped++
      } else if (DRY_RUN) {
        console.log(`⚡ DRY: voteAverage=${voteAverage} voteCount=${voteCount}`)
        updated++
      } else {
        await prisma.production.update({
          where: { id: prod.id },
          data: { voteAverage, voteCount },
        })
        console.log(`✅ voteAverage=${voteAverage} voteCount=${voteCount}`)
        updated++
      }
    } catch (err) {
      console.log(`❌ erro: ${err}`)
      errors++
    }

    await sleep(DELAY_MS)
  }

  console.log(`\n✅ Concluído: ${updated} atualizados, ${skipped} sem dados, ${errors} erros`)

  const remaining = await prisma.production.count({ where: { tmdbId: { not: null }, voteCount: null } })
  if (remaining > 0) {
    console.log(`⚠️  Ainda restam ${remaining} produções sem voteCount — rode novamente para continuar`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
