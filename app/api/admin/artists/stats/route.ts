/**
 * GET /api/admin/artists/stats
 * Returns artist counts for the stats bar, including sub-breakdowns.
 *
 * noHangul breakdown:
 *   noHangulPending  — tmdbId set + hangulSyncAt null (never tried)
 *   noHangulAttempted — tmdbId set + hangulSyncAt set but still no hangul (tried, not found)
 *   noHangulNoTmdb   — tmdbId null (manual only)
 *
 * noPhoto breakdown:
 *   noPhotoPending  — tmdbId set + photoSyncAt null (never tried)
 *   noPhotoAttempted — tmdbId set + photoSyncAt set but still no photo (tried, not found)
 *   noPhotoNoTmdb   — tmdbId null (manual only)
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
    withTmdb,
    noTmdb,
    noHangul,
    noHangulPending,
    noHangulAttempted,
    noHangulNoTmdb,
    noPhoto,
    noPhotoPending,
    noPhotoAttempted,
    noPhotoNoTmdb,
    noSocialPending,
    noSocialAttempted,
    noSocialNoTmdb,
    withGroup,
    noGroupUnsynced,
    noGroupSolo,
    koreanNoTmdbRaw,
  ] = await Promise.all([
    prisma.artist.count(),
    prisma.artist.count({ where: { flaggedAsNonKorean: true } }),
    // tmdb presence
    prisma.artist.count({ where: { ...active, tmdbId: { not: null } } }),
    prisma.artist.count({ where: { ...active, tmdbId: null } }),
    // no hangul
    prisma.artist.count({ where: { ...active, nameHangul: null } }),
    prisma.artist.count({ where: { ...active, nameHangul: null, tmdbId: { not: null }, hangulSyncAt: null } }),
    prisma.artist.count({ where: { ...active, nameHangul: null, tmdbId: { not: null }, hangulSyncAt: { not: null } } }),
    prisma.artist.count({ where: { ...active, nameHangul: null, tmdbId: null } }),
    // no photo
    prisma.artist.count({ where: { ...active, primaryImageUrl: null } }),
    prisma.artist.count({ where: { ...active, primaryImageUrl: null, tmdbId: { not: null }, photoSyncAt: null } }),
    prisma.artist.count({ where: { ...active, primaryImageUrl: null, tmdbId: { not: null }, photoSyncAt: { not: null } } }),
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
    // no social AND no tmdb — requer curadoria manual
    prisma.artist.count({ where: { ...active, socialLinksUpdatedAt: null, tmdbId: null } }),
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
    withTmdb,
    noTmdb,
    noHangul,
    noHangulPending,
    noHangulAttempted,
    noHangulNoTmdb,
    noPhoto,
    noPhotoPending,
    noPhotoAttempted,
    noPhotoNoTmdb,
    noSocialTotal: noSocialPending + noSocialAttempted,
    noSocialPending,
    noSocialAttempted,
    noSocialNoTmdb,
    withGroup,
    noGroup,
    noGroupUnsynced,
    noGroupSolo,
    koreanNoTmdb,
  })
}
