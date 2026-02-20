/**
 * Age Rating Filter Utility
 *
 * Função centralizada para aplicar filtros de classificação etária em queries de Production.
 * Respeita SystemSettings (admin) e UserContentPreferences (usuário logado).
 *
 * Usado em:
 * - /api/productions/list
 * - Home (recém adicionados, bem avaliados)
 * - Grupos (produções do grupo)
 * - Qualquer outro endpoint que liste produções
 */

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export type AgeRatingWhereClause = {
  ageRating?: any
  OR?: any[]
} | Record<string, never>

/**
 * Aplica filtro de classificação etária baseado em:
 * 1. SystemSettings (limites globais definidos pelo admin)
 * 2. UserContentPreferences (preferências do usuário logado, se houver)
 * 3. Padrão seguro para visitantes não-logados (L, 10, 12, 14, 16)
 *
 * @param overrideRating - Permite override manual (ex: filtro "all" ou rating específico na UI)
 * @returns Objeto where clause do Prisma para filtrar por ageRating
 */
export async function applyAgeRatingFilter(
  overrideRating?: string
): Promise<AgeRatingWhereClause> {
  // 1. Buscar configurações globais
  let systemSettings = await prisma.systemSettings.findUnique({
    where: { id: 'singleton' },
  })

  if (!systemSettings) {
    systemSettings = await prisma.systemSettings.create({
      data: {
        id: 'singleton',
        allowAdultContent: false,
        allowUnclassifiedContent: false,
      },
    })
  }

  // 2. Override explícito via UI (ex: filtro "all" ou rating específico)
  if (overrideRating === 'all') {
    // Mostrar tudo, mas ainda respeitar limites do admin
    const where: AgeRatingWhereClause = {}

    // Filtrar 18+ se admin bloqueou
    if (!systemSettings.allowAdultContent) {
      where.ageRating = { not: '18' }
    }

    // Filtrar não classificados se admin bloqueou
    if (!systemSettings.allowUnclassifiedContent) {
      if (where.ageRating) {
        // Já tem filtro de 18+, adicionar também filtro de null
        where.ageRating = { not: null, notIn: ['18'] }
      } else {
        where.ageRating = { not: null }
      }
    }

    return where
  }

  if (overrideRating) {
    // Rating específico selecionado na UI (ex: "L", "10", "18")
    // Validar contra limites do admin
    if (overrideRating === '18' && !systemSettings.allowAdultContent) {
      // Admin bloqueou 18+, não mostrar nada
      return { ageRating: 'BLOCKED_BY_ADMIN' } // valor impossível = retorna vazio
    }

    if (overrideRating === 'null' && !systemSettings.allowUnclassifiedContent) {
      // Admin bloqueou não classificados, não mostrar nada
      return { ageRating: 'BLOCKED_BY_ADMIN' }
    }

    return { ageRating: overrideRating === 'null' ? null : overrideRating }
  }

  // 3. Buscar preferências do usuário logado (se houver)
  const session = await getServerSession(authOptions)
  let userPreferences: string[] | null = null

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { contentPreferences: true },
    })
    userPreferences = user?.contentPreferences?.allowedRatings || null
  }

  // 4. Aplicar filtro baseado em preferências ou padrão
  let where: AgeRatingWhereClause = {}

  if (userPreferences && userPreferences.length > 0) {
    // Usuário logado com preferências definidas
    const ratings = userPreferences.filter(r => r !== 'null')
    const includeNull = userPreferences.includes('null')

    // Filtrar ratings bloqueados pelo admin
    const allowedRatings = ratings.filter(r => {
      if (r === '18' && !systemSettings.allowAdultContent) return false
      return true
    })

    const allowNull = includeNull && systemSettings.allowUnclassifiedContent

    if (allowNull && allowedRatings.length > 0) {
      where.OR = [
        { ageRating: { in: allowedRatings } },
        { ageRating: null },
      ]
    } else if (allowNull) {
      where.ageRating = null
    } else if (allowedRatings.length > 0) {
      where.ageRating = { in: allowedRatings }
    } else {
      // Usuário não tem nenhuma preferência válida (tudo bloqueado pelo admin)
      where.ageRating = 'NO_ALLOWED_RATINGS' // valor impossível = retorna vazio
    }
  } else {
    // Visitante não-logado ou usuário sem preferências → padrão seguro
    // Padrão: L, 10, 12, 14, 16 (sem 18+ e null)
    const defaultRatings = ['L', '10', '12', '14', '16']

    // Filtrar baseado em limites do admin
    const allowedRatings = defaultRatings.filter(r => {
      if (r === '18' && !systemSettings.allowAdultContent) return false
      return true
    })

    if (allowedRatings.length > 0) {
      where.ageRating = { in: allowedRatings }
    } else {
      // Caso extremo: admin bloqueou tudo (improvável)
      where.ageRating = 'NO_ALLOWED_RATINGS'
    }
  }

  return where
}
