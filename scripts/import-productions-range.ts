/**
 * Import Korean Productions from TMDB — Batch Range Script
 *
 * Importa todas as produções coreanas (K-Dramas + Filmes) a partir de um ano inicial.
 * Usa paginação completa do TMDB, verifica duplicatas no banco e importa só os novos.
 *
 * Uso:
 *   npx tsx scripts/import-productions-range.ts
 *   START_YEAR=2022 END_YEAR=2025 TYPES=tv DRY_RUN=true npx tsx scripts/import-productions-range.ts
 *
 * Variáveis de ambiente:
 *   START_YEAR=2020   Ano inicial (padrão: 2020)
 *   END_YEAR=2025     Ano final (padrão: ano atual)
 *   TYPES=tv,movie    Tipos a importar (padrão: tv,movie)
 *   DRY_RUN=true      Simula sem gravar no banco
 */

import 'dotenv/config'
import prisma from '../lib/prisma'
import { getTMDBProductionDiscoveryService } from '../lib/services/tmdb-production-discovery-service'

const START_YEAR = parseInt(process.env.START_YEAR ?? '2020')
const END_YEAR   = parseInt(process.env.END_YEAR   ?? String(new Date().getFullYear()))
const TYPES      = (process.env.TYPES ?? 'tv,movie').split(',') as Array<'tv' | 'movie'>
const DRY_RUN    = process.env.DRY_RUN === 'true'

// Delay entre chamadas TMDB para respeitar rate limit
const INTER_PAGE_DELAY_MS = 500

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

async function main() {
  const svc = getTMDBProductionDiscoveryService()

  console.log(`\n🎬 Import Korean Productions — ${START_YEAR}–${END_YEAR}`)
  console.log(`   Tipos: ${TYPES.join(', ')}`)
  console.log(`   Dry run: ${DRY_RUN ? 'SIM (sem gravar)' : 'NÃO (gravando no banco)'}`)
  console.log('─'.repeat(60))

  let totalCreated  = 0
  let totalSkipped  = 0
  let totalErrors   = 0
  let totalInspected = 0

  for (const type of TYPES) {
    for (let year = START_YEAR; year <= END_YEAR; year++) {
      console.log(`\n📅 ${year} — ${type === 'tv' ? 'K-Dramas/Séries' : 'Filmes'}`)

      let page = 1
      let totalPages = 1

      do {
        await sleep(INTER_PAGE_DELAY_MS)

        const preview = await svc.previewByPeriod({ type, year, page, sortBy: 'popularity.desc' })
        totalPages = preview.totalPages

        if (preview.results.length === 0) break

        // Verificar quais tmdbIds já existem no banco (1 query para a página inteira)
        const tmdbIds = preview.results.map((r) => String(r.tmdbId))
        const existing = await prisma.production.findMany({
          where: { tmdbId: { in: tmdbIds } },
          select: { tmdbId: true },
        })
        const existingSet = new Set(existing.map((p) => p.tmdbId!))

        const newItems = preview.results.filter((r) => !existingSet.has(String(r.tmdbId)))
        totalInspected += preview.results.length

        console.log(
          `  Pág ${pad(page)}/${pad(totalPages)} — ${preview.results.length} no TMDB, ` +
          `${existingSet.size} já existem, ${newItems.length} novos`
        )

        for (const item of newItems) {
          await sleep(200) // Entre cada fetch de detalhes

          try {
            const prod = await svc.getFullProductionData(item.tmdbId, item.tmdbType)
            if (!prod) {
              console.log(`    ⚠️  tmdbId ${item.tmdbId} — sem detalhes no TMDB`)
              totalErrors++
              continue
            }

            if (DRY_RUN) {
              console.log(`    [DRY] ${prod.titlePt} (${prod.titleKr ?? '—'}) — ${prod.releaseDate?.toISOString().slice(0, 7) ?? '?'}`)
              totalCreated++
              continue
            }

            const releaseYear = prod.releaseDate ? prod.releaseDate.getUTCFullYear() : null

            await prisma.production.create({
              data: {
                titlePt:         prod.titlePt,
                titleKr:         prod.titleKr,
                type:            prod.type,
                year:            releaseYear,
                synopsis:        prod.synopsis,
                tagline:         prod.tagline,
                imageUrl:        prod.imageUrl,
                backdropUrl:     prod.backdropUrl,
                galleryUrls:     prod.galleryUrls,
                releaseDate:     prod.releaseDate,
                runtime:         prod.tmdbType === 'movie' ? prod.runtime : null,
                episodeRuntime:  prod.tmdbType === 'tv' ? (prod.episodeRuntime ?? prod.runtime) : null,
                voteAverage:     prod.voteAverage,
                trailerUrl:      prod.trailerUrl,
                tags:            prod.tags,
                ageRating:       prod.ageRating,
                tmdbId:          String(prod.tmdbId),
                tmdbType:        prod.tmdbType,
                episodeCount:    prod.episodeCount,
                seasonCount:     prod.seasonCount,
                network:         prod.network,
                productionStatus: prod.productionStatus,
              },
            })

            console.log(`    ✅ ${prod.titlePt} (${prod.titleKr ?? '—'})`)
            totalCreated++
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            if (msg.includes('Unique constraint') || msg.includes('unique constraint')) {
              // Título duplicado — não é um erro real, apenas skip
              totalSkipped++
            } else {
              console.log(`    ❌ tmdbId ${item.tmdbId} — ${msg.slice(0, 80)}`)
              totalErrors++
            }
          }
        }

        page++
      } while (page <= totalPages)
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`✅ Concluído!`)
  console.log(`   Inspecionados: ${totalInspected}`)
  console.log(`   Criados:       ${totalCreated}`)
  console.log(`   Já existiam:   ${totalSkipped}`)
  console.log(`   Erros:         ${totalErrors}`)
  console.log('─'.repeat(60))
}

main()
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
