import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/productions/stats
 * Returns production counts for the stats bar, including sub-breakdowns.
 *
 * noCast breakdown:
 *   noCastPending   — tmdbId set, castSyncAt null (never attempted, can auto-sync)
 *   noCastAttempted — tmdbId set, castSyncAt set but still 0 artists (tried, nothing found)
 *   noCastNoTmdb    — tmdbId null (no automatic path, manual entry only)
 *
 * noRating breakdown:
 *   noRatingPending — tmdbId set, ageRatingSyncAt null (can try TMDB auto-classify)
 *   noRatingAttempted — tmdbId set, ageRatingSyncAt set but still no rating (tried, nothing found)
 *   noRatingNoTmdb  — tmdbId null (no automatic path)
 */
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const [
    total,
    noCast,
    noRating,
    noCastPending,
    noCastAttempted,
    noCastNoTmdb,
    noRatingPending,
    noRatingAttempted,
    noRatingNoTmdb,
    noTmdb,
    hasTmdb,
  ] = await Promise.all([
    prisma.production.count(),
    prisma.production.count({ where: { artists: { none: {} } } }),
    prisma.production.count({ where: { ageRating: null } }),
    // no cast + has tmdbId + never attempted
    prisma.production.count({ where: { artists: { none: {} }, tmdbId: { not: null }, castSyncAt: null } }),
    // no cast + has tmdbId + was tried but still empty
    prisma.production.count({ where: { artists: { none: {} }, tmdbId: { not: null }, castSyncAt: { not: null } } }),
    // no cast + no tmdbId (manual only)
    prisma.production.count({ where: { artists: { none: {} }, tmdbId: null } }),
    // no rating + has tmdbId + never attempted
    prisma.production.count({ where: { ageRating: null, tmdbId: { not: null }, ageRatingSyncAt: null } }),
    // no rating + has tmdbId + was tried but still no rating
    prisma.production.count({ where: { ageRating: null, tmdbId: { not: null }, ageRatingSyncAt: { not: null } } }),
    // no rating + no tmdbId (manual only)
    prisma.production.count({ where: { ageRating: null, tmdbId: null } }),
    // sem TMDB ID
    prisma.production.count({ where: { tmdbId: null } }),
    // com TMDB ID
    prisma.production.count({ where: { tmdbId: { not: null } } }),
  ])

  return NextResponse.json({
    total,
    noCast,
    noRating,
    noCastPending,
    noCastAttempted,
    noCastNoTmdb,
    noRatingPending,
    noRatingAttempted,
    noRatingNoTmdb,
    noTmdb,
    hasTmdb,
  })
}
