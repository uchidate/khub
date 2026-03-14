import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

// GET /api/admin/translations/stats
// Retorna totais de entidades com conteúdo traduzível vs. já traduzidas.
// Productions usam synopsisSource diretamente; demais entidades usam ContentTranslation.
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    // Pré-busca IDs de ContentTranslation para news (ambas as pipelines)
    const newsCtIds = await prisma.contentTranslation.findMany({
      where: { entityType: 'news', field: 'title', locale: 'pt-BR', status: { in: ['draft', 'approved'] } },
      select: { entityId: true },
    }).then(rows => rows.map(r => r.entityId))

    // Pré-busca IDs de ContentTranslation para productions (evita subquery aninhada)
    const prodCtRows = await prisma.contentTranslation.findMany({
      where: { entityType: 'production', field: 'synopsis', locale: 'pt-BR' },
      select: { entityId: true, status: true },
    })
    const prodCtIds = prodCtRows.map(r => r.entityId)
    const prodCtTranslatedIds = prodCtRows.filter(r => r.status === 'draft' || r.status === 'approved').map(r => r.entityId)

    // Pré-busca IDs de artistas com bio PT-BR via TMDB (sem CT)
    const [artistCtRows, artistTmdbPtBioRows] = await Promise.all([
      prisma.contentTranslation.findMany({
        where: { entityType: 'artist', field: 'bio', locale: 'pt-BR', status: { in: ['draft', 'approved'] } },
        select: { entityId: true },
      }),
      prisma.artist.findMany({
        where: { isHidden: false, bio: { not: null }, fieldSources: { path: ['bio', 'source'], equals: 'tmdb_pt' } },
        select: { id: true },
      }),
    ])
    const artistTranslatedIds = Array.from(new Set([
      ...artistCtRows.map(r => r.entityId),
      ...artistTmdbPtBioRows.map(r => r.id),
    ]))

    // Pré-busca IDs de groups sem CT (para pendentes ocultos)
    const groupCtIds = await prisma.contentTranslation.findMany({
      where: { entityType: 'group', field: 'bio', locale: 'pt-BR', status: { in: ['draft', 'approved'] } },
      select: { entityId: true },
    }).then(rows => rows.map(r => r.entityId))

    const [
      artistTotal,
      groupTotal,
      productionTotal,
      // traduzidas = tem CT draft/approved OU synopsisSource='tmdb_pt'
      productionTranslated,
      // pendentes = sem CT e sem tmdb_pt
      productionPending,
      productionFailed,
      productionNoSynopsis,
      newsTotal,
      groupTranslated,
      newsTranslated,
      // pendentes entre ocultos
      artistHiddenPending,
      groupHiddenPending,
      productionHiddenPending,
      newsHiddenPending,
    ] = await Promise.all([
      prisma.artist.count({ where: { bio: { not: null }, isHidden: false } }),
      prisma.musicalGroup.count({ where: { bio: { not: null }, isHidden: false } }),
      prisma.production.count({ where: { isHidden: false, synopsis: { not: null } } }),
      prisma.production.count({
        where: {
          isHidden: false, synopsis: { not: null },
          OR: [
            { synopsisSource: 'tmdb_pt' },
            { id: { in: prodCtTranslatedIds } },
          ],
        },
      }),
      prisma.production.count({
        where: {
          isHidden: false, synopsis: { not: null },
          synopsisSource: { not: 'tmdb_pt' },
          id: { notIn: prodCtIds },
        },
      }),
      prisma.production.count({ where: { isHidden: false, translationStatus: 'failed' } }),
      prisma.production.count({ where: { isHidden: false, synopsis: null } }),
      // news total: todas as notícias não ocultas
      prisma.news.count({ where: { isHidden: false } }),
      prisma.contentTranslation.count({
        where: { entityType: 'group', field: 'bio', locale: 'pt-BR', status: { in: ['draft', 'approved'] } },
      }),
      // news traduzidas: CT (nova pipeline) OU translationStatus='completed' (legada)
      prisma.news.count({
        where: {
          isHidden: false,
          OR: [
            { id: { in: newsCtIds } },
            { translationStatus: 'completed' },
          ],
        },
      }),
      // pendentes ocultos (isHidden: true sem tradução)
      prisma.artist.count({
        where: {
          isHidden: true, bio: { not: null },
          id: { notIn: artistTranslatedIds },
        },
      }),
      prisma.musicalGroup.count({
        where: { isHidden: true, bio: { not: null }, id: { notIn: groupCtIds } },
      }),
      prisma.production.count({
        where: {
          isHidden: true, synopsis: { not: null },
          synopsisSource: { not: 'tmdb_pt' },
          id: { notIn: prodCtIds },
        },
      }),
      prisma.news.count({
        where: {
          isHidden: true,
          id: { notIn: newsCtIds },
          translationStatus: { not: 'completed' },
        },
      }),
    ])

    return NextResponse.json({
      artist:     { total: artistTotal,     translated: artistTranslatedIds.length, pending: Math.max(0, artistTotal - artistTranslatedIds.length),     hiddenPending: artistHiddenPending },
      group:      { total: groupTotal,      translated: groupTranslated,      pending: Math.max(0, groupTotal - groupTranslated),      hiddenPending: groupHiddenPending },
      production: { total: productionTotal, translated: productionTranslated, pending: productionPending, failed: productionFailed, noSynopsis: productionNoSynopsis, hiddenPending: productionHiddenPending },
      news:       { total: newsTotal,       translated: newsTranslated,       pending: Math.max(0, newsTotal - newsTranslated),       hiddenPending: newsHiddenPending },
    })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
