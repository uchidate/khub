import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { syncSpotifyCatalogForGroup } from '@/lib/services/spotify-catalog-sync-service'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params
  const group = await prisma.musicalGroup.findUnique({ where: { id }, select: { id: true, slug: true } })
  if (!group) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })

  try {
    const result = await syncSpotifyCatalogForGroup(id)
    revalidatePath(`/groups/${group.slug ?? group.id}`)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}
