import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const reportSchema = z.object({
  entityType: z.enum(['artist', 'production', 'group']),
  entityId:   z.string().min(1).max(100),
  entityName: z.string().min(1).max(200),
  category:   z.enum(['wrong_info', 'wrong_image', 'duplicate', 'missing_info', 'other']),
  description: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = reportSchema.parse(body)

    const report = await prisma.report.create({
      data: {
        entityType:  data.entityType,
        entityId:    data.entityId,
        entityName:  data.entityName,
        category:    data.category,
        description: data.description ?? null,
        status:      'PENDING',
      },
    })

    return NextResponse.json({ ok: true, id: report.id }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: err.issues }, { status: 400 })
    }
    console.error('Failed to create report:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
