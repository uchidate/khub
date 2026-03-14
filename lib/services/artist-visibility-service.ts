import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'

const log = createLogger('ARTIST_VISIBILITY')

/**
 * Avalia se um artista deve estar oculto ou visível com base nas suas produções.
 *
 * Regras:
 * 1. Artista com produção de conteúdo sexual adulto → sempre oculto (não pode ser mostrado)
 * 2. Artista com pelo menos uma produção visível → visível (auto-show)
 * 3. Artista sem produções OU com todas as produções ocultas → oculto (auto-hide)
 *
 * O campo `autoHidden=true` indica que o sistema ocultou o artista automaticamente.
 * Artistas ocultados manualmente pelo admin (autoHidden=false, isHidden=true) não são
 * afetados pelo auto-show.
 */
export class ArtistVisibilityService {
  /**
   * Reavalia a visibilidade de um artista específico.
   * Chame após qualquer alteração de elenco ou de visibilidade de produção.
   */
  async evaluate(artistId: string): Promise<{ changed: boolean; isHidden: boolean }> {
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { isHidden: true, autoHidden: true },
    })
    if (!artist) return { changed: false, isHidden: false }

    // Verificar se tem produção com conteúdo adulto sexual → ocultar permanentemente
    const hasSexualProduction = await prisma.artistProduction.findFirst({
      where: {
        artistId,
        production: { isAdultContent: true, adultContentType: 'sexual' },
      },
    })

    if (hasSexualProduction) {
      // Se ainda não está oculto, ocultar agora
      if (!artist.isHidden) {
        await prisma.artist.update({
          where: { id: artistId },
          data: { isHidden: true, autoHidden: true },
        })
        log.info('Auto-hidden artist (restricted content)', { artistId })
        return { changed: true, isHidden: true }
      }
      // Já oculto — garantir que autoHidden reflete o motivo se ainda não estiver
      if (!artist.autoHidden) {
        await prisma.artist.update({ where: { id: artistId }, data: { autoHidden: true } })
      }
      return { changed: false, isHidden: true }
    }

    // Verificar se tem pelo menos uma produção visível
    const visibleProduction = await prisma.artistProduction.findFirst({
      where: {
        artistId,
        production: { isHidden: false },
      },
    })

    if (visibleProduction) {
      // Tem produção visível — mostrar artista (apenas se estava auto-oculto)
      if (artist.isHidden && artist.autoHidden) {
        await prisma.artist.update({
          where: { id: artistId },
          data: { isHidden: false, autoHidden: false },
        })
        log.info('Auto-shown artist (has visible production)', { artistId })
        return { changed: true, isHidden: false }
      }
      return { changed: false, isHidden: artist.isHidden }
    }

    // Sem produções visíveis — ocultar (apenas se estava visível)
    if (!artist.isHidden) {
      await prisma.artist.update({
        where: { id: artistId },
        data: { isHidden: true, autoHidden: true },
      })
      log.info('Auto-hidden artist (no visible productions)', { artistId })
      return { changed: true, isHidden: true }
    }

    return { changed: false, isHidden: artist.isHidden }
  }

  /**
   * Reavalia múltiplos artistas de uma vez.
   * Retorna contagem de alterações.
   */
  async evaluateMany(artistIds: string[]): Promise<{ hidden: number; shown: number }> {
    let hidden = 0
    let shown = 0
    for (const artistId of artistIds) {
      const { changed, isHidden } = await this.evaluate(artistId)
      if (changed) {
        if (isHidden) hidden++
        else shown++
      }
    }
    return { hidden, shown }
  }

  /**
   * Reconcilia TODOS os artistas em lote.
   * Usado pelo cron de manutenção.
   */
  async reconcileAll(limit = 500): Promise<{
    processed: number
    hidden: number
    shown: number
  }> {
    log.info(`Starting artist visibility reconciliation (limit: ${limit})`)

    // Candidatos a ocultar: visíveis, sem produção visível
    const toHide = await prisma.artist.findMany({
      where: {
        isHidden: false,
        productions: {
          none: { production: { isHidden: false } },
        },
      },
      select: { id: true },
      take: limit,
    })

    // Candidatos a mostrar: auto-ocultos, com produção visível, sem conteúdo sexual
    const toShow = await prisma.artist.findMany({
      where: {
        isHidden: true,
        autoHidden: true,
        productions: {
          some: { production: { isHidden: false } },
        },
        NOT: {
          productions: {
            some: {
              production: { isAdultContent: true, adultContentType: 'sexual' },
            },
          },
        },
      },
      select: { id: true },
      take: limit,
    })

    let hidden = 0
    let shown = 0

    if (toHide.length > 0) {
      const result = await prisma.artist.updateMany({
        where: {
          id: { in: toHide.map(a => a.id) },
          isHidden: false,
        },
        data: { isHidden: true, autoHidden: true },
      })
      hidden = result.count
      log.info(`Reconciliation: hidden ${hidden} artists`)
    }

    if (toShow.length > 0) {
      const result = await prisma.artist.updateMany({
        where: {
          id: { in: toShow.map(a => a.id) },
          isHidden: true,
          autoHidden: true,
        },
        data: { isHidden: false, autoHidden: false },
      })
      shown = result.count
      log.info(`Reconciliation: shown ${shown} artists`)
    }

    // Artistas com conteúdo sexual que ainda estão visíveis
    const restrictedToHide = await prisma.artist.findMany({
      where: {
        isHidden: false,
        productions: {
          some: {
            production: { isAdultContent: true, adultContentType: 'sexual' },
          },
        },
      },
      select: { id: true },
      take: limit,
    })

    if (restrictedToHide.length > 0) {
      const result = await prisma.artist.updateMany({
        where: { id: { in: restrictedToHide.map(a => a.id) } },
        data: { isHidden: true, autoHidden: true },
      })
      hidden += result.count
      log.info(`Reconciliation: hidden ${result.count} artists (restricted content)`)
    }

    const processed = toHide.length + toShow.length + restrictedToHide.length
    log.info(`Reconciliation complete: ${processed} evaluated, ${hidden} hidden, ${shown} shown`)
    return { processed, hidden, shown }
  }
}

let instance: ArtistVisibilityService | null = null

export function getArtistVisibilityService(): ArtistVisibilityService {
  if (!instance) instance = new ArtistVisibilityService()
  return instance
}
