/**
 * lib/trending/display.ts
 *
 * Configuração visual dos badges de trending.
 * Separa lógica (badges.ts) de apresentação (tailwind classes/labels).
 *
 * Badges SUBINDO/DESCENDO exibem seta + delta numérico (↑3, ↓2)
 * quando os dados de rank estão disponíveis.
 */

import type { TrendingBadge, ArtistForBadge } from './badges'
import { getArtistBadge, getRankDelta } from './badges'

export interface BadgeDisplay {
  label: string
  className: string
}

const BADGE_BASE: Record<NonNullable<TrendingBadge>, BadgeDisplay> = {
  HOT: {
    label: 'HOT',
    className: 'bg-accent-soft text-accent',
  },
  SUBINDO: {
    label: 'SUBINDO',
    className: 'bg-green-500/10 text-green-500',
  },
  NOVO: {
    label: 'NOVO',
    className: 'bg-amber-500/10 text-amber-500',
  },
}

/** Retorna a config visual do badge, ou null se não há badge. */
export function getBadgeDisplay(badge: TrendingBadge): BadgeDisplay | null {
  if (!badge) return null
  return BADGE_BASE[badge]
}

// Delta visível máximo — saltos maiores (ex: cron reativado, ranking resetado) são suprimidos
const MAX_VISIBLE_DELTA = 20

/**
 * Retorna o badge completo de um artista, com label dinâmico:
 * - SUBINDO com delta → "↑5" (verde)
 * - Queda significativa (≥ 3, ≤ MAX_VISIBLE_DELTA, fora do top 5) → "↓3" (vermelho muted)
 * - HOT / NOVO → labels estáticos
 * - null → sem badge
 */
export function getArtistBadgeDisplay(artist: ArtistForBadge): BadgeDisplay | null {
  const badge = getArtistBadge(artist)
  const delta = getRankDelta(artist)

  if (badge === 'SUBINDO') {
    const absDelta = delta !== null ? Math.abs(delta) : 0
    const label = delta !== null && delta > 0 && absDelta <= MAX_VISIBLE_DELTA ? `↑${absDelta}` : '↑'
    return { label, className: BADGE_BASE.SUBINDO.className }
  }

  // Mostra queda apenas se: queda real (delta negativo), dentro do limite visível,
  // e artista fora do top 5 (top 5 com queda pequena não precisa de aviso).
  const rank = artist.trendingRank ?? 999
  if (!badge && delta !== null && delta <= -3 && delta >= -MAX_VISIBLE_DELTA && rank > 5) {
    return {
      label: `↓${Math.abs(delta)}`,
      className: 'bg-red-500/10 text-red-400',
    }
  }

  return getBadgeDisplay(badge)
}
