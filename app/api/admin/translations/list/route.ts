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
    let items: Record<string, unknown>[] = []
    let total = 0

    if (entityType === 'artist') {
      let idFilter = await resolveStatusIds('artist', 'bio', statusFilter)
      if (statusFilter === 'pending') {
        // Excluir também artistas com bio já em PT-BR (fieldSources.bio.source='tmdb_pt')
        const tmdbPtBioArtists = await prisma.artist.findMany({
          where: { isHidden: false, fieldSources: { path: ['bio', 'source'], equals: 'tmdb_pt' } },
          select: { id: true },
        })
        const tmdbPtIds = tmdbPtBioArtists.map(a => a.id)
        if (tmdbPtIds.length > 0) {
          const base = idFilter && 'notIn' in idFilter ? idFilter.notIn : []
          idFilter = { notIn: Array.from(new Set([...base, ...tmdbPtIds])) }
        }
      } else if (statusFilter === 'approved') {
        // Incluir também artistas com bio PT-BR do TMDB mesmo sem CT
        const tmdbPtBioArtists = await prisma.artist.findMany({
          where: { isHidden: false, fieldSources: { path: ['bio', 'source'], equals: 'tmdb_pt' } },
          select: { id: true },
        })
        const tmdbPtIds = tmdbPtBioArtists.map(a => a.id)
        if (tmdbPtIds.length > 0) {
          const base = idFilter && 'in' in idFilter ? idFilter.in : []
          idFilter = { in: Array.from(new Set([...base, ...tmdbPtIds])) }
        }
      }
      const where = {
        bio: { not: null as null },
        isHidden: false,
        ...(q ? { nameRomanized: { contains: q, mode: 'insensitive' as const } } : {}),
        ...(idFilter ? { id: idFilter } : {}),
      }
      const [artists, count] = await Promise.all([
        prisma.artist.findMany({ where, select: { id: true, nameRomanized: true, bio: true, fieldSources: true }, orderBy: { nameRomanized: 'asc' }, skip, take: limit }),
        prisma.artist.count({ where }),
      ])
      items = artists.map(a => ({
        id: a.id, label: a.nameRomanized, fields: ['bio'], snippet: a.bio?.slice(0, 220) ?? undefined,
        artistBioSource: (a.fieldSources as Record<string, { source: string }> | null)?.bio?.source ?? null,
      }))
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
        prisma.musicalGroup.findMany({ where, select: { id: true, name: true, bio: true }, orderBy: { name: 'asc' }, skip, take: limit }),
        prisma.musicalGroup.count({ where }),
      ])
      items = groups.map(g => ({ id: g.id, label: g.name, fields: ['bio'], snippet: g.bio?.slice(0, 220) ?? undefined }))
      total = count

    } else if (entityType === 'production') {
      let idFilter = await resolveStatusIds('production', 'synopsis', statusFilter)
      if (statusFilter === 'pending') {
        // Excluir também produções com sinopse já em PT-BR (synopsisSource='tmdb_pt')
        const alreadyPt = await prisma.production.findMany({
          where: { synopsisSource: 'tmdb_pt', isHidden: false },
          select: { id: true },
        })
        const excludeIds = alreadyPt.map(p => p.id)
        if (excludeIds.length > 0) {
          const base = idFilter && 'notIn' in idFilter ? idFilter.notIn : []
          idFilter = { notIn: Array.from(new Set([...base, ...excludeIds])) }
        }
      } else if (statusFilter === 'approved') {
        // Incluir também produções com synopsisSource='tmdb_pt' mesmo sem CT
        const alreadyPt = await prisma.production.findMany({
          where: { synopsisSource: 'tmdb_pt', isHidden: false },
          select: { id: true },
        })
        const extraIds = alreadyPt.map(p => p.id)
        if (extraIds.length > 0) {
          const base = idFilter && 'in' in idFilter ? idFilter.in : []
          idFilter = { in: Array.from(new Set([...base, ...extraIds])) }
        }
      }
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
        snippet: p.synopsis?.slice(0, 220) ?? undefined,
        synopsisSource: p.synopsisSource,
        hasSynopsis: !!p.synopsis,
        translationStatus: p.translationStatus,
      }))
      total = count

    } else if (entityType === 'news') {
      // News: reconcilia duas pipelines — ContentTranslation (nova) e news.translationStatus (legada)
      let idFilter: { in: string[] } | { notIn: string[] } | null = null
      let extraWhere: Record<string, unknown> = {}

      if (statusFilter === 'pending') {
        // Sem ContentTranslation E translationStatus != 'completed'
        const ctIds = await prisma.contentTranslation.findMany({
          where: { entityType: 'news', field: 'title', locale: 'pt-BR' },
          select: { entityId: true },
        })
        idFilter = { notIn: ctIds.map(t => t.entityId) }
        extraWhere = { translationStatus: { not: 'completed' as const } }
      } else if (statusFilter === 'draft') {
        // ContentTranslation status='draft' OU news.translationStatus='completed' sem CT
        const [ctDraft, ctAll] = await Promise.all([
          prisma.contentTranslation.findMany({ where: { entityType: 'news', field: 'title', locale: 'pt-BR', status: 'draft' }, select: { entityId: true } }),
          prisma.contentTranslation.findMany({ where: { entityType: 'news', field: 'title', locale: 'pt-BR' }, select: { entityId: true } }),
        ])
        const ctAllSet = new Set(ctAll.map(t => t.entityId))
        const legacy = await prisma.news.findMany({ where: { translationStatus: 'completed' }, select: { id: true } })
        const legacyIds = legacy.filter(n => !ctAllSet.has(n.id)).map(n => n.id)
        const allDraftIds = ctDraft.map(t => t.entityId).concat(legacyIds)
        idFilter = { in: Array.from(new Set(allDraftIds)) }
      } else if (statusFilter === 'approved') {
        idFilter = await resolveStatusIds('news', 'title', 'approved')
      }

      const where = {
        ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}),
        ...(idFilter ? { id: idFilter } : {}),
        ...extraWhere,
      }
      const [newsList, count] = await Promise.all([
        prisma.news.findMany({
          where,
          select: { id: true, title: true, originalTitle: true, translationStatus: true, originalContent: true, contentMd: true },
          orderBy: { publishedAt: 'desc' },
          skip, take: limit,
        }),
        prisma.news.count({ where }),
      ])
      items = newsList.map(n => ({
        id: n.id,
        label: n.originalTitle ?? n.title,
        fields: ['title', 'contentMd'],
        snippet: (n.originalContent ?? n.contentMd)?.slice(0, 220) ?? undefined,
        newsTranslationStatus: n.translationStatus,
      }))
      total = count
    }

    // Productions: enriquecer com status via ContentTranslation (como artists/groups)
    // (continua para o bloco de lookup abaixo)

    // Busca traduções existentes para os IDs retornados
    const ids = items.map(i => i.id as string)
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
      const id = item.id as string
      const fields = item.fields as string[]
      const tMap = translationMap.get(id)
      const fieldStatuses = fields.map(f => tMap?.get(f) ?? 'pending')
      // Status geral: todos approved → approved; algum draft/approved → draft; senão pending
      let overallStatus: TranslationStatus = fieldStatuses.every(s => s === 'approved')
        ? 'approved'
        : fieldStatuses.some(s => s === 'draft' || s === 'approved')
          ? 'draft'
          : 'pending'
      // Para productions: synopsisSource='tmdb_pt' = já está em PT-BR → tratar como approved
      if (overallStatus === 'pending' && (item.synopsisSource as string) === 'tmdb_pt') {
        overallStatus = 'approved'
      }
      // Para artists: fieldSources.bio.source='tmdb_pt' = bio já em PT-BR → tratar como approved
      if (overallStatus === 'pending' && (item.artistBioSource as string) === 'tmdb_pt') {
        overallStatus = 'approved'
      }
      // Para news: se newsTranslationStatus='completed' e sem ContentTranslation → tratar como draft
      const newsStatus = item.newsTranslationStatus as string | undefined
      if (overallStatus === 'pending' && newsStatus === 'completed') {
        overallStatus = 'draft'
      }
      const { newsTranslationStatus: _nts, artistBioSource: _abs, ...restItem } = item
      return {
        ...restItem,
        status: overallStatus,
        fieldStatuses: Object.fromEntries(fields.map((f, i) => [f, fieldStatuses[i]])),
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
