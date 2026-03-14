import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

type TranslationStatus = 'pending' | 'draft' | 'approved'

/**
 * Resolve IDs de entidades que batem com o filtro de status, consultando ContentTranslation.
 * - 'pending'  → IDs que NÃO possuem registro pt-BR para o campo primário
 * - 'draft'    → IDs com status='draft'
 * - 'approved' → IDs com status='approved'
 * - ''         → sem filtro (retorna null)
 */
async function resolveStatusIds(
  entityType: string,
  primaryField: string,
  statusFilter: TranslationStatus | '' | null,
): Promise<{ in: string[] } | { notIn: string[] } | null> {
  if (!statusFilter) return null

  const existing = await prisma.contentTranslation.findMany({
    where: {
      entityType,
      field: primaryField,
      locale: 'pt-BR',
      ...(statusFilter !== 'pending' ? { status: statusFilter } : {}),
    },
    select: { entityId: true },
  })
  const ids = existing.map(t => t.entityId)
  return statusFilter === 'pending' ? { notIn: ids } : { in: ids }
}

/**
 * GET /api/admin/translations/list?entityType=artist&status=pending&q=&page=1&limit=30
 *
 * Retorna entidades com conteúdo traduzível + estado da tradução PT-BR.
 * status filter: "pending" = sem ContentTranslation | "draft" | "approved" | "" = todos
 * Paginação e filtragem acontecem no banco de dados (sem filtro em memória).
 */
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const entityType = searchParams.get('entityType') ?? 'artist'
  const statusFilter = searchParams.get('status') as TranslationStatus | '' | null
  const q = searchParams.get('q')?.trim() ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '30')))
  const skip = (page - 1) * limit

  try {
    let items: { id: string; label: string; fields: string[] }[] = []
    let total = 0

    if (entityType === 'artist') {
      const idFilter = await resolveStatusIds('artist', 'bio', statusFilter)
      const where = {
        bio: { not: null as null },
        isHidden: false,
        ...(q ? { nameRomanized: { contains: q, mode: 'insensitive' as const } } : {}),
        ...(idFilter ? { id: idFilter } : {}),
      }
      const [artists, count] = await Promise.all([
        prisma.artist.findMany({ where, select: { id: true, nameRomanized: true }, orderBy: { nameRomanized: 'asc' }, skip, take: limit }),
        prisma.artist.count({ where }),
      ])
      items = artists.map(a => ({ id: a.id, label: a.nameRomanized, fields: ['bio'] }))
      total = count

    } else if (entityType === 'group') {
      const idFilter = await resolveStatusIds('group', 'bio', statusFilter)
      const where = {
        bio: { not: null as null },
        isHidden: false,
        ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
        ...(idFilter ? { id: idFilter } : {}),
      }
      const [groups, count] = await Promise.all([
        prisma.musicalGroup.findMany({ where, select: { id: true, name: true }, orderBy: { name: 'asc' }, skip, take: limit }),
        prisma.musicalGroup.count({ where }),
      ])
      items = groups.map(g => ({ id: g.id, label: g.name, fields: ['bio'] }))
      total = count

    } else if (entityType === 'production') {
      // Productions: status via translationStatus + ContentTranslation
      const idFilter = await resolveStatusIds('production', 'synopsis', statusFilter)
      const where = {
        isHidden: false,
        synopsis: { not: null as null },
        ...(q ? {
          OR: [
            { titlePt: { contains: q, mode: 'insensitive' as const } },
            { titleKr: { contains: q, mode: 'insensitive' as const } },
          ],
        } : {}),
        ...(idFilter ? { id: idFilter } : {}),
      }
      const [prods, count] = await Promise.all([
        prisma.production.findMany({
          where,
          select: { id: true, titlePt: true, titleKr: true, synopsis: true, synopsisSource: true, translationStatus: true },
          orderBy: [{ year: 'desc' }, { titlePt: 'asc' }],
          skip,
          take: limit,
        }),
        prisma.production.count({ where }),
      ])
      items = prods.map(p => ({
        id: p.id,
        label: p.titlePt,
        subtitle: p.titleKr ?? undefined,
        fields: ['synopsis'],
        synopsisSource: p.synopsisSource,
        hasSynopsis: !!p.synopsis,
        translationStatus: p.translationStatus,
      }))
      total = count

    } else if (entityType === 'news') {
      // News: status vem de ContentTranslation para o campo 'title'
      const idFilter = statusFilter
        ? await resolveStatusIds('news', 'title', statusFilter)
        : null
      const where = {
        ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}),
        ...(idFilter ? { id: idFilter } : {}),
      }
      const [newsList, count] = await Promise.all([
        prisma.news.findMany({ where, select: { id: true, title: true, originalTitle: true }, orderBy: { publishedAt: 'desc' }, skip, take: limit }),
        prisma.news.count({ where }),
      ])
      items = newsList.map(n => ({ id: n.id, label: n.originalTitle ?? n.title, fields: ['title', 'contentMd'] }))
      total = count
    }

    // Productions: enriquecer com status via ContentTranslation (como artists/groups)
    // (continua para o bloco de lookup abaixo)

    // Busca traduções existentes para os IDs retornados (artists, groups, news)
    const ids = items.map(i => i.id)
    const existingTranslations = ids.length > 0
      ? await prisma.contentTranslation.findMany({
          where: { entityType, entityId: { in: ids }, locale: 'pt-BR' },
          select: { entityId: true, field: true, status: true },
        })
      : []

    // Monta mapa entityId → { field → status }
    const translationMap = new Map<string, Map<string, string>>()
    for (const t of existingTranslations) {
      if (!translationMap.has(t.entityId)) translationMap.set(t.entityId, new Map())
      translationMap.get(t.entityId)!.set(t.field, t.status)
    }

    // Enriquece items com status de tradução
    const enriched = items.map(item => {
      const tMap = translationMap.get(item.id)
      const fieldStatuses = item.fields.map(f => tMap?.get(f) ?? 'pending')
      // Status geral: todos approved → approved; algum draft/approved → draft; senão pending
      const overallStatus: TranslationStatus = fieldStatuses.every(s => s === 'approved')
        ? 'approved'
        : fieldStatuses.some(s => s === 'draft' || s === 'approved')
          ? 'draft'
          : 'pending'
      return {
        ...item,
        status: overallStatus,
        fieldStatuses: Object.fromEntries(item.fields.map((f, i) => [f, fieldStatuses[i]])),
      }
    })

    return NextResponse.json({
      items: enriched,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
