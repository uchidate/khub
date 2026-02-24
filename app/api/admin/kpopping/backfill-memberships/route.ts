import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/kpopping/backfill-memberships
 *
 * Percorre todas as sugestões APPROVED com artistId + musicalGroupId definidos
 * e garante que o ArtistGroupMembership correspondente exista.
 * Útil para corrigir sugestões aprovadas antes do fix do data.ok → res.ok.
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
    },
  })

  let created = 0
  let alreadyExisted = 0
  let errors = 0

  for (const s of approved) {
    if (!s.artistId || !s.musicalGroupId) continue
    try {
      const existing = await prisma.artistGroupMembership.findUnique({
        where: { artistId_groupId: { artistId: s.artistId, groupId: s.musicalGroupId } },
        select: { artistId: true },
      })

      if (existing) {
        alreadyExisted++
      } else {
        await prisma.artistGroupMembership.create({
          data: {
            artistId: s.artistId,
            groupId: s.musicalGroupId,
            isActive: s.idolIsActive ?? true,
            role: s.idolPosition ?? null,
          },
        })
        created++
      }
    } catch {
      errors++
    }
  }

  return NextResponse.json({
    ok: true,
    total: approved.length,
    created,
    alreadyExisted,
    errors,
  })
}
