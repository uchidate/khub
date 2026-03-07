import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'

export async function PATCH(req: NextRequest, props: { params: Promise<{ kpoppingIdolId: string }> }) {
  const params = await props.params;
  const { error } = await requireAdmin()
  if (error) return error

  const { kpoppingIdolId } = params
  const body = await req.json()
  const { action } = body

  try {
    if (action === 'confirm') {
      const { artistId } = body
      if (!artistId) {
        return NextResponse.json({ error: 'artistId é obrigatório para confirmar' }, { status: 400 })
      }

      const artist = await prisma.artist.findUnique({
        where: { id: artistId },
        select: { id: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true },
      })
      if (!artist) {
        return NextResponse.json({ error: 'Artista não encontrado' }, { status: 404 })
      }

      const { count } = await prisma.kpoppingMembershipSuggestion.updateMany({
        where: { kpoppingIdolId },
        data: { artistId, artistMatchReason: 'user_confirmed', artistMatchScore: 1.0 },
      })

      return NextResponse.json({ ok: true, updated: count, artist })
    }

    if (action === 'reject') {
      const { count } = await prisma.kpoppingMembershipSuggestion.updateMany({
        where: { kpoppingIdolId },
        data: { artistId: null, artistMatchReason: 'user_rejected', artistMatchScore: null },
      })
      return NextResponse.json({ ok: true, updated: count })
    }

    if (action === 'reset') {
      // Clear curation state back to unmatched (no original reason recoverable)
      const { count } = await prisma.kpoppingMembershipSuggestion.updateMany({
        where: {
          kpoppingIdolId,
          artistMatchReason: { in: ['user_confirmed', 'user_rejected'] },
        },
        data: { artistId: null, artistMatchReason: null, artistMatchScore: null },
      })
      return NextResponse.json({ ok: true, updated: count })
    }

    return NextResponse.json({ error: 'Ação inválida. Use: confirm, reject, reset' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
