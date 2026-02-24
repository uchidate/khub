import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/kpopping/backfill-memberships
 *
 * Processa duas categorias de sugestões:
 * A) APPROVED com artistId + musicalGroupId — garante que o vínculo existe e enriquece artista + grupo
 * B) PENDING com artistMatchReason='user_confirmed' — cria o vínculo, enriquece artista + grupo e marca como APPROVED
 *
 * Campos só são preenchidos se estiverem nulos (nunca sobrescreve).
 */
export async function POST() {
  const { error } = await requireAdmin()
  if (error) return error

  // Busca sugestões APPROVED ou PENDING onde o idol foi confirmado pelo curador
  // e existe um musicalGroupId válido (grupo auto-matched ou user_confirmed).
  const candidates = await prisma.kpoppingMembershipSuggestion.findMany({
    where: {
      artistId: { not: null },
      musicalGroupId: { not: null },
      OR: [
        { status: 'APPROVED' },
        {
          status: 'PENDING',
          artistMatchReason: 'user_confirmed',
          // aceita qualquer grupo match (auto ou user_confirmed)
        },
      ],
    },
    select: {
      id: true,
      status: true,
      artistId: true,
      musicalGroupId: true,
      idolPosition: true,
      idolIsActive: true,
      idolBirthday: true,
      idolHeight: true,
      idolBloodType: true,
      idolImageUrl: true,
      groupNameHangul: true,
      groupImageUrl: true,
      groupDebutDate: true,
    },
  })

  let membershipsCreated = 0
  let membershipsExisted = 0
  let artistsEnriched = 0
  let groupsEnriched = 0
  let suggestionsApproved = 0
  let errors = 0

  for (const s of candidates) {
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

      // 2. Se PENDING+user_confirmed, marcar como APPROVED
      if (s.status === 'PENDING') {
        await prisma.kpoppingMembershipSuggestion.update({
          where: { id: s.id },
          data: { status: 'APPROVED', reviewedAt: new Date(), reviewNotes: '[backfill]' },
        })
        suggestionsApproved++
      }

      // 3. Enriquecer perfil do artista (apenas campos nulos)
      const [artist, group] = await Promise.all([
        prisma.artist.findUnique({
          where: { id: s.artistId },
          select: { birthDate: true, height: true, bloodType: true, primaryImageUrl: true },
        }),
        prisma.musicalGroup.findUnique({
          where: { id: s.musicalGroupId },
          select: { nameHangul: true, profileImageUrl: true, debutDate: true },
        }),
      ])
      if (!artist) continue

      const enrichFields: Record<string, unknown> = {}
      if (s.idolBirthday && !artist.birthDate)      enrichFields.birthDate = s.idolBirthday
      if (s.idolHeight && !artist.height)            enrichFields.height = String(s.idolHeight)
      if (s.idolBloodType && !artist.bloodType)      enrichFields.bloodType = s.idolBloodType
      if (s.idolImageUrl && !artist.primaryImageUrl) enrichFields.primaryImageUrl = s.idolImageUrl

      if (Object.keys(enrichFields).length > 0) {
        await prisma.artist.update({ where: { id: s.artistId }, data: enrichFields })
        artistsEnriched++
      }

      // 4. Enriquecer perfil do grupo (apenas campos nulos)
      if (group) {
        const groupEnrichFields: Record<string, unknown> = {}
        if (s.groupNameHangul && !group.nameHangul)       groupEnrichFields.nameHangul = s.groupNameHangul
        if (s.groupImageUrl && !group.profileImageUrl)    groupEnrichFields.profileImageUrl = s.groupImageUrl
        if (s.groupDebutDate && !group.debutDate)         groupEnrichFields.debutDate = s.groupDebutDate

        if (Object.keys(groupEnrichFields).length > 0) {
          await prisma.musicalGroup.update({ where: { id: s.musicalGroupId }, data: groupEnrichFields })
          groupsEnriched++
        }
      }
    } catch {
      errors++
    }
  }

  return NextResponse.json({
    ok: true,
    total: candidates.length,
    membershipsCreated,
    membershipsExisted,
    suggestionsApproved,
    artistsEnriched,
    groupsEnriched,
    errors,
  })
}
