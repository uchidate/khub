/**
 * Script de Backfill: Flagar conteúdo não-relevante à cultura coreana
 *
 * Varre produções e artistas existentes no banco e aplica flaggedAsNonKorean=true
 * nos que não têm evidência de relevância cultural coreana.
 *
 * Uso:
 *   npx tsx scripts/backfill-korean-flags.ts              # Roda tudo
 *   npx tsx scripts/backfill-korean-flags.ts --dry-run    # Simula sem salvar
 *   npx tsx scripts/backfill-korean-flags.ts --only=productions
 *   npx tsx scripts/backfill-korean-flags.ts --only=artists
 *   npx tsx scripts/backfill-korean-flags.ts --batch=50   # Tamanho do lote (default 100)
 *   npx tsx scripts/backfill-korean-flags.ts --strict     # Flaga artistas sem qualquer evidência coreana
 */

import 'dotenv/config'
import prisma from '../lib/prisma'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

// ============================================================================
// Args
// ============================================================================
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const isStrict = args.includes('--strict') // Flaga artistas sem evidência coreana (mesmo sem dados)
const onlyArg = args.find(a => a.startsWith('--only='))?.split('=')[1]
const batchArg = args.find(a => a.startsWith('--batch='))?.split('=')[1]
const BATCH_SIZE = batchArg ? parseInt(batchArg) : 100

// ============================================================================
// TMDB helpers
// ============================================================================
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
    if (!res.ok) {
      console.warn(`  TMDB error ${res.status} para ${endpoint}`)
      return null
    }
    return res.json()
  } catch {
    return null
  }
}

function isKoreanByCountry(data: {
  origin_country?: string[]
  production_countries?: Array<{ iso_3166_1: string }>
}): boolean {
  if (data.origin_country?.includes('KR')) return true
  if (data.production_countries?.some(c => c.iso_3166_1 === 'KR')) return true
  return false
}

function hasKoreanName(nameHangul: string | null): boolean {
  return !!nameHangul && /[\uAC00-\uD7AF]/.test(nameHangul)
}

function isKoreanBirthplace(place: string | null): boolean {
  if (!place) return false
  const p = place.toLowerCase()
  return (
    p.includes('korea') ||
    p.includes('seoul') ||
    p.includes('busan') ||
    p.includes('incheon') ||
    p.includes('daegu') ||
    p.includes('gwangju') ||
    p.includes('daejeon')
  )
}

// ============================================================================
// Productions backfill
// ============================================================================
async function backfillProductions() {
  console.log('\n📽️  Verificando produções...')

  // Passo 1: Excluir produções sem tmdbId (sem vínculo TMDB, não verificáveis)
  const withoutTmdb = await prisma.production.findMany({
    where: { flaggedAsNonKorean: false, tmdbId: null },
    select: { id: true, titlePt: true },
  })
  console.log(`   Sem tmdbId (serão excluídas): ${withoutTmdb.length}`)
  for (const p of withoutTmdb) {
    console.log(`  🗑️  Excluindo: "${p.titlePt}"`)
  }
  if (!isDryRun && withoutTmdb.length > 0) {
    const ids = withoutTmdb.map(p => p.id)
    // Remover relações antes de excluir produções (foreign key)
    await prisma.artistProduction.deleteMany({
      where: { productionId: { in: ids } },
    })
    await prisma.production.deleteMany({
      where: { id: { in: ids } },
    })
  }

  // Passo 2: Para produções COM tmdbId, verificar origem no TMDB
  const total = await prisma.production.count({
    where: { flaggedAsNonKorean: false, tmdbId: { not: null } },
  })
  console.log(`   Com tmdbId (verificar origem): ${total}`)

  let offset = 0
  let flagged = 0
  let skipped = 0
  let noData = 0

  while (offset < total) {
    const batch = await prisma.production.findMany({
      where: { flaggedAsNonKorean: false, tmdbId: { not: null } },
      select: { id: true, titlePt: true, tmdbId: true, tmdbType: true },
      take: BATCH_SIZE,
      skip: offset,
      orderBy: { createdAt: 'asc' },
    })

    if (batch.length === 0) break

    for (const prod of batch) {
      const endpoint = prod.tmdbType === 'movie'
        ? `/movie/${prod.tmdbId}`
        : `/tv/${prod.tmdbId}`

      const details = await fetchTMDB<{
        origin_country?: string[]
        production_countries?: Array<{ iso_3166_1: string; name: string }>
      }>(endpoint)

      await sleep(50)

      if (!details) {
        noData++
        continue
      }

      const isKorean = isKoreanByCountry(details)

      if (!isKorean) {
        const origins = details.origin_country?.join(', ') ||
          details.production_countries?.map(c => c.iso_3166_1).join(', ') ||
          'N/A'
        console.log(`  ⚠️  Flagrando produção: "${prod.titlePt}" (origem: ${origins})`)

        if (!isDryRun) {
          await prisma.production.update({
            where: { id: prod.id },
            data: { flaggedAsNonKorean: true, flaggedAt: new Date() },
          })
        }
        flagged++
      } else {
        skipped++
      }
    }

    offset += batch.length
    if (total > 0) console.log(`   Progresso TMDB: ${Math.min(offset, total)}/${total}`)
  }

  const deleted = withoutTmdb.length
  console.log(`\n   ✅ Produções: ${deleted} excluídas | ${flagged} flagradas | ${skipped} mantidas | ${noData} erro TMDB`)
  return { deleted, flagged, skipped, noData }
}

// ============================================================================
// Artists backfill
// ============================================================================
async function backfillArtists() {
  console.log('\n🎭 Verificando artistas...')

  const total = await prisma.artist.count({
    where: { flaggedAsNonKorean: false },
  })
  console.log(`   Total não-flagados: ${total}`)

  let offset = 0
  let flagged = 0
  let skipped = 0
  let tmdbChecked = 0

  while (offset < total) {
    const batch = await prisma.artist.findMany({
      where: { flaggedAsNonKorean: false },
      select: {
        id: true,
        nameRomanized: true,
        nameHangul: true,
        placeOfBirth: true,
        tmdbId: true,
      },
      take: BATCH_SIZE,
      skip: offset,
      orderBy: { createdAt: 'asc' },
    })

    if (batch.length === 0) break

    for (const artist of batch) {
      // Critério 1: nome em Hangul → provavelmente coreano
      if (hasKoreanName(artist.nameHangul)) {
        skipped++
        continue
      }

      // Critério 2: nasceu na Coreia
      if (isKoreanBirthplace(artist.placeOfBirth)) {
        skipped++
        continue
      }

      // Critério 3: tem placeOfBirth de outro país → flagar
      if (artist.placeOfBirth && !isKoreanBirthplace(artist.placeOfBirth)) {
        console.log(`  ⚠️  Flagrando artista: "${artist.nameRomanized}" (nascimento: ${artist.placeOfBirth})`)
        if (!isDryRun) {
          await prisma.artist.update({
            where: { id: artist.id },
            data: { flaggedAsNonKorean: true, flaggedAt: new Date() },
          })
        }
        flagged++
        continue
      }

      // Critério 4: sem dados locais → verificar TMDB se disponível
      if (artist.tmdbId) {
        const details = await fetchTMDB<{
          place_of_birth?: string | null
          also_known_as?: string[]
          biography?: string
        }>(`/person/${artist.tmdbId}`)

        await sleep(50)
        tmdbChecked++

        if (details) {
          const bornInKorea = isKoreanBirthplace(details.place_of_birth || null)
          const hangulName = details.also_known_as?.some(n => /[\uAC00-\uD7AF]/.test(n))
          const bio = (details.biography || '').toLowerCase()
          const koreanBioMention =
            bio.includes('k-pop') ||
            bio.includes('k-drama') ||
            bio.includes('korean film') ||
            bio.includes('south korean') ||
            bio.includes('hangul')

          if (bornInKorea || hangulName || koreanBioMention) {
            skipped++
            continue
          }

          // Confirmado não-coreano via TMDB (tem birthplace fora da Coreia)
          if (details.place_of_birth && !bornInKorea) {
            console.log(`  ⚠️  Flagrando artista (TMDB): "${artist.nameRomanized}" (nascimento: ${details.place_of_birth})`)
            if (!isDryRun) {
              await prisma.artist.update({
                where: { id: artist.id },
                data: {
                  flaggedAsNonKorean: true,
                  flaggedAt: new Date(),
                  placeOfBirth: details.place_of_birth,
                },
              })
            }
            flagged++
            continue
          }

          // Modo estrito: sem nenhuma evidência coreana no TMDB → flagar
          if (isStrict) {
            console.log(`  ⚠️  Flagrando artista (sem evidência coreana): "${artist.nameRomanized}"`)
            if (!isDryRun) {
              await prisma.artist.update({
                where: { id: artist.id },
                data: { flaggedAsNonKorean: true, flaggedAt: new Date() },
              })
            }
            flagged++
            continue
          }
        }
      }

      // Sem evidência suficiente → manter (benefício da dúvida) OU flagar no modo estrito
      if (isStrict) {
        console.log(`  ⚠️  Flagrando artista (sem dados): "${artist.nameRomanized}"`)
        if (!isDryRun) {
          await prisma.artist.update({
            where: { id: artist.id },
            data: { flaggedAsNonKorean: true, flaggedAt: new Date() },
          })
        }
        flagged++
      } else {
        skipped++
      }
    }

    offset += batch.length
    console.log(`   Progresso: ${Math.min(offset, total)}/${total} (TMDB consultado: ${tmdbChecked})`)
  }

  console.log(`\n   ✅ Artistas: ${flagged} flagrados | ${skipped} mantidos | ${tmdbChecked} verificados no TMDB`)
  return { flagged, skipped, tmdbChecked }
}

// ============================================================================
// Main
// ============================================================================
async function main() {
  console.log('🚀 Backfill: Flagrando conteúdo não-relevante à cultura coreana')
  console.log(`   Dry run:    ${isDryRun}`)
  console.log(`   Apenas:     ${onlyArg ?? 'todos'}`)
  console.log(`   Lote:       ${BATCH_SIZE}`)

  if (!TMDB_API_KEY) {
    console.error('❌ TMDB_API_KEY não configurada!')
    process.exit(1)
  }

  const results: Record<string, unknown> = {}

  if (!onlyArg || onlyArg === 'productions') {
    results.productions = await backfillProductions()
  }

  if (!onlyArg || onlyArg === 'artists') {
    results.artists = await backfillArtists()
  }

  console.log('\n🏁 Backfill concluído!')
  if (isDryRun) {
    console.log('   ⚠️  Dry run — nenhuma alteração foi salva')
  }
  console.log(JSON.stringify(results, null, 2))

  await prisma.$disconnect()
}

main().catch(async err => {
  console.error('❌ Erro:', err)
  await prisma.$disconnect()
  process.exit(1)
})
