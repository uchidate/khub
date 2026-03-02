/**
 * POST /api/admin/productions/backfill-pt
 *
 * Retroativamente preenche dados pt-BR do TMDB em productions existentes:
 *   - synopsis   → atualiza se o TMDB tiver tradução pt-BR e não for edição manual
 *   - titlePt    → atualiza se o TMDB tiver título pt-BR diferente do atual
 *   - titleKr    → preenche se estiver vazio
 *
 * Parâmetros body (opcionais):
 *   year?   — filtrar por ano de lançamento (ex: 2023)
 *   limit?  — máximo por lote (padrão 50, max 200)
 *   offset? — paginação
 *
 * Nunca sobrescreve campos com synopsisSource = 'manual'.
 * Retorna stream de texto linha a linha com progresso.
 */

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE = 'https://api.themoviedb.org/3'
const KOREAN_REGEX = /[\uAC00-\uD7AF\u3131-\u314E\u314F-\u3163]/

interface TMDBDetails {
  name?: string        // TV
  title?: string       // movie
  original_name?: string
  original_title?: string
  original_language?: string
  overview: string
}

async function fetchPtBR(tmdbId: string, tmdbType: string): Promise<TMDBDetails | null> {
  if (!TMDB_API_KEY) return null
  try {
    const endpoint = tmdbType === 'movie'
      ? `${TMDB_BASE}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR`
      : `${TMDB_BASE}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR`
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    return await res.json() as TMDBDetails
  } catch {
    return null
  }
}

async function fetchEnUS(tmdbId: string, tmdbType: string): Promise<string> {
  if (!TMDB_API_KEY) return ''
  try {
    const endpoint = tmdbType === 'movie'
      ? `${TMDB_BASE}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`
      : `${TMDB_BASE}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return ''
    const data = await res.json() as TMDBDetails
    return data.overview || ''
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json().catch(() => ({}))
  const year: number | null = body.year ? parseInt(body.year) : null
  const limit = Math.min(200, Math.max(1, parseInt(body.limit ?? '50')))
  const offset = Math.max(0, parseInt(body.offset ?? '0'))

  const where = {
    tmdbId: { not: null as null },
    // Only process productions that haven't been translated to pt-BR from TMDB yet
    // AND weren't manually edited (manual edits are respected)
    NOT: { synopsisSource: 'manual' as const },
    ...(year ? { year } : {}),
  }

  const [totalGlobal, productions] = await Promise.all([
    prisma.production.count({ where }),
    prisma.production.findMany({
      where,
      select: {
        id: true,
        titlePt: true,
        titleKr: true,
        synopsis: true,
        synopsisSource: true,
        tmdbId: true,
        tmdbType: true,
        type: true,
        year: true,
      },
      orderBy: [{ year: 'desc' }, { titlePt: 'asc' }],
      skip: offset,
      take: limit,
    }),
  ])

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (line: string) => controller.enqueue(encoder.encode(line + '\n'))

      send(`TOTAL_GLOBAL:${totalGlobal}`)
      send(`TOTAL:${productions.length}`)

      let updated = 0
      let noChange = 0
      let skipped = 0
      let errors = 0

      for (let i = 0; i < productions.length; i++) {
        const prod = productions[i]
        send(`PROGRESS:${i + 1}/${productions.length}:${prod.titlePt}`)

        // Skip if already has pt-BR from TMDB
        if (prod.synopsisSource === 'tmdb_pt') {
          send(`SKIP_ALREADY_PT:${prod.titlePt}`)
          noChange++
          continue
        }

        try {
          const tmdbType = prod.tmdbType || (prod.type.toUpperCase() === 'FILME' ? 'movie' : 'tv')
          const ptData = await fetchPtBR(prod.tmdbId!, tmdbType)

          if (!ptData) {
            send(`ERROR:${prod.titlePt}:tmdb_fetch_failed`)
            errors++
            continue
          }

          const updates: Record<string, unknown> = {}
          const updatedFields: string[] = []

          // ── Synopsis ──────────────────────────────────────────
          let synopsisSource: string = prod.synopsisSource ?? 'tmdb_en'
          if (ptData.overview) {
            // pt-BR overview available
            if (ptData.overview !== prod.synopsis) {
              updates.synopsis = ptData.overview
              updates.synopsisSource = 'tmdb_pt'
              updatedFields.push('sinopse(pt-BR)')
            }
            synopsisSource = 'tmdb_pt'
          } else if (!prod.synopsis) {
            // No pt-BR synopsis, but production has no synopsis at all — fetch en-US
            const enSynopsis = await fetchEnUS(prod.tmdbId!, tmdbType)
            if (enSynopsis) {
              updates.synopsis = enSynopsis
              updates.synopsisSource = 'tmdb_en'
              updatedFields.push('sinopse(en)')
              synopsisSource = 'tmdb_en'
            }
          }

          // ── titlePt: only update if TMDB pt-BR title differs and isn't Korean ──
          const ptTitle = tmdbType === 'movie' ? ptData.title : ptData.name
          if (ptTitle && ptTitle !== prod.titlePt && !KOREAN_REGEX.test(ptTitle)) {
            // Check no conflict with another production
            const conflict = await prisma.production.findFirst({
              where: { titlePt: ptTitle, id: { not: prod.id } },
              select: { id: true },
            })
            if (!conflict) {
              updates.titlePt = ptTitle
              updatedFields.push('título(pt-BR)')
            }
          }

          // ── titleKr: fill if missing ──────────────────────────
          if (!prod.titleKr) {
            const koreanTitle = ptData.original_language === 'ko'
              ? (ptData.original_name || ptData.original_title || null)
              : null
            if (koreanTitle) {
              updates.titleKr = koreanTitle
              updatedFields.push('titleKr')
            }
          }

          // Sync source tag even if only source changed
          if (synopsisSource === 'tmdb_pt' && prod.synopsisSource !== 'tmdb_pt' && !updates.synopsisSource) {
            updates.synopsisSource = 'tmdb_pt'
          }

          if (Object.keys(updates).length === 0) {
            send(`NO_CHANGE:${prod.titlePt}`)
            noChange++
          } else {
            await prisma.production.update({ where: { id: prod.id }, data: updates })
            send(`UPDATED:${prod.titlePt}:${updatedFields.join(',')}`)
            updated++
          }
        } catch (e) {
          send(`ERROR:${prod.titlePt}:${String(e)}`)
          errors++
        }

        // Rate limiting
        if (i < productions.length - 1) {
          await new Promise(r => setTimeout(r, 300))
        }
      }

      send(`DONE:updated=${updated},noChange=${noChange},skipped=${skipped},errors=${errors}`)
      controller.close()
    },
  })

  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
