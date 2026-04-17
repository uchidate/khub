/**
 * Age Rating Filter Utility
 *
 * Retorna um where clause Prisma para excluir conteúdo adulto nas queries de Production.
 *
 * Regra: bloquear apenas ageRating='18' e isAdultContent=true.
 * NULL é sempre permitido — são K-Dramas/filmes sem classificação do TMDB.
 *
 * Usado em:
 * - /api/productions/list
 * - /api/search, /api/search/full, /api/search/global
 * - /api/artists/[id]/filmography
 * - Home (recém adicionados, bem avaliados)
 */

import prisma from '@/lib/prisma'
import { unstable_cache } from 'next/cache'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'

export type AgeRatingWhereClause = Record<string, unknown>

const DEFAULT_SETTINGS = { allowAdultContent: false }

// Cache system settings for 5 minutes
const getCachedSystemSettings = unstable_cache(
  async () => {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return DEFAULT_SETTINGS
    try {
      const settings = await prisma.systemSettings.findUnique({ where: { id: 'singleton' } })
      return { allowAdultContent: settings?.allowAdultContent ?? false }
    } catch {
      return DEFAULT_SETTINGS
    }
  },
  ['system-settings'],
  { revalidate: 300, tags: ['system-settings'] }
)

/**
 * Retorna filtro Prisma para excluir conteúdo adulto.
 * NULL ageRating é sempre permitido (K-Dramas legítimos sem rating TMDB).
 * ageRating='18' e isAdultContent=true são sempre bloqueados (salvo allowAdultContent=true no admin).
 *
 * @param overrideRating - Filtro de rating específico selecionado pelo usuário na UI
 */
export async function applyAgeRatingFilter(
  overrideRating?: string,
): Promise<AgeRatingWhereClause> {
  const { allowAdultContent } = await getCachedSystemSettings()

  // Filtro de rating específico selecionado na UI
  if (overrideRating && overrideRating !== 'all') {
    if (overrideRating === '18' && !allowAdultContent) return { ageRating: '__BLOCKED__' }
    return { ageRating: overrideRating === 'null' ? null : overrideRating }
  }

  // Filtro padrão: bloquear apenas adulto explícito
  // AND+OR para tratar NULL corretamente (NOT(NULL)=NULL em SQL)
  if (!allowAdultContent) {
    return {
      AND: [
        { OR: [{ ageRating: null }, { ageRating: { not: '18' } }] },
        { OR: [{ isAdultContent: null }, { isAdultContent: false }] },
      ],
    }
  }

  // Admin habilitou conteúdo adulto: apenas bloquear isAdultContent sexual
  return {}
}
