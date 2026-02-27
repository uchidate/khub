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
 * group breakdown:
 *   withGroup       — has active ArtistGroupMembership
 *   noGroup         — no active membership (total)
 *   noGroupUnsynced — no membership + groupSyncAt null (never tried MusicBrainz)
 *   noGroupSolo     — no membership + groupSyncAt set (tried, solo or not found)
 *
 * koreanNoTmdb: artistas cujo nameRomanized contém Hangul E não têm tmdbId (nome errado, sem ref TMDB).
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
    withGroup,
    noGroupUnsynced,
    noGroupSolo,
    koreanNoTmdbRaw,
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
    // no social links — tried, nothing found
    prisma.artist.count({
      where: {
        ...active,
        socialLinksUpdatedAt: { not: null },
        socialLinks: { equals: Prisma.DbNull },
      },
    }),
    // groups
    prisma.artist.count({ where: { ...active, memberships: { some: { isActive: true } } } }),
    prisma.artist.count({ where: { ...active, memberships: { none: { isActive: true } }, groupSyncAt: null } }),
    prisma.artist.count({ where: { ...active, memberships: { none: { isActive: true } }, groupSyncAt: { not: null } } }),
    // nome errado (Hangul no nameRomanized) E sem tmdbId — requer curadoria manual
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) FROM "Artist"
      WHERE "flaggedAsNonKorean" = false
        AND "tmdbId" IS NULL
        AND "nameRomanized" ~ E'[\\uAC00-\\uD7AF\\u3131-\\u314E\\u314F-\\u3163]'
    `,
  ])

  const noGroup = noGroupUnsynced + noGroupSolo
  const koreanNoTmdb = Number(koreanNoTmdbRaw[0].count)

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
    withGroup,
    noGroup,
    noGroupUnsynced,
    noGroupSolo,
    koreanNoTmdb,
  })
}
