import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

const upsertSchema = z.object({
  entityType: z.enum(['artist', 'group', 'production', 'news']),
  entityId: z.string().min(1),
  field: z.string().min(1),
  locale: z.string().default('pt-BR'),
  value: z.string(),
  status: z.enum(['draft', 'approved', 'ai']).default('draft'),
})

// GET /api/admin/translations?entityType=&entityId=&locale=pt-BR
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const entityType = searchParams.get('entityType')
  const entityId = searchParams.get('entityId')
  const locale = searchParams.get('locale') ?? 'pt-BR'

  try {
    const where: Record<string, unknown> = { locale }
    if (entityType) where.entityType = entityType
    if (entityId) where.entityId = entityId

    const translations = await prisma.contentTranslation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ translations })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

// PUT /api/admin/translations — upsert + log
export async function PUT(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const changedBy = session!.user?.email ?? 'admin'

  try {
    const body = await req.json()
    const { entityType, entityId, field, locale, value, status } = upsertSchema.parse(body)

    // Lê valor anterior para o log
    const existing = await prisma.contentTranslation.findUnique({
      where: { entityType_entityId_field_locale: { entityType, entityId, field, locale } },
      select: { value: true },
    })

    const [translation] = await prisma.$transaction([
      prisma.contentTranslation.upsert({
        where: { entityType_entityId_field_locale: { entityType, entityId, field, locale } },
        create: { entityType, entityId, field, locale, value, status },
        update: { value, status },
      }),
      prisma.translationLog.create({
        data: {
          entityType,
          entityId,
          field,
          locale,
          previousValue: existing?.value ?? null,
          newValue: value,
          changedBy,
          source: 'manual',
        },
      }),
    ])

    // Invalida cache ISR das páginas públicas afetadas
    if (entityType === 'artist') {
      revalidatePath(`/artists/${entityId}`)
    } else if (entityType === 'group') {
      revalidatePath(`/groups/${entityId}`)
    } else if (entityType === 'production') {
      revalidatePath(`/productions/${entityId}`)
      // Invalida também as páginas de artistas que têm esta produção na filmografia
      const casts = await prisma.artistProduction.findMany({
        where: { productionId: entityId },
        select: { artistId: true },
      })
      casts.forEach(({ artistId }) => revalidatePath(`/artists/${artistId}`))
    }

    return NextResponse.json({ translation })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: err.issues }, { status: 400 })
    }
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
