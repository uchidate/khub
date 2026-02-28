import prisma from '@/lib/prisma'

/**
 * Busca uma tradução para um campo específico de uma entidade.
 * Retorna null se não houver tradução (approved ou draft) — o caller usa o campo original.
 */
export async function getTranslation(
  entityType: string,
  entityId: string,
  field: string,
  locale = 'pt-BR'
): Promise<string | null> {
  const t = await prisma.contentTranslation.findUnique({
    where: { entityType_entityId_field_locale: { entityType, entityId, field, locale } },
    select: { value: true, status: true },
  })
  if (!t || t.status === 'ai') return null
  return t.value
}

/**
 * Busca traduções em batch para múltiplas entidades do mesmo tipo.
 * Retorna Map<entityId, Map<field, value>>.
 */
export async function getTranslations(
  entityType: string,
  entityIds: string[],
  fields: string[],
  locale = 'pt-BR'
): Promise<Map<string, Map<string, string>>> {
  if (entityIds.length === 0) return new Map()

  const rows = await prisma.contentTranslation.findMany({
    where: {
      entityType,
      entityId: { in: entityIds },
      field: { in: fields },
      locale,
      status: { in: ['draft', 'approved'] },
    },
    select: { entityId: true, field: true, value: true },
  })

  const result = new Map<string, Map<string, string>>()
  for (const row of rows) {
    if (!result.has(row.entityId)) result.set(row.entityId, new Map())
    result.get(row.entityId)!.set(row.field, row.value)
  }
  return result
}
