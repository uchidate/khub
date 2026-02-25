/**
 * POST /api/admin/artists/fix-names
 *
 * Corrige nomes de um único artista via TMDB.
 * Modo detectado automaticamente pelo campo `mode`:
 *   'fix-names'   — corrige nameRomanized que contém caracteres coreanos
 *   'fill-hangul' — preenche nameHangul vazio usando also_known_as do TMDB
 *
 * Body: { artistId: string, mode?: 'fix-names' | 'fill-hangul' }
 * Retorna: { ok: boolean, reason?: string, nameRomanized?: string, nameHangul?: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 15

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const KOREAN_REGEX = /[\uAC00-\uD7AF\u3131-\u314E\u314F-\u3163]/
const CJK_REGEX = /[\uAC00-\uD7AF\u3131-\u314E\u4E00-\u9FFF\u3040-\u30FF]/

async function fetchTMDBPerson(tmdbId: string) {
  if (!TMDB_API_KEY) return null
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/person/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return null
    const data = await res.json() as { name: string; also_known_as: string[] }
    return { name: data.name, also_known_as: data.also_known_as || [] }
  } catch {
    return null
  }
}

function extractHangul(also_known_as: string[]): string | null {
  return also_known_as.find(name => KOREAN_REGEX.test(name)) ?? null
}

function extractStageNames(also_known_as: string[], canonicalName: string): string[] {
  return also_known_as
    .filter(n => !CJK_REGEX.test(n) && n !== canonicalName)
    .map(n => n.trim())
    .filter(n => n.length >= 2 && n.length <= 50)
    .slice(0, 5)
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json().catch(() => ({}))
  const artistId: string | undefined = body.artistId
  const mode: 'fix-names' | 'fill-hangul' = body.mode === 'fill-hangul' ? 'fill-hangul' : 'fix-names'

  if (!artistId) {
    return NextResponse.json({ error: 'artistId obrigatório' }, { status: 400 })
  }

  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { id: true, nameRomanized: true, nameHangul: true, tmdbId: true, stageNames: true },
  })

  if (!artist) {
    return NextResponse.json({ error: 'Artista não encontrado' }, { status: 404 })
  }

  if (!artist.tmdbId) {
    return NextResponse.json({ ok: false, reason: 'no_tmdb' })
  }

  const tmdb = await fetchTMDBPerson(artist.tmdbId)
  if (!tmdb) {
    return NextResponse.json({ ok: false, reason: 'tmdb_fetch_failed' })
  }

  // ── fill-hangul ──────────────────────────────────────────────────────────────
  if (mode === 'fill-hangul') {
    const hangul = extractHangul(tmdb.also_known_as)
    if (!hangul) {
      return NextResponse.json({ ok: false, reason: 'no_hangul_in_tmdb' })
    }

    const updateData: Record<string, unknown> = { nameHangul: hangul }
    if (!artist.stageNames || artist.stageNames.length === 0) {
      const stageNames = extractStageNames(tmdb.also_known_as, tmdb.name)
      if (stageNames.length > 0) updateData.stageNames = stageNames
    }

    await prisma.artist.update({ where: { id: artistId }, data: updateData })
    return NextResponse.json({ ok: true, nameHangul: hangul })
  }

  // ── fix-names ────────────────────────────────────────────────────────────────
  if (!KOREAN_REGEX.test(artist.nameRomanized)) {
    return NextResponse.json({ ok: false, reason: 'name_already_ok' })
  }

  if (!tmdb.name || KOREAN_REGEX.test(tmdb.name)) {
    return NextResponse.json({ ok: false, reason: 'tmdb_no_romanized_name' })
  }

  // Check for name conflicts with other artists
  const conflict = await prisma.artist.findFirst({
    where: {
      nameRomanized: { equals: tmdb.name, mode: 'insensitive' },
      id: { not: artistId },
    },
    select: { id: true, nameRomanized: true },
  })
  if (conflict) {
    return NextResponse.json({ ok: false, reason: 'duplicate', conflictName: tmdb.name })
  }

  const koreanName = artist.nameHangul || artist.nameRomanized
  const stageNames = extractStageNames(tmdb.also_known_as, tmdb.name)

  await prisma.artist.update({
    where: { id: artistId },
    data: {
      nameRomanized: tmdb.name,
      nameHangul: koreanName,
      ...(stageNames.length > 0 ? { stageNames } : {}),
    },
  })

  return NextResponse.json({ ok: true, nameRomanized: tmdb.name, nameHangul: koreanName })
}
