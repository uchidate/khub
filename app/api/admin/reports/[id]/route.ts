import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { logAudit } from '@/lib/services/audit-service'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  status: z.enum(['REVIEWED', 'RESOLVED', 'DISMISSED']),
})

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json()
    const { status } = patchSchema.parse(body)

    const report = await prisma.report.update({
      where: { id: params.id },
      data:  { status },
    })

    await logAudit({ adminId: session!.user.id, action: status === 'DISMISSED' ? 'REJECT' : 'APPROVE', entity: 'Report', entityId: params.id, details: `Status → ${status}` })
    return NextResponse.json(report)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }
    console.error('Failed to update report:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
