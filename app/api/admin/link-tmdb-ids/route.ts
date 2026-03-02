/**
 * POST /api/admin/link-tmdb-ids
 *
 * Busca artistas sem tmdbId e tenta vinculá-los automaticamente
 * pesquisando pelo nome no TMDB. Só vincula quando há correspondência
 * de alta confiança (nome normalizado igual).
 *
 * Body: { limit?: number, offset?: number }
 * Stream de texto linha a linha com progresso.
 */

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE = 'https://api.themoviedb.org/3'

interface TMDBSearchResult {
  id: number
  name: string
  known_for_department: string
  popularity: number
}

/**
 * Normaliza nomes para comparação: lowercase, hifens/apóstrofes → espaço,
 * remove demais especiais, colapsa espaços.
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[-_.''']/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '')
    .trim()
}

async function searchTMDB(query: string): Promise<TMDBSearchResult[]> {
  if (!TMDB_API_KEY) return []
  try {
    const res = await fetch(
      `${TMDB_BASE}/search/person?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []
    const data = await res.json() as { results: TMDBSearchResult[] }
    return data.results ?? []
  } catch {
    return []
  }
}

function isHighConfidenceMatch(artistName: string, resultName: string): boolean {
  return normalizeName(artistName) === normalizeName(resultName)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json().catch(() => ({}))
  const limit = Math.min(500, Math.max(1, parseInt(body.limit ?? '200')))
  const offset = Math.max(0, parseInt(body.offset ?? '0'))

  const whereClause = {
    tmdbId: null,
    flaggedAsNonKorean: false,
    isHidden: false,
  }

  const totalGlobal = await prisma.artist.count({ where: whereClause })

  const artists = await prisma.artist.findMany({
    where: whereClause,
    select: { id: true, nameRomanized: true, nameHangul: true },
    orderBy: { trendingScore: 'desc' },
    skip: offset,
    take: limit,
  })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (line: string) => controller.enqueue(encoder.encode(line + '\n'))

      send(`TOTAL_GLOBAL:${totalGlobal}`)
      send(`TOTAL:${artists.length}`)

      let linked = 0
      let notFound = 0
      let lowConfidence = 0
      let errors = 0

      for (let i = 0; i < artists.length; i++) {
        const artist = artists[i]
        send(`PROGRESS:${i + 1}/${artists.length}:${artist.nameRomanized}`)

        try {
          // Tenta buscar pelo nome romanizado
          let results = await searchTMDB(artist.nameRomanized)

          // Se sem resultado e tem nome Hangul, tenta pelo Hangul
          if (results.length === 0 && artist.nameHangul) {
            results = await searchTMDB(artist.nameHangul)
          }

          if (results.length === 0) {
            send(`NOT_FOUND:${artist.nameRomanized}`)
            notFound++
          } else {
            const best = results[0]
            if (isHighConfidenceMatch(artist.nameRomanized, best.name)) {
              await prisma.artist.update({
                where: { id: artist.id },
                data: { tmdbId: String(best.id) },
              })
              send(`LINKED:${artist.nameRomanized}→${best.name}:${best.id}`)
              linked++
            } else {
              // Testa também os demais resultados com alta confiança
              const exactMatch = results.find(r => isHighConfidenceMatch(artist.nameRomanized, r.name))
              if (exactMatch) {
                await prisma.artist.update({
                  where: { id: artist.id },
                  data: { tmdbId: String(exactMatch.id) },
                })
                send(`LINKED:${artist.nameRomanized}→${exactMatch.name}:${exactMatch.id}`)
                linked++
              } else {
                send(`LOW_CONFIDENCE:${artist.nameRomanized}→${best.name}:${artist.id}`)
                lowConfidence++
              }
            }
          }
        } catch (e) {
          send(`ERROR:${artist.nameRomanized}:${String(e)}`)
          errors++
        }

        if (i < artists.length - 1) {
          await new Promise(r => setTimeout(r, 300))
        }
      }

      send(`DONE:linked=${linked},notFound=${notFound},lowConfidence=${lowConfidence},errors=${errors}`)
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
