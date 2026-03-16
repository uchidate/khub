import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-helpers'
import { getProductionTakedownService } from '@/lib/services/production-takedown-service'
import { revalidatePath } from 'next/cache'

const restoreSchema = z.object({
  restoredReason: z.string().min(10, 'Mínimo 10 caracteres').max(5000),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const parsed = restoreSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  try {
    const takedown = await getProductionTakedownService().restore(id, session!.user.id, parsed.data.restoredReason)
    revalidatePath(`/productions/${id}`)
    revalidatePath('/admin/productions')
    return NextResponse.json(takedown)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao restaurar produção'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
