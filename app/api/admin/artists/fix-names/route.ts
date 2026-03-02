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

/**
 * GET /api/admin/artists/fix-names
 * Retorna estatísticas sobre artistas e cobertura de TMDB IDs.
 */
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const [total, withTmdb, withoutTmdb, flagged, complete] = await Promise.all([
    prisma.artist.count({ where: { isHidden: false } }),
    prisma.artist.count({ where: { tmdbId: { not: null }, isHidden: false } }),
    prisma.artist.count({ where: { tmdbId: null, flaggedAsNonKorean: false, isHidden: false } }),
    prisma.artist.count({ where: { flaggedAsNonKorean: true, isHidden: false } }),
    prisma.artist.count({
      where: {
        tmdbId: { not: null },
        primaryImageUrl: { not: null },
        bio: { not: null },
        nameHangul: { not: null },
        isHidden: false,
      },
    }),
  ])

  return NextResponse.json({ total, withTmdb, withoutTmdb, flagged, complete })
}

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
    const data = await res.json() as { name: string; also_known_as: string[]; profile_path: string | null }
    return { name: data.name, also_known_as: data.also_known_as || [], profile_path: data.profile_path ?? null }
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
  const mode: 'fix-names' | 'fill-hangul' | 'sync-photo' = body.mode === 'fill-hangul' ? 'fill-hangul' : body.mode === 'sync-photo' ? 'sync-photo' : 'fix-names'

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

  // ── sync-photo ───────────────────────────────────────────────────────────────
  if (mode === 'sync-photo') {
    if (!tmdb.profile_path) {
      await prisma.artist.update({ where: { id: artistId }, data: { photoSyncAt: new Date() } })
      return NextResponse.json({ ok: false, reason: 'no_photo_in_tmdb' })
    }
    const photoUrl = `https://image.tmdb.org/t/p/w500${tmdb.profile_path}`
    await prisma.artist.update({ where: { id: artistId }, data: { primaryImageUrl: photoUrl, photoSyncAt: new Date() } })
    return NextResponse.json({ ok: true, primaryImageUrl: photoUrl })
  }

  // ── fill-hangul ──────────────────────────────────────────────────────────────
  if (mode === 'fill-hangul') {
    const hangul = extractHangul(tmdb.also_known_as)
    if (!hangul) {
      // Record the attempt so the artist moves to "já tentados" sub-filter
      await prisma.artist.update({ where: { id: artistId }, data: { hangulSyncAt: new Date() } })
      return NextResponse.json({ ok: false, reason: 'no_hangul_in_tmdb' })
    }

    const updateData: Record<string, unknown> = { nameHangul: hangul, hangulSyncAt: new Date() }
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

  // Verificar se o nome romanizado já existe em outro artista
  const conflict = await prisma.artist.findFirst({
    where: {
      nameRomanized: { equals: tmdb.name, mode: 'insensitive' },
      id: { not: artistId },
    },
    select: { id: true, nameRomanized: true, tmdbId: true },
  })

  if (conflict) {
    if (conflict.tmdbId && conflict.tmdbId !== artist.tmdbId) {
      // Artistas diferentes com mesmo nome — não é duplicata real, apenas conflito de nome
      // Tenta corrigir mesmo assim; se unique constraint falhar, retorna name_conflict_unresolvable
    } else {
      // Mesmo tmdbId ou sem tmdbId no conflito = duplicata real
      return NextResponse.json({ ok: false, reason: 'duplicate', conflictId: conflict.id, conflictName: tmdb.name })
    }
  }

  const koreanName = artist.nameHangul || artist.nameRomanized
  const stageNames = extractStageNames(tmdb.also_known_as, tmdb.name)

  try {
    await prisma.artist.update({
      where: { id: artistId },
      data: {
        nameRomanized: tmdb.name,
        nameHangul: koreanName,
        ...(stageNames.length > 0 ? { stageNames } : {}),
      },
    })
  } catch {
    // Unique constraint — dois artistas com exatamente o mesmo nome romanizado
    return NextResponse.json({ ok: false, reason: 'name_conflict_unresolvable', conflictName: tmdb.name })
  }

  return NextResponse.json({
    ok: true,
    nameRomanized: tmdb.name,
    nameHangul: koreanName,
    hadNameConflict: !!conflict,
  })
}
