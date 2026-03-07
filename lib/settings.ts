import prisma from '@/lib/prisma'
import { unstable_cache } from 'next/cache'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'

const DEFAULT_SETTINGS = {
  id: 'singleton',
  allowAdultContent: false,
  allowUnclassifiedContent: false,
  betaMode: false,
  premiumEnabled: false,
  createdAt: new Date(0),
  updatedAt: new Date(0),
}

/**
 * Retorna as configurações globais do sistema com cache de 5 minutos.
 * Cria o singleton com defaults se ainda não existir.
 * Retorna defaults seguros se o banco estiver indisponível (ex: durante build).
 */
export const getSystemSettings = unstable_cache(
  async () => {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return DEFAULT_SETTINGS
    try {
      let settings = await prisma.systemSettings.findUnique({ where: { id: 'singleton' } })
      if (!settings) {
        settings = await prisma.systemSettings.create({
          data: {
            id: 'singleton',
            allowAdultContent: false,
            allowUnclassifiedContent: false,
            betaMode: true,
            premiumEnabled: false,
          },
        })
      }
      return settings
    } catch {
      return DEFAULT_SETTINGS
    }
  },
  ['system-settings'],
  { revalidate: 300, tags: ['system-settings'] }
)
