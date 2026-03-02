/**
 * GET /api/admin/productions/tmdb-preview?id=<productionId>
 *
 * Busca dados do TMDB para uma produção específica (sem salvar).
 * Retorna título e sinopse em pt-BR e en-US para pré-visualização no formulário de edição.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE = 'https://api.themoviedb.org/3'

async function fetchTmdb(tmdbId: string, tmdbType: string, language: string) {
  const endpoint = tmdbType === 'movie'
    ? `${TMDB_BASE}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=${language}`
    : `${TMDB_BASE}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=${language}`
  const res = await fetch(endpoint, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) return null
  return await res.json() as { name?: string; title?: string; overview?: string }
}

function mapType(type: string): string {
  return type.toUpperCase() === 'FILME' ? 'movie' : 'tv'
}

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const production = await prisma.production.findUnique({
    where: { id },
    select: { tmdbId: true, tmdbType: true, type: true },
  })

  if (!production) return NextResponse.json({ error: 'Produção não encontrada' }, { status: 404 })
  if (!production.tmdbId) return NextResponse.json({ error: 'Produção sem TMDB ID' }, { status: 400 })

  const tmdbType = production.tmdbType || mapType(production.type)

  const [pt, en] = await Promise.all([
    fetchTmdb(production.tmdbId, tmdbType, 'pt-BR'),
    fetchTmdb(production.tmdbId, tmdbType, 'en-US'),
  ])

  if (!pt && !en) {
    return NextResponse.json({ error: 'Falha ao buscar dados do TMDB' }, { status: 502 })
  }

  const titlePt = tmdbType === 'movie' ? (pt?.title || null) : (pt?.name || null)
  const titleEn = tmdbType === 'movie' ? (en?.title || null) : (en?.name || null)

  return NextResponse.json({
    titlePt: titlePt ?? null,
    titleEn: titleEn ?? null,
    synopsisPt: pt?.overview || null,
    synopsisEn: en?.overview || null,
  })
}
