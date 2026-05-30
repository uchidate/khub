import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'

const log = createLogger('ARTIST_VISIBILITY')

/**
 * Filtro de produção publicamente visível (coreana, não-oculta, sem conteúdo adulto).
 * Produções não-coreanas já chegam com isHidden=true, então isHidden=false é suficiente.
 */
const PUBLIC_PRODUCTION_FILTER = {
  isHidden: false,
  AND: [
    { OR: [{ ageRating: null }, { ageRating: { not: '18' } }] },
    { OR: [{ isAdultContent: null }, { isAdultContent: false }] },
  ],
}

/**
 * Filtro de conteúdo sexual — motivo de ocultação permanente.
 */
const SEXUAL_CONTENT_FILTER = {
  isAdultContent: true,
  adultContentType: 'sexual',
}

/**
 * Avalia se um artista tem relevância cultural coreana independente de nacionalidade.
 *
 * Sinais FORTES (override de flaggedAsNonKorean):
 *   1. Membro de grupo K-Pop → sempre relevante (Lisa/BLACKPINK, Nichkhun/2PM, etc.)
 *   2. Tem nameHangul → atua na indústria coreana, independente de origem
 *
 * Sinal MÉDIO:
 *   3. 2+ produções coreanas visíveis → demonstra conexão com a indústria
 *
 * @returns 'strong' | 'medium' | 'none'
 */
async function koreanCultureRelevance(
  artistId: string,
): Promise<'strong' | 'medium' | 'none'> {
  // Sinal forte 1: membro de grupo K-Pop
  const hasMembership = await prisma.artistGroupMembership.findFirst({
    where: { artistId },
    select: { id: true },
  })
  if (hasMembership) return 'strong'

  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { nameHangul: true },
  })

  // Sinal forte 2: tem nome em Hangul
  if (artist?.nameHangul) return 'strong'

  // Sinal médio: 2+ produções coreanas visíveis
  const koreanProductionCount = await prisma.artistProduction.count({
    where: { artistId, production: PUBLIC_PRODUCTION_FILTER },
  })
  if (koreanProductionCount >= 2) return 'medium'

  return 'none'
}

export class ArtistVisibilityService {
  /**
   * Reavalia a visibilidade de um artista específico.
   *
   * Regras em ordem de prioridade:
   *   1. Conteúdo sexual → sempre oculto
   *   2. Membro de grupo K-Pop → sempre visível (sinal forte de relevância cultural)
   *   3. Tem nameHangul → visível se tiver produção; oculto se não tiver
   *   4. flaggedAsNonKorean=true + sem sinal forte + ≤1 produção → ocultar
   *   5. Sem produção coreana visível → ocultar
   *   6. Tem produção coreana visível → mostrar
   */
  async evaluate(artistId: string): Promise<{ changed: boolean; isHidden: boolean }> {
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: {
        isHidden: true,
        autoHidden: true,
        flaggedAsNonKorean: true,
        nameHangul: true,
      },
    })
    if (!artist) return { changed: false, isHidden: false }

    // Regra 1: conteúdo sexual → sempre oculto
    const hasSexualProduction = await prisma.artistProduction.findFirst({
      where: { artistId, production: SEXUAL_CONTENT_FILTER },
    })
    if (hasSexualProduction) {
      if (!artist.isHidden) {
        await prisma.artist.update({
          where: { id: artistId },
          data: { isHidden: true, autoHidden: true },
        })
        return { changed: true, isHidden: true }
      }
      return { changed: false, isHidden: true }
    }

    const relevance = await koreanCultureRelevance(artistId)

    // Regra 2: sinal forte (grupo K-Pop ou nameHangul) → sempre visível
    if (relevance === 'strong') {
      if (artist.isHidden && artist.autoHidden) {
        await prisma.artist.update({
          where: { id: artistId },
          data: { isHidden: false, autoHidden: false },
        })
        log.info('Auto-shown artist (strong Korean culture signal)', { artistId })
        return { changed: true, isHidden: false }
      }
      return { changed: false, isHidden: artist.isHidden }
    }

    const visibleProduction = await prisma.artistProduction.findFirst({
      where: { artistId, production: PUBLIC_PRODUCTION_FILTER },
    })

    // Regra 3: sem produção visível → ocultar
    if (!visibleProduction) {
      if (!artist.isHidden) {
        await prisma.artist.update({
          where: { id: artistId },
          data: { isHidden: true, autoHidden: true },
        })
        log.info('Auto-hidden artist (no visible productions)', { artistId })
        return { changed: true, isHidden: true }
      }
      return { changed: false, isHidden: true }
    }

    // Regra 4: flaggedAsNonKorean=true + sem sinal forte + sem sinal médio → ocultar
    // (tem uma produção, mas sem conexão real com a indústria coreana)
    if (artist.flaggedAsNonKorean && relevance === 'none') {
      if (!artist.isHidden) {
        await prisma.artist.update({
          where: { id: artistId },
          data: { isHidden: true, autoHidden: true },
        })
        log.info('Auto-hidden artist (non-Korean, no culture relevance signals)', { artistId })
        return { changed: true, isHidden: true }
      }
      return { changed: false, isHidden: artist.isHidden }
    }

    // Regra 5: tem produção visível + relevância suficiente → mostrar
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
   * Reconcilia todos os artistas em lote.
   *
   * Ordem de operações:
   *   1. Mostrar membros de grupo K-Pop ocultos automaticamente (sinal forte)
   *   2. Mostrar artistas com nameHangul + produção visível (sinal forte)
   *   3. Ocultar artistas sem produção visível (regra base)
   *   4. Ocultar artistas não-coreanos sem relevância cultural (flaggedAsNonKorean + sem sinal)
   *   5. Mostrar artistas auto-ocultos com produção visível (regra base)
   *   6. Ocultar artistas com conteúdo sexual (segurança)
   */
  async reconcileAll(limit = 500): Promise<{
    processed: number
    hidden: number
    shown: number
  }> {
    log.info(`Starting artist visibility reconciliation (limit: ${limit})`)
    let hidden = 0
    let shown = 0

    // ── 1. Mostrar: membros de grupo K-Pop auto-ocultos ──────────────────────
    const groupMembersToShow = await prisma.artist.findMany({
      where: {
        isHidden: true,
        autoHidden: true,
        memberships: { some: {} },
        NOT: {
          productions: { some: { production: SEXUAL_CONTENT_FILTER } },
        },
      },
      select: { id: true },
      take: limit,
    })
    if (groupMembersToShow.length > 0) {
      const r = await prisma.artist.updateMany({
        where: { id: { in: groupMembersToShow.map(a => a.id) } },
        data: { isHidden: false, autoHidden: false },
      })
      shown += r.count
      log.info(`Shown ${r.count} artists (K-Pop group membership)`)
    }

    // ── 2. Mostrar: nameHangul + produção visível, auto-ocultos ──────────────
    const hangulWithProductionToShow = await prisma.artist.findMany({
      where: {
        isHidden: true,
        autoHidden: true,
        nameHangul: { not: null },
        productions: { some: { production: PUBLIC_PRODUCTION_FILTER } },
        NOT: {
          productions: { some: { production: SEXUAL_CONTENT_FILTER } },
        },
      },
      select: { id: true },
      take: limit,
    })
    if (hangulWithProductionToShow.length > 0) {
      const r = await prisma.artist.updateMany({
        where: { id: { in: hangulWithProductionToShow.map(a => a.id) } },
        data: { isHidden: false, autoHidden: false },
      })
      shown += r.count
      log.info(`Shown ${r.count} artists (nameHangul + visible production)`)
    }

    // ── 3. Ocultar: sem produção visível ─────────────────────────────────────
    const noProductionToHide = await prisma.artist.findMany({
      where: {
        isHidden: false,
        productions: { none: { production: PUBLIC_PRODUCTION_FILTER } },
      },
      select: { id: true },
      take: limit,
    })
    if (noProductionToHide.length > 0) {
      const r = await prisma.artist.updateMany({
        where: {
          id: { in: noProductionToHide.map(a => a.id) },
          isHidden: false,
        },
        data: { isHidden: true, autoHidden: true },
      })
      hidden += r.count
      log.info(`Hidden ${r.count} artists (no visible productions)`)
    }

    // ── 4. Ocultar: não-coreanos sem sinais de relevância cultural ────────────
    // flaggedAsNonKorean=true + sem nameHangul + sem grupo K-Pop + ≤1 produção visível
    const irrelevantToHide = await prisma.artist.findMany({
      where: {
        isHidden: false,
        flaggedAsNonKorean: true,
        nameHangul: null,
        memberships: { none: {} },
        // Sem 2+ produções visíveis (none = 0 produções; 1 produção pega-se pela avaliação individual)
        productions: { none: { production: PUBLIC_PRODUCTION_FILTER } },
      },
      select: { id: true },
      take: limit,
    })
    if (irrelevantToHide.length > 0) {
      const r = await prisma.artist.updateMany({
        where: {
          id: { in: irrelevantToHide.map(a => a.id) },
          isHidden: false,
        },
        data: { isHidden: true, autoHidden: true },
      })
      hidden += r.count
      log.info(`Hidden ${r.count} artists (non-Korean, no culture relevance)`)
    }

    // ── 5. Mostrar: auto-ocultos com produção visível (regra base) ────────────
    const productionToShow = await prisma.artist.findMany({
      where: {
        isHidden: true,
        autoHidden: true,
        productions: { some: { production: PUBLIC_PRODUCTION_FILTER } },
        NOT: {
          productions: { some: { production: SEXUAL_CONTENT_FILTER } },
        },
        // Não mostrar não-coreanos sem sinal de relevância
        OR: [
          { flaggedAsNonKorean: false },
          { nameHangul: { not: null } },
          { memberships: { some: {} } },
        ],
      },
      select: { id: true },
      take: limit,
    })
    if (productionToShow.length > 0) {
      const r = await prisma.artist.updateMany({
        where: { id: { in: productionToShow.map(a => a.id) } },
        data: { isHidden: false, autoHidden: false },
      })
      shown += r.count
      log.info(`Shown ${r.count} artists (visible Korean production)`)
    }

    // ── 6. Ocultar: conteúdo sexual (segurança) ──────────────────────────────
    const sexualToHide = await prisma.artist.findMany({
      where: {
        isHidden: false,
        productions: { some: { production: SEXUAL_CONTENT_FILTER } },
      },
      select: { id: true },
      take: limit,
    })
    if (sexualToHide.length > 0) {
      const r = await prisma.artist.updateMany({
        where: { id: { in: sexualToHide.map(a => a.id) } },
        data: { isHidden: true, autoHidden: true },
      })
      hidden += r.count
      log.info(`Hidden ${r.count} artists (sexual content)`)
    }

    // ── 7. Ocultar: não-coreanos com ≤1 produção coreana visível ─────────────
    // Prisma não suporta count em WHERE — usa raw SQL.
    // Captura o gray area: ator estrangeiro que apareceu em 1 produção coreana
    // como papel secundário, sem nenhum sinal de vínculo real com a indústria.
    type IdRow = { id: string }
    const lowProductionToHide = await prisma.$queryRaw<IdRow[]>`
      SELECT a.id
      FROM "Artist" a
      WHERE a."isHidden" = false
        AND a."flaggedAsNonKorean" = true
        AND a."nameHangul" IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM "ArtistGroupMembership" m WHERE m."artistId" = a.id
        )
        AND (
          SELECT COUNT(*)
          FROM "ArtistProduction" ap
          JOIN "Production" p ON p.id = ap."productionId"
          WHERE ap."artistId" = a.id
            AND p."isHidden" = false
            AND (p."ageRating" IS NULL OR p."ageRating" != '18')
            AND (p."isAdultContent" IS NULL OR p."isAdultContent" = false)
        ) <= 1
      LIMIT ${limit}
    `
    if (lowProductionToHide.length > 0) {
      const r = await prisma.artist.updateMany({
        where: {
          id: { in: lowProductionToHide.map(a => a.id) },
          isHidden: false,
        },
        data: { isHidden: true, autoHidden: true },
      })
      hidden += r.count
      log.info(`Hidden ${r.count} artists (non-Korean, ≤1 Korean production)`)
    }

    const processed =
      groupMembersToShow.length +
      hangulWithProductionToShow.length +
      noProductionToHide.length +
      irrelevantToHide.length +
      productionToShow.length +
      sexualToHide.length +
      lowProductionToHide.length

    log.info(`Reconciliation complete: ${processed} evaluated, ${hidden} hidden, ${shown} shown`)
    return { processed, hidden, shown }
  }
}

let instance: ArtistVisibilityService | null = null

export function getArtistVisibilityService(): ArtistVisibilityService {
  if (!instance) instance = new ArtistVisibilityService()
  return instance
}
