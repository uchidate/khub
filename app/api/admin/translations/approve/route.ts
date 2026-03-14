import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const approveSchema = z.object({
  entityType: z.enum(['artist', 'group', 'production', 'news']),
  ids: z.array(z.string().min(1)).min(1),
  field: z.string().min(1),
})

/**
 * PATCH /api/admin/translations/approve
 * Marca registros ContentTranslation existentes como 'approved' (status: draft → approved).
 * Body: { entityType, ids: string[], field }
 */
export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json()
    const { entityType, ids, field } = approveSchema.parse(body)

    const result = await prisma.contentTranslation.updateMany({
      where: {
        entityType,
        entityId: { in: ids },
        field,
        locale: 'pt-BR',
        status: 'draft',
      },
      data: { status: 'approved' },
    })

    return NextResponse.json({ ok: true, updated: result.count })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: err.issues }, { status: 400 })
    }
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
