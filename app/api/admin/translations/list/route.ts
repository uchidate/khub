import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

type TranslationStatus = 'pending' | 'draft' | 'approved'

/**
 * GET /api/admin/translations/list?entityType=artist&status=pending&q=&page=1&limit=30
 *
 * Retorna entidades (com conteúdo traduzível) + estado da tradução PT-BR.
 * status filter: "pending" = sem ContentTranslation | "draft" | "approved" | "" = todos
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
      const where = {
        bio: { not: null as null },
        isHidden: false,
        ...(q ? { nameRomanized: { contains: q, mode: 'insensitive' as const } } : {}),
      }
      const [artists, count] = await Promise.all([
        prisma.artist.findMany({ where, select: { id: true, nameRomanized: true }, orderBy: { nameRomanized: 'asc' }, skip, take: limit }),
        prisma.artist.count({ where }),
      ])
      items = artists.map(a => ({ id: a.id, label: a.nameRomanized, fields: ['bio'] }))
      total = count

    } else if (entityType === 'group') {
      const where = {
        bio: { not: null as null },
        isHidden: false,
        ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
      }
      const [groups, count] = await Promise.all([
        prisma.musicalGroup.findMany({ where, select: { id: true, name: true }, orderBy: { name: 'asc' }, skip, take: limit }),
        prisma.musicalGroup.count({ where }),
      ])
      items = groups.map(g => ({ id: g.id, label: g.name, fields: ['bio'] }))
      total = count

    } else if (entityType === 'production') {
      const where = {
        synopsis: { not: null as null },
        isHidden: false,
        ...(q ? { titlePt: { contains: q, mode: 'insensitive' as const } } : {}),
      }
      const [prods, count] = await Promise.all([
        prisma.production.findMany({ where, select: { id: true, titlePt: true, tagline: true }, orderBy: { titlePt: 'asc' }, skip, take: limit }),
        prisma.production.count({ where }),
      ])
      items = prods.map(p => ({ id: p.id, label: p.titlePt, fields: p.tagline ? ['synopsis', 'tagline'] : ['synopsis'] }))
      total = count

    } else if (entityType === 'news') {
      const where = {
        translationStatus: 'completed',
        ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}),
      }
      const [newsList, count] = await Promise.all([
        prisma.news.findMany({ where, select: { id: true, title: true, originalTitle: true }, orderBy: { publishedAt: 'desc' }, skip, take: limit }),
        prisma.news.count({ where }),
      ])
      items = newsList.map(n => ({ id: n.id, label: n.originalTitle ?? n.title, fields: ['title', 'contentMd'] }))
      total = count
    }

    // Busca traduções existentes para os ids retornados
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
      // Status geral: se todos approved → approved; se algum draft → draft; senão pending
      const overallStatus: TranslationStatus = fieldStatuses.every(s => s === 'approved')
        ? 'approved'
        : fieldStatuses.some(s => s === 'draft' || s === 'approved')
          ? 'draft'
          : 'pending'
      return { ...item, status: overallStatus, fieldStatuses: Object.fromEntries(item.fields.map((f, i) => [f, fieldStatuses[i]])) }
    })

    // Filtra por status se necessário
    const filtered = statusFilter
      ? enriched.filter(i => i.status === statusFilter)
      : enriched

    return NextResponse.json({
      items: filtered,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
