import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getErrorMessage } from '@/lib/utils/error'
import { createLogger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

const log = createLogger('ADMIN-KPOPPING')

const approveSchema = z.object({
  action: z.literal('approve'),
  artistId: z.string().min(1),
  musicalGroupId: z.string().min(1),
  role: z.string().optional(),
  isActive: z.boolean().default(true),
  joinDate: z.string().nullable().optional(),
  leaveDate: z.string().nullable().optional(),
  notes: z.string().optional(),
})

const rejectSchema = z.object({
  action: z.literal('reject'),
  notes: z.string().optional(),
})

const revokeSchema = z.object({
  action: z.literal('revoke'),
  notes: z.string().optional(),
})

const bodySchema = z.discriminatedUnion('action', [approveSchema, rejectSchema, revokeSchema])

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = params

  try {
    const body = await req.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const suggestion = await prisma.kpoppingMembershipSuggestion.findUnique({
      where: { id },
    })
    if (!suggestion) {
      return NextResponse.json({ error: 'Sugestão não encontrada' }, { status: 404 })
    }

    const { action } = parsed.data

    // ── APROVAR ──────────────────────────────────────────────────────────────
    if (action === 'approve') {
      const { artistId, musicalGroupId, role, isActive, joinDate, leaveDate, notes } = parsed.data

      // Garante que artista e grupo existem
      const [artist, group] = await Promise.all([
        prisma.artist.findUnique({ where: { id: artistId }, select: { id: true, nameRomanized: true } }),
        prisma.musicalGroup.findUnique({ where: { id: musicalGroupId }, select: { id: true, name: true } }),
      ])
      if (!artist) return NextResponse.json({ error: 'Artista não encontrado' }, { status: 404 })
      if (!group) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })

      // Cria ou atualiza o vínculo
      await prisma.artistGroupMembership.upsert({
        where: { artistId_groupId: { artistId, groupId: musicalGroupId } },
        create: {
          artistId,
          groupId: musicalGroupId,
          isActive,
          role: role ?? suggestion.idolPosition ?? null,
          joinDate: joinDate ? new Date(joinDate) : null,
          leaveDate: leaveDate ? new Date(leaveDate) : null,
        },
        update: {
          isActive,
          role: role ?? suggestion.idolPosition ?? undefined,
          joinDate: joinDate ? new Date(joinDate) : undefined,
          leaveDate: leaveDate ? new Date(leaveDate) : undefined,
        },
      })

      // Atualiza a sugestão
      const updated = await prisma.kpoppingMembershipSuggestion.update({
        where: { id },
        data: {
          status: 'APPROVED',
          artistId,
          musicalGroupId,
          reviewedAt: new Date(),
          reviewNotes: notes ?? null,
        },
      })

      log.info(`Sugestão aprovada: ${artist.nameRomanized} → ${group.name}`)
      return NextResponse.json(updated)
    }

    // ── REJEITAR ─────────────────────────────────────────────────────────────
    if (action === 'reject') {
      const { notes } = parsed.data

      const updated = await prisma.kpoppingMembershipSuggestion.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewNotes: notes ?? null,
        },
      })

      log.info(`Sugestão rejeitada: ${suggestion.idolName} / ${suggestion.groupName}`)
      return NextResponse.json(updated)
    }

    // ── REVOGAR (desfazer aprovação) ──────────────────────────────────────────
    if (action === 'revoke') {
      const { notes } = parsed.data

      if (suggestion.status !== 'APPROVED') {
        return NextResponse.json({ error: 'Apenas sugestões aprovadas podem ser revogadas' }, { status: 400 })
      }

      // Remove o vínculo ArtistGroupMembership (se ainda existir e vier dessa sugestão)
      if (suggestion.artistId && suggestion.musicalGroupId) {
        await prisma.artistGroupMembership.deleteMany({
          where: {
            artistId: suggestion.artistId,
            groupId: suggestion.musicalGroupId,
          },
        })
      }

      // Volta para PENDING para re-análise
      const updated = await prisma.kpoppingMembershipSuggestion.update({
        where: { id },
        data: {
          status: 'PENDING',
          reviewedAt: null,
          reviewNotes: notes ? `[Revogado] ${notes}` : '[Revogado]',
        },
      })

      log.info(`Sugestão revogada: ${suggestion.idolName} / ${suggestion.groupName}`)
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
