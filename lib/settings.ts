import prisma from '@/lib/prisma'
import { unstable_cache } from 'next/cache'

/**
 * Retorna as configurações globais do sistema com cache de 5 minutos.
 * Cria o singleton com defaults se ainda não existir.
 */
export const getSystemSettings = unstable_cache(
  async () => {
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
  },
  ['system-settings'],
  { revalidate: 300, tags: ['system-settings'] }
)
