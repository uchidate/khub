/**
 * GET /api/admin/artists/stats
 * Returns artist counts for the stats bar, including sub-breakdowns.
 *
 * noHangul breakdown:
 *   noHangulPending — tmdbId set (can auto-fill via TMDB)
 *   noHangulNoTmdb  — tmdbId null (manual only)
 *
 * noPhoto breakdown:
 *   noPhotoPending — tmdbId set (can sync via TMDB)
 *   noPhotoNoTmdb  — tmdbId null (manual only)
 *
 * noSocial breakdown:
 *   noSocialPending  — socialLinksUpdatedAt null (never tried)
 *   noSocialAttempted — socialLinksUpdatedAt set but no links found yet
 *
 * All counts exclude flaggedAsNonKorean artists.
 */
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const active = { flaggedAsNonKorean: false } as const

  const [
    total,
    flagged,
    noHangul,
    noHangulPending,
    noHangulNoTmdb,
    noPhoto,
    noPhotoPending,
    noPhotoNoTmdb,
    noSocialPending,
    noSocialAttempted,
  ] = await Promise.all([
    prisma.artist.count(),
    prisma.artist.count({ where: { flaggedAsNonKorean: true } }),
    // no hangul
    prisma.artist.count({ where: { ...active, nameHangul: null } }),
    prisma.artist.count({ where: { ...active, nameHangul: null, tmdbId: { not: null } } }),
    prisma.artist.count({ where: { ...active, nameHangul: null, tmdbId: null } }),
    // no photo
    prisma.artist.count({ where: { ...active, primaryImageUrl: null } }),
    prisma.artist.count({ where: { ...active, primaryImageUrl: null, tmdbId: { not: null } } }),
    prisma.artist.count({ where: { ...active, primaryImageUrl: null, tmdbId: null } }),
    // no social links — never tried
    prisma.artist.count({ where: { ...active, socialLinksUpdatedAt: null } }),
    // no social links — tried, nothing found (updatedAt set but socialLinks is still null)
    prisma.artist.count({
      where: {
        ...active,
        socialLinksUpdatedAt: { not: null },
        socialLinks: { equals: Prisma.DbNull },
      },
    }),
  ])

  return NextResponse.json({
    total,
    flagged,
    noHangul,
    noHangulPending,
    noHangulNoTmdb,
    noPhoto,
    noPhotoPending,
    noPhotoNoTmdb,
    noSocialTotal: noSocialPending + noSocialAttempted,
    noSocialPending,
    noSocialAttempted,
  })
}
