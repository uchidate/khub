import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-helpers'
import { getProductionTakedownService } from '@/lib/services/production-takedown-service'
import { revalidatePath } from 'next/cache'

const takedownSchema = z.object({
  reason: z.enum(['DMCA', 'COPYRIGHT', 'LEGAL_NOTICE', 'MANUAL']),
  noticeReference: z.string().max(500).optional(),
  noticeDate: z.string().datetime().optional(),
  notes: z.string().max(5000).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const parsed = takedownSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  try {
    const takedown = await getProductionTakedownService().issueTakedown(id, session!.user.id, {
      ...parsed.data,
      noticeDate: parsed.data.noticeDate ? new Date(parsed.data.noticeDate) : undefined,
    })
    revalidatePath(`/productions/${id}`)
    revalidatePath('/admin/productions')
    return NextResponse.json(takedown, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao emitir takedown'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const history = await getProductionTakedownService().getHistory(id)
  return NextResponse.json(history)
}
