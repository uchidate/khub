import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/kpopping/backfill-memberships
 *
 * Para cada sugestão APPROVED com artistId + musicalGroupId:
 * 1. Garante que o ArtistGroupMembership existe
 * 2. Enriquece o perfil do artista com dados do kpopping (apenas campos nulos)
 *    — birthDate, height, bloodType, primaryImageUrl
 */
export async function POST() {
  const { error } = await requireAdmin()
  if (error) return error

  const approved = await prisma.kpoppingMembershipSuggestion.findMany({
    where: {
      status: 'APPROVED',
      artistId: { not: null },
      musicalGroupId: { not: null },
    },
    select: {
      id: true,
      artistId: true,
      musicalGroupId: true,
      idolPosition: true,
      idolIsActive: true,
      idolBirthday: true,
      idolHeight: true,
      idolBloodType: true,
      idolImageUrl: true,
    },
  })

  let membershipsCreated = 0
  let membershipsExisted = 0
  let artistsEnriched = 0
  let errors = 0

  for (const s of approved) {
    if (!s.artistId || !s.musicalGroupId) continue
    try {
      // 1. Garantir membership
      const existing = await prisma.artistGroupMembership.findUnique({
        where: { artistId_groupId: { artistId: s.artistId, groupId: s.musicalGroupId } },
        select: { artistId: true },
      })

      if (existing) {
        membershipsExisted++
      } else {
        await prisma.artistGroupMembership.create({
          data: {
            artistId: s.artistId,
            groupId: s.musicalGroupId,
            isActive: s.idolIsActive ?? true,
            role: s.idolPosition ?? null,
          },
        })
        membershipsCreated++
      }

      // 2. Enriquecer perfil do artista (apenas campos nulos)
      const artist = await prisma.artist.findUnique({
        where: { id: s.artistId },
        select: { birthDate: true, height: true, bloodType: true, primaryImageUrl: true },
      })
      if (!artist) continue

      const enrichFields: Record<string, unknown> = {}
      if (s.idolBirthday && !artist.birthDate)   enrichFields.birthDate = s.idolBirthday
      if (s.idolHeight && !artist.height)         enrichFields.height = String(s.idolHeight)
      if (s.idolBloodType && !artist.bloodType)   enrichFields.bloodType = s.idolBloodType
      if (s.idolImageUrl && !artist.primaryImageUrl) enrichFields.primaryImageUrl = s.idolImageUrl

      if (Object.keys(enrichFields).length > 0) {
        await prisma.artist.update({ where: { id: s.artistId }, data: enrichFields })
        artistsEnriched++
      }
    } catch {
      errors++
    }
  }

  return NextResponse.json({
    ok: true,
    total: approved.length,
    membershipsCreated,
    membershipsExisted,
    artistsEnriched,
    errors,
  })
}
