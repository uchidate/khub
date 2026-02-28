import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'

/**
 * GET /api/admin/kpopping/groups-overview/[kpoppingGroupId]
 * Retorna os membros (idols) do grupo Kpopping, com status de correspondência HallyuHub.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { kpoppingGroupId: string } }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { kpoppingGroupId } = params

  // Um idol pode ter múltiplos registros (um por grupo). Pegar o mais representativo.
  const rows = await prisma.kpoppingMembershipSuggestion.findMany({
    where: { kpoppingGroupId },
    distinct: ['kpoppingIdolId'],
    orderBy: [
      { artistMatchScore: { sort: 'desc', nulls: 'last' } },
      { idolName: 'asc' },
    ],
    select: {
      kpoppingIdolId: true,
      idolName: true,
      idolNameHangul: true,
      idolBirthday: true,
      idolImageUrl: true,
      idolPosition: true,
      idolIsActive: true,
      artistId: true,
      artistMatchScore: true,
      artistMatchReason: true,
      artist: {
        select: { id: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true },
      },
    },
  })

  return NextResponse.json({ members: rows })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { kpoppingGroupId: string } }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { kpoppingGroupId } = params
  const body = await req.json()
  const { action } = body

  try {
    if (action === 'confirm') {
      const { musicalGroupId } = body
      if (!musicalGroupId) {
        return NextResponse.json({ error: 'musicalGroupId é obrigatório para confirmar' }, { status: 400 })
      }

      const group = await prisma.musicalGroup.findUnique({
        where: { id: musicalGroupId },
        select: { id: true, name: true, nameHangul: true, profileImageUrl: true },
      })
      if (!group) {
        return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })
      }

      const { count } = await prisma.kpoppingMembershipSuggestion.updateMany({
        where: { kpoppingGroupId },
        data: { musicalGroupId, groupMatchReason: 'user_confirmed', groupMatchScore: 1.0 },
      })

      return NextResponse.json({ ok: true, updated: count, group })
    }

    if (action === 'reject') {
      const { count } = await prisma.kpoppingMembershipSuggestion.updateMany({
        where: { kpoppingGroupId },
        data: { musicalGroupId: null, groupMatchReason: 'user_rejected', groupMatchScore: null },
      })
      return NextResponse.json({ ok: true, updated: count })
    }

    if (action === 'reset') {
      const { count } = await prisma.kpoppingMembershipSuggestion.updateMany({
        where: {
          kpoppingGroupId,
          groupMatchReason: { in: ['user_confirmed', 'user_rejected'] },
        },
        data: { musicalGroupId: null, groupMatchReason: null, groupMatchScore: null },
      })
      return NextResponse.json({ ok: true, updated: count })
    }

    return NextResponse.json({ error: 'Ação inválida. Use: confirm, reject, reset' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
