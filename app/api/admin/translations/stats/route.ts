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
      productionPtBR,
      productionNoSynopsis,
      newsTotal,
      artistTranslated,
      groupTranslated,
      newsTranslated,
    ] = await Promise.all([
      prisma.artist.count({ where: { bio: { not: null }, isHidden: false } }),
      prisma.musicalGroup.count({ where: { bio: { not: null }, isHidden: false } }),
      // productions: total visíveis
      prisma.production.count({ where: { isHidden: false } }),
      // productions com sinopse em pt-BR
      prisma.production.count({ where: { isHidden: false, synopsisSource: 'tmdb_pt' } }),
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
      production: { total: productionTotal, translated: productionPtBR, noSynopsis: productionNoSynopsis },
      news:       { total: newsTotal,       translated: newsTranslated },
    })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
