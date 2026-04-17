import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getArtistVisibilityService } from './artist-visibility-service'
import type { TakedownReason } from '@prisma/client'

const log = createLogger('PRODUCTION_TAKEDOWN')

export interface IssueTakedownParams {
  reason: TakedownReason
  noticeReference?: string
  noticeDate?: Date
  notes?: string
}

export class ProductionTakedownService {
  async issueTakedown(
    productionId: string,
    adminId: string,
    params: IssueTakedownParams,
  ) {
    const production = await prisma.production.findUnique({
      where: { id: productionId },
      select: { id: true, isTakenDown: true, titlePt: true },
    })
    if (!production) throw new Error('Produção não encontrada')
    if (production.isTakenDown) throw new Error('Já existe um takedown ativo para esta produção')

    const takedown = await prisma.$transaction(async tx => {
      const record = await tx.productionTakedown.create({
        data: {
          productionId,
          reason: params.reason,
          noticeReference: params.noticeReference,
          noticeDate: params.noticeDate,
          notes: params.notes,
          hiddenById: adminId,
        },
      })
      await tx.production.update({
        where: { id: productionId },
        data: { isHidden: true, isTakenDown: true },
      })
      return record
    })

    log.info('Production taken down', { productionId, reason: params.reason, adminId })

    // Cascade: reavaliar visibilidade dos artistas relacionados (fire-and-forget)
    const links = await prisma.artistProduction.findMany({
      where: { productionId },
      select: { artistId: true },
    })
    if (links.length > 0) {
      void getArtistVisibilityService()
        .evaluateMany(links.map(l => l.artistId))
        .catch(err => log.error('Error cascading artist visibility after takedown', { error: err }))
    }

    return takedown
  }

  async restore(
    productionId: string,
    adminId: string,
    restoredReason: string,
  ) {
    const activeTakedown = await prisma.productionTakedown.findFirst({
      where: { productionId, isActive: true },
    })
    if (!activeTakedown) throw new Error('Não há takedown ativo para esta produção')

    const takedown = await prisma.$transaction(async tx => {
      const updated = await tx.productionTakedown.update({
        where: { id: activeTakedown.id },
        data: {
          isActive: false,
          restoredById: adminId,
          restoredAt: new Date(),
          restoredReason,
        },
      })
      await tx.production.update({
        where: { id: productionId },
        data: { isHidden: false, isTakenDown: false },
      })
      return updated
    })

    log.info('Production restored from takedown', { productionId, adminId })

    // Cascade: reavaliar artistas
    const links = await prisma.artistProduction.findMany({
      where: { productionId },
      select: { artistId: true },
    })
    if (links.length > 0) {
      void getArtistVisibilityService()
        .evaluateMany(links.map(l => l.artistId))
        .catch(err => log.error('Error cascading artist visibility after restore', { error: err }))
    }

    return takedown
  }

  async getHistory(productionId: string) {
    return prisma.productionTakedown.findMany({
      where: { productionId },
      include: {
        hiddenBy: { select: { id: true, name: true, email: true } },
        restoredBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async listActiveTakedowns(page = 1, limit = 50) {
    const skip = (page - 1) * limit
    const [items, total] = await Promise.all([
      prisma.productionTakedown.findMany({
        where: { isActive: true },
        include: {
          production: { select: { id: true, titlePt: true, type: true } },
          hiddenBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { hiddenAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.productionTakedown.count({ where: { isActive: true } }),
    ])
    return { items, total, page, pages: Math.ceil(total / limit) }
  }
}

let instance: ProductionTakedownService | null = null
export function getProductionTakedownService() {
  if (!instance) instance = new ProductionTakedownService()
  return instance
}
