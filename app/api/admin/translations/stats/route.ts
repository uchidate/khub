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
    const [
      artistTotal,
      groupTotal,
      productionTotal,
      productionTranslated,
      productionPending,
      productionFailed,
      productionNoSynopsis,
      newsTotal,
      artistTranslated,
      groupTranslated,
      newsTranslated,
    ] = await Promise.all([
      prisma.artist.count({ where: { bio: { not: null }, isHidden: false } }),
      prisma.musicalGroup.count({ where: { bio: { not: null }, isHidden: false } }),
      // productions: total visíveis com sinopse
      prisma.production.count({ where: { isHidden: false, synopsis: { not: null } } }),
      // productions com tradução PT-BR via ContentTranslation
      prisma.contentTranslation.count({
        where: { entityType: 'production', field: 'synopsis', locale: 'pt-BR', status: { in: ['draft', 'approved'] } },
      }),
      // productions com sinopse ainda pendente de tradução
      prisma.production.count({ where: { isHidden: false, synopsis: { not: null }, translationStatus: 'pending' } }),
      // productions com falha na tradução
      prisma.production.count({ where: { isHidden: false, translationStatus: 'failed' } }),
      // productions sem sinopse
      prisma.production.count({ where: { isHidden: false, synopsis: null } }),
      prisma.news.count({ where: { translationStatus: 'completed' } }),

      prisma.contentTranslation.count({
        where: { entityType: 'artist', field: 'bio', locale: 'pt-BR', status: { in: ['draft', 'approved'] } },
      }),
      prisma.contentTranslation.count({
        where: { entityType: 'group', field: 'bio', locale: 'pt-BR', status: { in: ['draft', 'approved'] } },
      }),
      prisma.contentTranslation.count({
        where: { entityType: 'news', field: 'title', locale: 'pt-BR', status: { in: ['draft', 'approved'] } },
      }),
    ])

    return NextResponse.json({
      artist:     { total: artistTotal,     translated: artistTranslated },
      group:      { total: groupTotal,      translated: groupTranslated },
      production: { total: productionTotal, translated: productionTranslated, pending: productionPending, failed: productionFailed, noSynopsis: productionNoSynopsis },
      news:       { total: newsTotal,       translated: newsTranslated },
    })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
