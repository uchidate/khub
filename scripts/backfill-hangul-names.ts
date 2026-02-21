/**
 * Script: Preenche nameHangul via TMDB para artistas sem esse campo
 *
 * Busca todos os artistas com nameHangul=null e tmdbId definido,
 * consulta o TMDB e extrai o nome em Hangul de also_known_as.
 *
 * Uso:
 *   npx tsx scripts/backfill-hangul-names.ts            # Executa
 *   npx tsx scripts/backfill-hangul-names.ts --dry-run  # Simula sem salvar
 *   npx tsx scripts/backfill-hangul-names.ts --batch=50
 */

import 'dotenv/config'
import prisma from '../lib/prisma'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const batchArg = args.find(a => a.startsWith('--batch='))?.split('=')[1]
const BATCH_SIZE = batchArg ? parseInt(batchArg) : 50

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchTMDB<T>(endpoint: string): Promise<T | null> {
  try {
    const url = `${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&language=ko-KR`
    const res = await fetch(url)
    if (res.status === 404) return null
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '10') * 1000
      console.warn(`  Rate limit, aguardando ${retryAfter}ms...`)
      await sleep(retryAfter)
      return fetchTMDB(endpoint)
    }
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function extractHangulName(alsoKnownAs: string[]): string | null {
  const hangulRegex = /[\uAC00-\uD7AF]/
  return alsoKnownAs.find(name => hangulRegex.test(name)) ?? null
}

async function main() {
  if (!TMDB_API_KEY) {
    console.error('❌ TMDB_API_KEY não configurada!')
    process.exit(1)
  }

  console.log('🔤 Backfill: Preenchendo nameHangul via TMDB')
  console.log(`   Dry run: ${isDryRun}`)
  console.log(`   Lote:    ${BATCH_SIZE}`)

  const total = await prisma.artist.count({
    where: {
      flaggedAsNonKorean: false,
      nameHangul: null,
      tmdbId: { not: null },
    },
  })
  console.log(`\n   Artistas sem nameHangul com tmdbId: ${total}`)

  let offset = 0
  let updated = 0
  let notFound = 0
  let noHangul = 0

  while (offset < total) {
    const batch = await prisma.artist.findMany({
      where: {
        flaggedAsNonKorean: false,
        nameHangul: null,
        tmdbId: { not: null },
      },
      select: { id: true, nameRomanized: true, tmdbId: true },
      take: BATCH_SIZE,
      skip: offset,
      orderBy: { createdAt: 'asc' },
    })

    if (batch.length === 0) break

    for (const artist of batch) {
      const details = await fetchTMDB<{
        also_known_as?: string[]
        place_of_birth?: string | null
      }>(`/person/${artist.tmdbId}`)

      await sleep(60)

      if (!details) {
        notFound++
        continue
      }

      const hangulName = extractHangulName(details.also_known_as || [])

      if (hangulName) {
        console.log(`  ✅ "${artist.nameRomanized}" → ${hangulName}`)
        if (!isDryRun) {
          await prisma.artist.update({
            where: { id: artist.id },
            data: {
              nameHangul: hangulName,
              // Aproveitar para salvar birthplace se não tiver
              ...(details.place_of_birth ? { placeOfBirth: details.place_of_birth } : {}),
            },
          })
        }
        updated++
      } else {
        noHangul++
      }
    }

    offset += batch.length
    console.log(`   Progresso: ${Math.min(offset, total)}/${total}`)
  }

  console.log(`\n✅ Concluído!`)
  console.log(`   Atualizados (nameHangul preenchido): ${updated}`)
  console.log(`   Sem nome Hangul no TMDB:             ${noHangul}`)
  console.log(`   Sem dados TMDB:                      ${notFound}`)

  if (isDryRun) {
    console.log('\n   ⚠️  Dry run — nenhuma alteração foi salva')
  } else {
    console.log(`\n   💡 Próximo passo: rodar o backfill em modo --strict`)
    console.log(`   npx tsx scripts/backfill-korean-flags.ts --only=artists --dry-run --strict`)
  }

  await prisma.$disconnect()
}

main().catch(async err => {
  console.error('❌ Erro:', err)
  await prisma.$disconnect()
  process.exit(1)
})
