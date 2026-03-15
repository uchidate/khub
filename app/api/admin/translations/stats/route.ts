import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

// GET /api/admin/translations/stats
// Retorna totais de entidades com conteúdo traduzível vs. já traduzidas.
// Todos os counts são intersectados com o conjunto real (visível + com conteúdo),
// evitando inflação por registros CT de entidades ocultas ou sem conteúdo.
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    // Pré-busca IDs de CT por entityType (sem filtro de isHidden/bio — usados como referência)
    const [artistCtIds, groupCtIds, prodCtRows, newsCtIds] = await Promise.all([
      prisma.contentTranslation.findMany({
        where: { entityType: 'artist', field: 'bio', locale: 'pt-BR', status: { in: ['draft', 'approved'] } },
        select: { entityId: true },
      }).then(rows => rows.map(r => r.entityId)),
      prisma.contentTranslation.findMany({
        where: { entityType: 'group', field: 'bio', locale: 'pt-BR', status: { in: ['draft', 'approved'] } },
        select: { entityId: true },
      }).then(rows => rows.map(r => r.entityId)),
      prisma.contentTranslation.findMany({
        where: { entityType: 'production', field: 'synopsis', locale: 'pt-BR' },
        select: { entityId: true, status: true },
      }),
      prisma.contentTranslation.findMany({
        where: { entityType: 'news', field: 'title', locale: 'pt-BR', status: { in: ['draft', 'approved'] } },
        select: { entityId: true },
      }).then(rows => rows.map(r => r.entityId)),
    ])

    const prodCtIds = prodCtRows.map(r => r.entityId)
    const prodCtTranslatedIds = prodCtRows.filter(r => r.status === 'draft' || r.status === 'approved').map(r => r.entityId)

    const [
      artistTotal,
      // translated: intersecta com conjunto real (visível + com bio)
      artistTranslated,
      // pending: visível + com bio + sem CT + sem tmdb_pt
      artistPending,
      groupTotal,
      // translated: intersecta com conjunto real
      groupTranslated,
      productionTotal,
      productionTranslated,
      productionPending,
      productionFailed,
      productionNoSynopsis,
      newsTotal,
      newsTranslated,
      // pendentes ocultos
      artistHiddenPending,
      groupHiddenPending,
      productionHiddenPending,
      newsHiddenPending,
    ] = await Promise.all([
      prisma.artist.count({ where: { bio: { not: null }, isHidden: false } }),
      // artist translated: tem CT OU bio já em pt-BR do TMDB — apenas visíveis com bio
      prisma.artist.count({
        where: {
          bio: { not: null },
          isHidden: false,
          OR: [
            { id: { in: artistCtIds } },
            { fieldSources: { path: ['bio', 'source'], equals: 'tmdb_pt' } },
          ],
        },
      }),
      // artist pending: sem CT E sem tmdb_pt — apenas visíveis com bio
      prisma.artist.count({
        where: {
          bio: { not: null },
          isHidden: false,
          id: { notIn: artistCtIds },
          NOT: { fieldSources: { path: ['bio', 'source'], equals: 'tmdb_pt' } },
        },
      }),
      prisma.musicalGroup.count({ where: { bio: { not: null }, isHidden: false } }),
      // group translated: intersecta com visíveis com bio
      prisma.musicalGroup.count({
        where: { bio: { not: null }, isHidden: false, id: { in: groupCtIds } },
      }),
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
      prisma.news.count({ where: { isHidden: false } }),
      prisma.news.count({
        where: {
          isHidden: false,
          OR: [
            { id: { in: newsCtIds } },
            { translationStatus: 'completed' },
          ],
        },
      }),
      // pendentes ocultos: sem CT e sem tmdb_pt
      prisma.artist.count({
        where: {
          isHidden: true,
          bio: { not: null },
          id: { notIn: artistCtIds },
          NOT: { fieldSources: { path: ['bio', 'source'], equals: 'tmdb_pt' } },
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
      artist:     { total: artistTotal,     translated: artistTranslated, pending: artistPending,      hiddenPending: artistHiddenPending },
      group:      { total: groupTotal,      translated: groupTranslated,  pending: Math.max(0, groupTotal - groupTranslated), hiddenPending: groupHiddenPending },
      production: { total: productionTotal, translated: productionTranslated, pending: productionPending, failed: productionFailed, noSynopsis: productionNoSynopsis, hiddenPending: productionHiddenPending },
      news:       { total: newsTotal,       translated: newsTranslated,   pending: Math.max(0, newsTotal - newsTranslated),   hiddenPending: newsHiddenPending },
    })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
